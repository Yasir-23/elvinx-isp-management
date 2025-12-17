// backend/routes/admin.js
import { Router } from "express";
import prisma from "../lib/prismaClient.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = Router();

/**
 * GET /api/admin/me
 * Returns currently logged-in admin profile
 */
router.get("/me", requireAuth, async (req, res) => {
  try {
    const adminId = req.user.id;

    const admin = await prisma.admin.findUnique({
      where: { id: adminId },
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        role: true,
        active: true,
        photoUrl: true, // will exist after we add field
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!admin) {
      return res
        .status(404)
        .json({ success: false, error: "Admin not found" });
    }

    return res.json({
      success: true,
      admin,
    });
  } catch (err) {
    console.error("GET /api/admin/me error:", err);
    return res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
});

export default router;
