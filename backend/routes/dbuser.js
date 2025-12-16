import express from "express";
import prisma from "../lib/prismaClient.js";

const router = express.Router();

// GET /api/dbusers
router.get("/", async (req, res) => {
  try {
    const users = await prisma.user.findMany();
    console.log("DB Users fetched:", users.length);
    res.json({ success: true, users });
  } catch (err) {
    console.error("Error fetching DB users:", err);
    res.json({ success: false, users: [] });
  }
});

export default router;
