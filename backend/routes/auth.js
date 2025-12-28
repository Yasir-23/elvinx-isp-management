// backend/routes/auth.js
import { Router } from "express";
import prisma from "../lib/prismaClient.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const router = Router();

router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body || {};
    if (!username || !password)
      return res.status(400).json({ success: false, error: "Missing credentials" });

    // Try admin table first
    const admin = await prisma.admin.findUnique({ where: { username } });
    if (!admin) {
      return res
        .status(401)
        .json({ success: false, error: "Invalid credentials" });
    }

    const ok = await bcrypt.compare(password, admin.password);
    if (!ok)
      return res
        .status(401)
        .json({ success: false, error: "Invalid credentials" });

    const token = jwt.sign(
      { id: admin.id, username: admin.username, role: admin.role },
      process.env.JWT_SECRET,
      { expiresIn: "12h" }
    );

    return res.json({
      success: true,
      token,
      user: {
        id: admin.id,
        username: admin.username,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (err) {
    console.error("Auth error:", err);
    return res.status(500).json({ success: false, error: "Server error" });
  }
});

export default router;
