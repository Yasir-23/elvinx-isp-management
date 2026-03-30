import { Router } from "express";
import { withConn } from "../services/mikrotik.js";
import prisma from "../lib/prismaClient.js";

import { requireAuth } from "../middleware/authMiddleware.js";
import { hierarchyScope } from "../middleware/hierarchyScope.js";

const router = Router();

/**
 * GET /api/dashboard/user-stats
 */
router.get("/user-stats", requireAuth, hierarchyScope, async (req, res) => {
  try {
    const now = new Date();

    const baseWhere = {};
    if (req.scopedStaffIds !== null) {
      baseWhere.staffId = { in: req.scopedStaffIds };
    }

    // 1️⃣ Total users from DB
    const totalUsers = await prisma.user.count({ where: baseWhere });

    // 2️⃣ Active users = not disabled
    const activeUsers = await prisma.user.count({ where: { ...baseWhere, disabled: false } });

    // 3️⃣ Calculate Expired vs Manual Disabled
    // "Expired" = Disabled AND Expiry Date is in the past
    const expiredUsers = await prisma.user.count({
      where: {
        ...baseWhere,
        disabled: true,
        expiryDate: { lt: now }, 
      },
    });

    // Total Disabled (includes both Expired and Manual)
    const totalDisabled = await prisma.user.count({ where: { ...baseWhere, disabled: true } });
    
    // "Manual Disabled" = Total Disabled - Expired
    const manualDisabled = totalDisabled - expiredUsers;

    // 4️⃣ MikroTik active sessions (for Online count)
    const activeSessions = await withConn(async (conn) => {
      const result = await conn.write("/ppp/active/print");
      return Array.isArray(result) ? result : [];
    }).catch(err => {
      console.warn("Dashboard mt error", err.message);
      return [];
    });

    let onlineUsers = 0;
    if (req.scopedStaffIds !== null) {
      const allowedUsers = await prisma.user.findMany({
        where: baseWhere,
        select: { username: true }
      });
      const allowedUsernames = new Set(allowedUsers.map(u => u.username));
      onlineUsers = activeSessions.filter(session => allowedUsernames.has(session.name)).length;
    } else {
      onlineUsers = activeSessions.length;
    }

    // 5️⃣ Chart Data: User Status
    // Offline = Total - Online - TotalDisabled
    const offlineCount = totalUsers - onlineUsers - totalDisabled;
    
    const userStatusChart = [
      { name: "Online", value: onlineUsers, color: "#10b981" },   // Green
      { name: "Offline", value: offlineCount < 0 ? 0 : offlineCount, color: "#94a3b8" }, // Gray
      { name: "Expired", value: expiredUsers, color: "#f97316" }, // Orange (NEW)
      { name: "Disabled", value: manualDisabled, color: "#ef4444" }, // Red
    ];

    // 6️⃣ Chart Data: Top 5 Packages
    const packageGroups = await prisma.user.groupBy({
      by: ['package'],
      where: baseWhere,
      _count: { package: true },
      orderBy: { _count: { package: 'desc' } },
      take: 5,
    });

    const packageChart = packageGroups.map(p => ({
      name: p.package || "Unknown",
      count: p._count.package,
    }));

    res.json({
      totalUsers,
      activeUsers,
      onlineUsers,
      disabledUsers: manualDisabled, // Show only manual blocks here
      expiredUsers,                  // ✅ NEW FIELD
      charts: {
        userStatus: userStatusChart,
        packagePopularity: packageChart
      }
    });
  } catch (err) {
    console.error("GET /api/dashboard/user-stats error:", err);

    res.status(500).json({
      totalUsers: 0,
      activeUsers: 0,
      onlineUsers: 0,
      disabledUsers: 0,
      error: err.message,
    });
  }
});

export default router;
