import { Router } from "express";
import prisma from "../lib/prismaClient.js";
import { withConn } from "../services/mikrotik.js";

const router = Router();

/**
 * Normalize package volume into MikroTik rate-limit format
 * Examples:
 *  - 4mb/4mb
 *  - 4M/4M
 *  - 4 m / 4 m
 * → 4M/4M
 */
function normalizeRateLimit(input) {
  if (!input || typeof input !== "string") return null;

  const cleaned = input.replace(/\s+/g, "").toLowerCase();
  const match = cleaned.match(/^(\d+)(m|mb)\/(\d+)(m|mb)$/);

  if (!match) return null;

  const rx = match[1];
  const tx = match[3];

  return `${rx}M/${tx}M`;
}

/**
 * Generate MikroTik PPP profile name from rate-limit
 * Example:
 *  4M/4M → 4 Mbps
 */
function profileNameFromRateLimit(rateLimit) {
  const rx = rateLimit.split("/")[0].replace("M", "");
  return `${rx} Mbps`;
}

/**
 * POST /api/packages
 * Create PPP profile (package) in MikroTik
 */
router.post("/", async (req, res) => {
  const { displayName, volume, regularPrice, ispCost } = req.body || {};

  // 1️⃣ Normalize volume
  const rateLimit = normalizeRateLimit(volume);
  if (!rateLimit) {
    return res.status(400).json({
      success: false,
      error: "Invalid package volume format",
    });
  }

  if (!displayName) {
  return res.status(400).json({
    success: false,
    error: "Package name is required",
  });
}

const regPrice = Number(regularPrice);
const costPrice = Number(ispCost);

if (isNaN(regPrice) || isNaN(costPrice)) {
  return res.status(400).json({
    success: false,
    error: "Regular price and ISP cost must be numbers",
  });
}


  // 2️⃣ Generate profile name
  const profileName = profileNameFromRateLimit(rateLimit);

  try {
    // 3️⃣ MikroTik interaction
    await withConn(async (conn) => {
      // Fetch existing PPP profiles
      const profiles = await conn.write("/ppp/profile/print");
      console.log("Existing profiles:", profiles);

      // Prevent duplicate bandwidth
      const exists = profiles.some(
        (p) => p["rate-limit"] === rateLimit
      );

      if (exists) {
        throw new Error("DUPLICATE_RATE_LIMIT");
      }

      // Create PPP profile
      await conn.write("/ppp/profile/add", [
        `=name=${profileName}`,
        `=rate-limit=${rateLimit}`,
      ]);
    });

    // 4️⃣ Save minimal record in DB
    const pkg = await prisma.package.create({
      data: {
        displayName,
        name: profileName,
        rateLimit,
        regularPrice: regPrice,
        ispCost: costPrice,
      },
    });

    return res.status(201).json({
      success: true,
      package: {
        name: pkg.name,
        rateLimit: pkg.rateLimit,
        profit: pkg.regularPrice - pkg.ispCost,
      },
    });
  } catch (err) {
    console.error("POST /api/packages error:", err);

    if (err.message === "DUPLICATE_RATE_LIMIT") {
      return res.status(400).json({
        success: false,
        error: `Package with bandwidth ${rateLimit} already exists`,
      });
    }

    return res.status(502).json({
      success: false,
      error: "Failed to create package in MikroTik",
    });
  }
});

/**
 * GET /api/packages   (frontend calls: GET /packages because api baseURL is /api)
 * Supports:
 *  - page (default 1)
 *  - limit (default 10)
 *  - sort (id, displayName, name, regularPrice, createdAt)
 *  - order (asc | desc)
 *  - search (matches displayName, name)
 *
 * NOTE: No usersCount / activeCount yet (we add later as final step)
 */
router.get("/", async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      sort = "id",
      order = "desc",
      search = "",
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));

    // Whitelist sortable columns (IMPORTANT)
    const sortableFields = ["id", "displayName", "name", "regularPrice", "createdAt"];
    const sortField = sortableFields.includes(sort) ? sort : "id";
    const sortOrder = order === "asc" ? "asc" : "desc";

    // Search filter
    const where = {};
    if (search && search.trim() !== "") {
      const s = search.trim();
      where.OR = [
        { displayName: { contains: s } },
        { name: { contains: s } }, // Volume column
      ];
    }

    const [total, rows] = await Promise.all([
      prisma.package.count({ where }),
      prisma.package.findMany({
        where,
        orderBy: { [sortField]: sortOrder },
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
        select: {
          id: true,
          displayName: true,
          name: true, // volume
          regularPrice: true,
          createdAt: true,
        },
      }),
    ]);

    // Ensure numeric safety
    const data = rows.map((p) => ({
      id: p.id,
      displayName: p.displayName,
      name: p.name,
      regularPrice: p.regularPrice == null ? null : Number(p.regularPrice),
      createdAt: p.createdAt,
    }));

    return res.json({
      success: true,
      data,
      total,
      page: pageNum,
      limit: limitNum,
    });
  } catch (err) {
    console.error("GET /api/packages error:", err);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch packages",
    });
  }
});


/**
 * POST /api/packages/sync
 * One-time sync: MikroTik PPP profiles → DB packages
 */
router.post("/sync", async (req, res) => {
  try {
    let totalProfiles = 0;
    let inserted = 0;
    let skipped = 0;

    await withConn(async (conn) => {
      // 1️⃣ Fetch all PPP profiles from MikroTik
      const profiles = await conn.write("/ppp/profile/print");
      totalProfiles = profiles.length;

      for (const p of profiles) {
        const name = p.name;
        const rateLimit = p["rate-limit"];

        // 2️⃣ Filter invalid / non-package profiles
        if (
          !name ||
          name === "default" ||
          !rateLimit ||
          typeof rateLimit !== "string" ||
          !/^\d+M\/\d+M$/.test(rateLimit)
        ) {
          skipped++;
          continue;
        }

        // 3️⃣ Check DB for existing package by rateLimit
        const exists = await prisma.package.findFirst({
          where: { rateLimit },
        });

        if (exists) {
          skipped++;
          continue;
        }

        // 4️⃣ Insert into DB
        await prisma.package.create({
          data: {
            name,
            rateLimit,
          },
        });

        inserted++;
      }
    });

    return res.json({
      success: true,
      totalProfiles,
      inserted,
      skipped,
    });
  } catch (err) {
    console.error("POST /api/packages/sync error:", err);
    return res.status(500).json({
      success: false,
      error: "Failed to sync packages from MikroTik",
    });
  }
});

export default router;
