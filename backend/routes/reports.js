// import { Router } from "express";
// import { getReportUsers } from "../services/mikrotikSync.js";

// const router = Router();

// /**
//  * GET /api/reports/users
//  * - accepts filter/page/limit/search/sort/order (same as before)
//  */
// router.get("/users", async (req, res) => {
//   try {
//     const result = await getReportUsers(req.query);
//     res.json({ success: true, data: result.data, total: result.total });
//   } catch (err) {
//     console.error("GET /api/reports/users error:", err);
//     res.status(500).json({ success: false, error: err.message || "Server error" });
//   }
// });


// export default router;

import { Router } from "express";
import prisma from "../lib/prismaClient.js";

const router = Router();

/**
 * GET /api/reports/users
 * - Fetch users from DB
 * - Supports filter (expired, expiring1, expiring3, expiring7, expiring14, disabled, all)
 * - Supports pagination, search, sorting
 */
router.get("/users", async (req, res) => {
  try {
    const {
      filter = "all",
      page = 1,
      limit = 10,
      search,
      sort = "id",
      order = "desc",
    } = req.query;

    const where = {};

    // --- Expiry-based filters ---
    if (filter === "expired") {
      where.expiryDate = { lt: new Date() };
    } else if (filter === "expiring1") {
      const now = new Date();
      const next = new Date();
      next.setDate(now.getDate() + 1);
      where.expiryDate = { gte: now, lte: next };
    } else if (filter === "expiring3") {
      const now = new Date();
      const next = new Date();
      next.setDate(now.getDate() + 3);
      where.expiryDate = { gte: now, lte: next };
    } else if (filter === "expiring7") {
      const now = new Date();
      const next = new Date();
      next.setDate(now.getDate() + 7);
      where.expiryDate = { gte: now, lte: next };
    } else if (filter === "expiring14") {
      const now = new Date();
      const next = new Date();
      next.setDate(now.getDate() + 14);
      where.expiryDate = { gte: now, lte: next };
    } else if (filter === "disabled") {
      where.disabled = true;
    }

    // --- Search ---
    if (search) {
      const lowerSearch = search.toLowerCase();
      where.OR = [
    { username: { contains: lowerSearch } },
    { name: { contains: lowerSearch } },
    { mobile: { contains: lowerSearch } },
  ];
    }


    // --- Fetch paginated + sorted data ---
    const [data, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        orderBy: { [sort]: order },
      }),
      prisma.user.count({ where }),
    ]);

    res.json({ success: true, data, total });
  } catch (err) {
    console.error("GET /api/reports/users error:", err);
    res
      .status(500)
      .json({ success: false, error: err.message || "Server error" });
  }
});

export default router;






