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
  const { volume } = req.body || {};

  // 1️⃣ Normalize volume
  const rateLimit = normalizeRateLimit(volume);
  if (!rateLimit) {
    return res.status(400).json({
      success: false,
      error: "Invalid package volume format",
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
        name: profileName,
        rateLimit,
      },
    });

    return res.status(201).json({
      success: true,
      package: {
        name: pkg.name,
        rateLimit: pkg.rateLimit,
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

export default router;
