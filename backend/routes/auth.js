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

    // Look up user in the unified Staff table
    const staff = await prisma.staff.findUnique({ where: { username } });
    if (!staff) {
      return res
        .status(401)
        .json({ success: false, error: "Invalid credentials" });
    }

    const ok = await bcrypt.compare(password, staff.password);
    if (!ok)
      return res
        .status(401)
        .json({ success: false, error: "Invalid credentials" });

    // Payload includes the required user's ID and role
    const token = jwt.sign(
      { id: staff.id, username: staff.username, role: staff.role },
      process.env.JWT_SECRET,
      { expiresIn: "12h" }
    );

    return res.json({
      success: true,
      token,
      user: {
        id: staff.id,
        username: staff.username,
        name: staff.name,
        email: staff.email,
        role: staff.role,
        walletBalance: staff.walletBalance, // Optionally return balance on login
      },
    });
  } catch (err) {
    console.error("Auth error:", err);
    return res.status(500).json({ success: false, error: "Server error" });
  }
});

export default router;
