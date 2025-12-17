import { Router } from "express";
import { withConn } from "../services/mikrotik.js";
import prisma from "../lib/prismaClient.js";

const router = Router();

/**
 * GET /api/dashboard/user-stats
 */
router.get("/user-stats", async (req, res) => {
  try {
    // 1️⃣ Total users from DB
    const totalUsers = await prisma.user.count();

    // 2️⃣ MikroTik PPPoE secrets
    const secrets = await withConn(async (conn) => {
      return await conn.write("/ppp/secret/print");
    });

    // Active users = not disabled
    const activeUsers = await prisma.user.count({
      where: { disabled: false },
    });

    // 3️⃣ MikroTik active sessions
    const activeSessions = await withConn(async (conn) => {
      return await conn.write("/ppp/active/print");
    });

    const disabledUsers = await prisma.user.count({
      where: { disabled: true },
    });

    const onlineUsers = (activeSessions || []).length;

    res.json({
      totalUsers,
      activeUsers,
      onlineUsers,
      disabledUsers,
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
