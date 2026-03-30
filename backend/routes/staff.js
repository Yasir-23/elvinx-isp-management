// backend/routes/staff.js
import { Router } from "express";
import prisma from "../lib/prismaClient.js";
import { requireAuth } from "../middleware/authMiddleware.js";
import { hierarchyScope } from "../middleware/hierarchyScope.js";
import bcrypt from "bcryptjs";

const router = Router();

// GET /api/staff
router.get("/", requireAuth, hierarchyScope, async (req, res) => {
  try {
    const scopedIds = req.scopedStaffIds;

    let whereClause = {};
    if (scopedIds !== null) {
      // Not a SUPER_ADMIN, enforce isolation array boundaries
      whereClause = { id: { in: scopedIds } };
    }

    const staffData = await prisma.staff.findMany({
      where: whereClause,
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        phone: true,
        area: true,
        role: true,
        active: true,
        photoUrl: true,
        walletBalance: true,
        createdAt: true,
        updatedAt: true,
        // Explicitly omitting the 'password' field
        parent: {
          select: {
            username: true
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    res.json({ success: true, staff: staffData });
  } catch (err) {
    console.error("GET /api/staff error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch staff data." });
  }
});

// POST /api/staff
router.post("/", requireAuth, async (req, res) => {
  try {
    const { name, username, password, email, phone, area, role } = req.body;
    
    // Check role hierarchy
    const creatorRole = req.user.role;
    const allowedRoles = [];
    if (creatorRole === "SUPER_ADMIN") allowedRoles.push("FRANCHISE", "DEALER", "SUB_DEALER");
    else if (creatorRole === "FRANCHISE") allowedRoles.push("DEALER", "SUB_DEALER");
    else if (creatorRole === "DEALER") allowedRoles.push("SUB_DEALER");

    if (!allowedRoles.includes(role)) {
      return res.status(403).json({ success: false, error: "Not authorized to create this role" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    const newStaff = await prisma.staff.create({
      data: {
        name,
        username,
        password: hashedPassword,
        email,
        phone,
        area,
        role,
        parentId: req.user.id,
        walletBalance: 0,
        active: true,
      }
    });

    res.status(201).json({ success: true, staff: { id: newStaff.id, username: newStaff.username, role: newStaff.role } });
  } catch (err) {
    console.error("POST /api/staff error:", err);
    res.status(500).json({ success: false, error: "Failed to create staff" });
  }
});

export default router;
