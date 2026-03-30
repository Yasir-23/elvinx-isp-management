import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * 🔹 Recursive Helper: getDescendantStaffIds
 * Traverses the self-referencing Staff table to find all downstream users.
 * Uses a dynamic Breadth-First Search (BFS) array-merging loop. 
 * Even though the hierarchy is capped at 4 tiers (Super Admin -> Franchise -> Dealer -> Sub-Dealer),
 * this approach gracefully handles arbitrary depths without crashing or hardcoded deep-includes.
 * 
 * @param {number} staffId - The ID of the currently logged in Manager/Staff
 * @returns {number[]} Array including the requesting staffId AND all downstream children IDs
 */
export async function getDescendantStaffIds(staffId) {
  let allIds = [staffId];
  let currentIdsToSearch = [staffId];

  while (currentIdsToSearch.length > 0) {
    // Find next level down: staff who report to anyone in currentIdsToSearch
    const children = await prisma.staff.findMany({
      where: {
        parentId: { in: currentIdsToSearch }
      },
      select: { id: true }
    });

    if (children.length === 0) break;

    const childIds = children.map(c => c.id);
    
    // Add these children to the master list of allowed IDs
    allIds = allIds.concat(childIds);
    
    // Set up the next loop iteration to search for their grandchildren
    currentIdsToSearch = childIds; 
  }

  return allIds;
}

/**
 * 🔹 Express Middleware: hierarchyScope
 * Enforces the "Data Isolation" boundary.
 * Calculates what the logged-in user is allowed to see and mutates the original `req` object seamlessly.
 */
export async function hierarchyScope(req, res, next) {
  try {
    const userRole = req.user?.role;
    const userId = req.user?.id; // Assumes standard auth token decoded payload

    if (!userRole || !userId) {
      return res.status(401).json({ error: "Unauthorized access. User not identified in request payload." });
    }

    // 1) Super Admin: Global Vision
    if (userRole === "SUPER_ADMIN") {
      // Attaching null to explicitly denote "no boundaries / where clauses needed"
      req.scopedStaffIds = null; 
      return next();
    }

    // 2) Lower Tiers: Restricted Vision
    // Resolving their ID and all subsequent children they brought into the ecosystem
    const scopedIds = await getDescendantStaffIds(userId);
    
    // Attach array of allowed IDs to the request chain
    // (e.g. req.scopedStaffIds = [14, 15, 16])
    req.scopedStaffIds = scopedIds;
    
    next();
  } catch (error) {
    console.error("Hierarchy Scope Error:", error);
    res.status(500).json({ error: "Failed to enforce data isolation constraints." });
  }
}
