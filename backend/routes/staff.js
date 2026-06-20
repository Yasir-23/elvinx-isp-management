// backend/routes/staff.js
import { Router } from "express";
import prisma from "../lib/prismaClient.js";
import { requireAuth } from "../middleware/authMiddleware.js";
import { hierarchyScope } from "../middleware/hierarchyScope.js";
import bcrypt from "bcryptjs";
import { validateGrantablePackageIds } from "../lib/staffPackageAccess.js";

const router = Router();

function getAllowedChildRoles(role) {
  if (role === "SUPER_ADMIN") return ["FRANCHISE", "DEALER", "SUB_DEALER"];
  if (role === "FRANCHISE") return ["DEALER", "SUB_DEALER"];
  if (role === "DEALER") return ["SUB_DEALER"];
  return [];
}

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
        parentId: true,
        active: true,
        photoUrl: true,
        walletBalance: true,
        createdAt: true,
        updatedAt: true,
        packageAssignments: {
          select: {
            packageId: true,
            package: {
              select: {
                id: true,
                name: true,
                displayName: true,
                sellable: true,
              },
            },
          },
        },
        // Explicitly omitting the 'password' field
        parent: {
          select: {
            username: true
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    res.json({
      success: true,
      staff: staffData.map((staff) => ({
        ...staff,
        packageIds: staff.packageAssignments.map((assignment) => assignment.packageId),
      })),
    });
  } catch (err) {
    console.error("GET /api/staff error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch staff data." });
  }
});

// POST /api/staff
router.post("/", requireAuth, async (req, res) => {
  try {
    const { name, username, password, email, phone, area, role, packageIds } = req.body;
    
    // Check role hierarchy
    const creatorRole = req.user.role;
    const allowedRoles = getAllowedChildRoles(creatorRole);

    if (!allowedRoles.includes(role)) {
      return res.status(403).json({ success: false, error: "Not authorized to create this role" });
    }

    const { packageIds: normalizedPackageIds, invalidPackageIds } =
      await validateGrantablePackageIds(req.user, packageIds);

    if (invalidPackageIds.length > 0) {
      return res.status(403).json({
        success: false,
        error: "You can only assign packages from your own allowed set",
        invalidPackageIds,
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newStaff = await prisma.$transaction(async (tx) => {
      const createdStaff = await tx.staff.create({
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

      if (normalizedPackageIds.length > 0) {
        await tx.staffPackageAssignment.createMany({
          data: normalizedPackageIds.map((packageId) => ({
            staffId: createdStaff.id,
            packageId,
          })),
        });
      }

      return createdStaff;
    });

    res.status(201).json({
      success: true,
      staff: {
        id: newStaff.id,
        username: newStaff.username,
        role: newStaff.role,
        packageIds: normalizedPackageIds,
      },
    });
  } catch (err) {
    console.error("POST /api/staff error:", err);
    if (err.code === "P2002") {
      return res.status(400).json({ success: false, error: "Username already exists" });
    }
    if (err.code === "INVALID_PACKAGE_IDS") {
      return res.status(400).json({ success: false, error: err.message });
    }
    res.status(500).json({ success: false, error: "Failed to create staff" });
  }
});

// PUT /api/staff/:id/packages
router.put("/:id/packages", requireAuth, hierarchyScope, async (req, res) => {
  try {
    const staffId = Number(req.params.id);
    if (!staffId || Number.isNaN(staffId)) {
      return res.status(400).json({ success: false, error: "Invalid staff id" });
    }

    const targetStaff = await prisma.staff.findUnique({
      where: { id: staffId },
      select: {
        id: true,
        username: true,
        role: true,
        parentId: true,
      },
    });

    if (!targetStaff) {
      return res.status(404).json({ success: false, error: "Staff not found" });
    }

    if (targetStaff.role === "SUPER_ADMIN") {
      return res.status(403).json({
        success: false,
        error: "Super admin package assignments cannot be edited",
      });
    }

    if (req.scopedStaffIds !== null && !req.scopedStaffIds.includes(targetStaff.id)) {
      return res.status(403).json({
        success: false,
        error: "You do not have permission to edit this staff member",
      });
    }

    if (req.user.role !== "SUPER_ADMIN") {
      const allowedChildRoles = getAllowedChildRoles(req.user.role);

      if (targetStaff.parentId !== req.user.id || !allowedChildRoles.includes(targetStaff.role)) {
        return res.status(403).json({
          success: false,
          error: "You can only edit package assignments for your direct children",
        });
      }
    }

    const { packageIds: normalizedPackageIds, invalidPackageIds } =
      await validateGrantablePackageIds(req.user, req.body?.packageIds);

    if (invalidPackageIds.length > 0) {
      return res.status(403).json({
        success: false,
        error: "You can only assign packages from your own allowed set",
        invalidPackageIds,
      });
    }

    await prisma.$transaction(async (tx) => {
      await tx.staffPackageAssignment.deleteMany({
        where: { staffId: targetStaff.id },
      });

      if (normalizedPackageIds.length > 0) {
        await tx.staffPackageAssignment.createMany({
          data: normalizedPackageIds.map((packageId) => ({
            staffId: targetStaff.id,
            packageId,
          })),
        });
      }
    });

    return res.json({
      success: true,
      staff: {
        id: targetStaff.id,
        username: targetStaff.username,
        role: targetStaff.role,
        packageIds: normalizedPackageIds,
      },
    });
  } catch (err) {
    console.error("PUT /api/staff/:id/packages error:", err);
    if (err.code === "INVALID_PACKAGE_IDS") {
      return res.status(400).json({ success: false, error: err.message });
    }
    return res.status(500).json({
      success: false,
      error: "Failed to update staff package assignments",
    });
  }
});

export default router;
