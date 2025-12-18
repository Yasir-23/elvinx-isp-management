// backend/routes/admin.js
import { Router } from "express";
import prisma from "../lib/prismaClient.js";
import { requireAuth } from "../middleware/authMiddleware.js";
import multer from "multer";
import bcrypt from "bcryptjs";

const router = Router();

// 📂 Multer storage for admin avatar
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage });

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
      return res.status(404).json({ success: false, error: "Admin not found" });
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

/**
 * PUT /api/admin/profile
 * Update admin basic profile fields
 */
router.put("/profile", requireAuth, async (req, res) => {
  try {
    const adminId = req.user.id;
    const { name, username, email } = req.body || {};

    // Basic validation
    if (!username) {
      return res
        .status(400)
        .json({ success: false, error: "Username is required" });
    }

    // Check if username already exists (excluding self)
    const existing = await prisma.admin.findFirst({
      where: {
        username,
        NOT: { id: adminId },
      },
    });

    if (existing) {
      return res
        .status(409)
        .json({ success: false, error: "Username already in use" });
    }

    const updatedAdmin = await prisma.admin.update({
      where: { id: adminId },
      data: {
        name,
        username,
        email,
      },
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        role: true,
        active: true,
        photoUrl: true,
        updatedAt: true,
      },
    });

    return res.json({
      success: true,
      admin: updatedAdmin,
    });
  } catch (err) {
    console.error("PUT /api/admin/profile error:", err);
    return res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
});

/**
 * POST /api/admin/avatar
 * Upload admin profile photo
 */
router.post(
  "/avatar",
  requireAuth,
  upload.single("avatar"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res
          .status(400)
          .json({ success: false, error: "No file uploaded" });
      }

      const adminId = req.user.id;

      // Build public URL (same pattern you use elsewhere)
      const baseUrl = process.env.BASE_URL || "http://localhost:3000";
      const photoUrl = `${baseUrl}/uploads/${req.file.filename}`;

      const updatedAdmin = await prisma.admin.update({
        where: { id: adminId },
        data: { photoUrl },
        select: {
          id: true,
          photoUrl: true,
        },
      });

      return res.json({
        success: true,
        admin: updatedAdmin,
      });
    } catch (err) {
      console.error("POST /api/admin/avatar error:", err);
      return res.status(500).json({
        success: false,
        error: "Server error",
      });
    }
  }
);

/**
 * PUT /api/admin/password
 * Change admin password
 */
router.put("/password", requireAuth, async (req, res) => {
  try {
    const adminId = req.user.id;
    const { currentPassword, newPassword } = req.body || {};

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: "Current password and new password are required",
      });
    }

    // Fetch admin
    const admin = await prisma.admin.findUnique({
      where: { id: adminId },
    });

    if (!admin) {
      return res.status(404).json({
        success: false,
        error: "Admin not found",
      });
    }

    // Verify current password
    const isMatch = await bcrypt.compare(
      currentPassword,
      admin.password
    );

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: "Current password is incorrect",
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await prisma.admin.update({
      where: { id: adminId },
      data: { password: hashedPassword },
    });

    return res.json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (err) {
    console.error("PUT /api/admin/password error:", err);
    return res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
});


export default router;
