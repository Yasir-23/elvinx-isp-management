import { Router } from "express";
import { withConn } from "../services/mikrotik.js";
import prisma from "../lib/prismaClient.js";

const router = Router();

/**
 * GET /api/dashboard/user-stats
 */
router.get("/user-stats", async (req, res) => {
  try {
    const now = new Date();

    // 1️⃣ Total users from DB
    const totalUsers = await prisma.user.count();

    // 2️⃣ Active users = not disabled
    const activeUsers = await prisma.user.count({ where: { disabled: false } });

    // 3️⃣ Calculate Expired vs Manual Disabled
    // "Expired" = Disabled AND Expiry Date is in the past
    const expiredUsers = await prisma.user.count({
      where: {
        disabled: true,
        expiryDate: { lt: now }, 
      },
    });

    // Total Disabled (includes both Expired and Manual)
    const totalDisabled = await prisma.user.count({ where: { disabled: true } });
    
    // "Manual Disabled" = Total Disabled - Expired
    const manualDisabled = totalDisabled - expiredUsers;

    // 4️⃣ MikroTik active sessions (for Online count)
    const activeSessions = await withConn(async (conn) => {
      return await conn.write("/ppp/active/print");
    });
    const onlineUsers = (activeSessions || []).length;

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
