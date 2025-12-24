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
      const exists = profiles.some((p) => p["rate-limit"] === rateLimit);

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
    const sortableFields = [
      "id",
      "displayName",
      "name",
      "regularPrice",
      "createdAt",
    ];
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

    // ---------- USERS COUNT (Phase 1) ----------
    const usersGrouped = await prisma.user.groupBy({
      by: ["package"],
      _count: {
        package: true,
      },
    });

    // Convert to lookup map: { "8 Mbps": 12 }
    const usersCountMap = {};
    for (const row of usersGrouped) {
      if (row.package) {
        usersCountMap[row.package] = row._count.package;
      }
    }


    // ---------- ACTIVE USERS FROM MIKROTIK (Phase 2) ----------
    let activeUsernames = new Set();

    try {
      const activeList = await withConn(async (conn) => {
        const res = await conn.write("/ppp/active/print", []);
        return Array.isArray(res) ? res : [];
      });

      activeUsernames = new Set(
        activeList
          .map((a) => (a.name || a.user || "").toString())
          .filter(Boolean)
      );
    } catch (mtErr) {
      console.warn(
        "⚠ Failed to fetch active PPP sessions:",
        mtErr?.message || mtErr
      );
      activeUsernames = new Set();
    }

    // ---------- ACTIVE COUNT BY PACKAGE ----------
    let activeCountMap = {};

    if (activeUsernames.size > 0) {
      const activeUsers = await prisma.user.findMany({
        where: {
          disabled: false,
          username: {
            in: Array.from(activeUsernames),
          },
        },
        select: {
          username: true,
          package: true,
        },
      });

      for (const u of activeUsers) {
        if (!u.package) continue;
        activeCountMap[u.package] = (activeCountMap[u.package] || 0) + 1;
      }
    }

    // Ensure numeric safety
    const data = rows.map((p) => ({
      id: p.id,
      displayName: p.displayName,
      name: p.name,
      regularPrice: p.regularPrice == null ? null : Number(p.regularPrice),
      createdAt: p.createdAt,
      usersCount: usersCountMap[p.name] || 0,
      activeCount: activeCountMap[p.name] || 0,
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

/**
 * GET /api/packages/:id
 * Get single package details for Edit Package page
 */
router.get("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid package id",
      });
    }

    // 1️⃣ Fetch package
    const pkg = await prisma.package.findUnique({
      where: { id },
    });

    if (!pkg) {
      return res.status(404).json({
        success: false,
        error: "Package not found",
      });
    }

    // 2️⃣ Users count (DB)
    const usersCount = await prisma.user.count({
      where: {
        package: pkg.name,
      },
    });

    // 3️⃣ Active users (MikroTik)
    let activeUsernames = new Set();

    try {
      const activeList = await withConn(async (conn) => {
        const res = await conn.write("/ppp/active/print", []);
        return Array.isArray(res) ? res : [];
      });

      activeUsernames = new Set(
        activeList
          .map((a) => (a.name || a.user || "").toString())
          .filter(Boolean)
      );
    } catch (mtErr) {
      console.warn(
        "⚠ Failed to fetch active PPP sessions:",
        mtErr?.message || mtErr
      );
      activeUsernames = new Set();
    }

    // 4️⃣ Active count mapped via DB usernames
    let activeCount = 0;

    if (activeUsernames.size > 0) {
      activeCount = await prisma.user.count({
        where: {
          disabled: false,
          package: pkg.name,
          username: {
            in: Array.from(activeUsernames),
          },
        },
      });
    }

    // 5️⃣ Response
    return res.json({
      success: true,
      package: {
        id: pkg.id,
        displayName: pkg.displayName,
        name: pkg.name,
        rateLimit: pkg.rateLimit,
        regularPrice: pkg.regularPrice,
        ispCost: pkg.ispCost,
        createdAt: pkg.createdAt,
        usersCount,
        activeCount,
      },
    });
  } catch (err) {
    console.error("GET /api/packages/:id error:", err);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch package",
    });
  }
});

/**
 * PUT /api/packages/:id
 * Update ONLY safe fields: displayName, regularPrice, ispCost
 */
router.put("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid package id",
      });
    }

    // Disallow dangerous fields
    if ("name" in req.body || "rateLimit" in req.body) {
      return res.status(400).json({
        success: false,
        error: "Volume and rateLimit cannot be updated",
      });
    }

    const { displayName, regularPrice, ispCost } = req.body;

    // Validate numeric fields if provided
    const rp =
      regularPrice === undefined || regularPrice === null
        ? undefined
        : Number(regularPrice);

    const ic =
      ispCost === undefined || ispCost === null ? undefined : Number(ispCost);

    if (rp !== undefined && (Number.isNaN(rp) || rp < 0)) {
      return res.status(400).json({
        success: false,
        error: "Invalid regularPrice",
      });
    }

    if (ic !== undefined && (Number.isNaN(ic) || ic < 0)) {
      return res.status(400).json({
        success: false,
        error: "Invalid ispCost",
      });
    }

    // displayName may be string or null/undefined
    if (
      displayName !== undefined &&
      displayName !== null &&
      typeof displayName !== "string"
    ) {
      return res.status(400).json({
        success: false,
        error: "Invalid displayName",
      });
    }

    // Ensure package exists
    const existing = await prisma.package.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        error: "Package not found",
      });
    }

    // Update only provided safe fields
    const updated = await prisma.package.update({
      where: { id },
      data: {
        ...(displayName !== undefined ? { displayName } : {}),
        ...(rp !== undefined ? { regularPrice: rp } : {}),
        ...(ic !== undefined ? { ispCost: ic } : {}),
      },
      select: {
        id: true,
        displayName: true,
        name: true,
        rateLimit: true,
        regularPrice: true,
        ispCost: true,
        createdAt: true,
      },
    });

    return res.json({
      success: true,
      package: updated,
    });
  } catch (err) {
    console.error("PUT /api/packages/:id error:", err);
    return res.status(500).json({
      success: false,
      error: "Failed to update package",
    });
  }
});

export default router;
