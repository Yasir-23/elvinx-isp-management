import { Router } from "express";
import prisma from "../lib/prismaClient.js";
import { withConn } from "../services/mikrotik.js";
import { deleteMikrotikUser } from "../services/mikrotik.js";

const router = Router();

// Convert BigInt → Number (or string if too large)
function sanitizeBigInt(obj) {
  return JSON.parse(
    JSON.stringify(
      obj,
      (_, value) =>
        typeof value === "bigint" ? Number(value) : value
    )
  );
}


/**
 * POST /api/users
 * - Create DB user and add to MikroTik
 */
router.post("/users", async (req, res) => {
  const data = req.body || {};
  try {
    const user = await prisma.user.create({ data });

    // create in MikroTik (best-effort)
    try {
      await withConn(async (conn) => {
        await conn.write("/ppp/secret/add", [
          `=name=${data.username}`,
          `=password=${data.password}`,
          `=service=${data.connection || "pppoe"}`,
          ...(data.package ? [`=profile=${data.package}`] : []),
        ]);
      });
    } catch (mtErr) {
      console.warn(
        "Failed to add user to MikroTik (but DB saved):",
        mtErr?.message || mtErr
      );
    }

    res.json({ success: true, user });
  } catch (err) {
  console.error(err);

  if (err.code === "P2002") {
    return res.status(400).json({
      success: false,
      error: "Username already exists. Please choose another one.",
    });
  }

  res.status(500).json({
    success: false,
    error: "Failed to create user",
  });
}
});

/**
 * GET /api/users
 * Supports:
 *  - page (default 1)
 *  - limit (default 10)
 *  - sort (id, username, mobile, package, balance, connection, salesperson)
 *  - order (asc | desc)
 *  - search (matches username, name, mobile, email, salesperson)
 *  - online (optional: "all" | "online" | "offline")
 */
router.get("/users", async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      sort = "id",
      order = "desc",
      search = "",
      online = "all", // optional filter for future
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));

    // Whitelist sortable columns
    const sortableFields = [
      "id",
      "name",
      "username",
      "mobile",
      "package",
      "balance",
      "connection",
      "salesperson",
      "disabled",
      "createdAt",
    ];
    const sortField = sortableFields.includes(sort) ? sort : "id";
    const sortOrder = order === "asc" ? "asc" : "desc";

    // ---------- DB FILTER (search etc.) ----------
    const where = {};

    if (search && search.trim() !== "") {
      const s = search.trim();
      where.OR = [
        { username: { contains: s } },
        { name: { contains: s } },
        { mobile: { contains: s } },
        { email: { contains: s } },
        { salesperson: { contains: s } },
      ];
    }

    // ---------- DB QUERY ----------
    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        orderBy: { [sortField]: sortOrder },
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
      }),
    ]);

    // ---------- LIVE ONLINE STATUS FROM MIKROTIK ----------
    let activeList = [];
    try {
      activeList = await withConn(async (conn) => {
        const res = await conn.write("/ppp/active/print", []);
        return Array.isArray(res) ? res : [];
      });
    } catch (mtErr) {
      console.warn("⚠ Failed to fetch active PPP sessions:", mtErr?.message || mtErr);
      activeList = [];
    }

    const activeSet = new Set(
      activeList.map((a) => (a.name || a.user || "").toString())
    );

    // ---------- MAP TO SAFE JSON (no BigInt) + attach online ----------
    const safeUsers = users
      .map((u) => {
        const isOnline = activeSet.has((u.username || "").toString());

        // online filter (for future if needed)
        if (online === "online" && !isOnline) return null;
        if (online === "offline" && isOnline) return null;

        return {
          id: u.id,
          photoUrl: u.photoUrl,
          name: u.name,
          username: u.username,
          mobile: u.mobile,
          package: u.package,
          connection: u.connection,
          salesperson: u.salesperson,
          disabled: u.disabled,
          online: isOnline, // ✅ REAL-TIME STATUS
          createdAt: u.createdAt,

          // numeric fields safely converted
          balance: u.balance == null ? null : Number(u.balance),
          packagePrice:
            u.packagePrice == null ? null : Number(u.packagePrice),

          usedBytesTotal: u.usedBytesTotal
            ? Number(u.usedBytesTotal)
            : 0,
          lastBytesSnapshot: u.lastBytesSnapshot
            ? Number(u.lastBytesSnapshot)
            : 0,
        };
      })
      .filter(Boolean); // remove nulls if online filter applied

    res.json({
      success: true,
      data: safeUsers,
      total,
      page: pageNum,
      limit: limitNum,
    });
  } catch (err) {
    console.error("GET /api/users error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});


/**
 * POST /api/users/:id/disable  and /enable
 */
router.post("/users/:id/disable", async (req, res) => {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ success: false, error: "Invalid id" });

  try {
    const updated = await prisma.user.update({
      where: { id },
      data: { disabled: true },
    });

    // ================================
    // 1) Disable PPP Secret on MikroTik
    // ================================
    try {
      await withConn(async (conn) => {
        const secrets = await conn.write("/ppp/secret/print", [
          `?name=${updated.username}`,
        ]);
        if (Array.isArray(secrets) && secrets.length > 0) {
          const rid = secrets[0][".id"];
          await conn.write("/ppp/secret/set", [`=.id=${rid}`, `=disabled=yes`]);
        }
      });
    } catch (mtErr) {
      console.warn("Failed to disable secret on MikroTik:", mtErr?.message || mtErr);
    }

    // =====================================================
    // 2) REMOVE ACTIVE SESSION (force disconnect user)
    // =====================================================
    try {
      await withConn(async (conn) => {
        const active = await conn.write("/ppp/active/print", [
          `?name=${updated.username}`,
        ]);

        if (Array.isArray(active) && active.length > 0) {
          const rid = active[0][".id"];
          await conn.write("/ppp/active/remove", [`=.id=${rid}`]);
        }
      });
    } catch (err) {
      console.warn("Failed to remove active PPP session:", err.message);
    }
    res.json({ success: true, user: updated });

  } catch (err) {
    console.error("POST disable error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});


router.post("/users/:id/enable", async (req, res) => {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ success: false, error: "Invalid id" });
  try {
    const updated = await prisma.user.update({
      where: { id },
      data: { disabled: false },
    });

    // try enable on MikroTik (best-effort)
    try {
      await withConn(async (conn) => {
        const secrets = await conn.write("/ppp/secret/print", [
          `?name=${updated.username}`,
        ]);
        if (Array.isArray(secrets) && secrets.length > 0) {
          const rid = secrets[0][".id"];
          await conn.write("/ppp/secret/set", [`=.id=${rid}`, `=disabled=no`]);
        }
      });
    } catch (mtErr) {
      console.warn("Failed to enable on MikroTik:", mtErr?.message || mtErr);
    }

    res.json({ success: true, user: updated });
  } catch (err) {
    console.error("POST enable error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// UPDATE USER (PUT /api/users/:id)
router.put("/users/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id)
      return res.status(400).json({ success: false, error: "Invalid ID" });

    const data = req.body;

    // Convert "dataLimitGB" from frontend to Bytes for DB
    if (data.dataLimitGB !== undefined) {
      if (data.dataLimitGB === "" || data.dataLimitGB === null) {
         data.dataLimit = null; 
      } else {
         // GB to Bytes: GB * 1024 * 1024 * 1024
         data.dataLimit = BigInt(Math.floor(Number(data.dataLimitGB) * 1073741824));
      }
      // Remove the helper field so Prisma doesn't crash
      delete data.dataLimitGB;
    }

    // Update in database
    const updated = await prisma.user.update({
      where: { id },
      data,
    });
    if (data.packagePrice === "" || data.packagePrice === undefined) {
      data.packagePrice = null;
    } else {
      data.packagePrice = Number(data.packagePrice);
    }

    // Update MikroTik (if password or package changed)
    try {
      await withConn(async (conn) => {
        const secrets = await conn.write("/ppp/secret/print", [
          `?name=${updated.username}`,
        ]);
        if (Array.isArray(secrets) && secrets.length > 0) {
          const rid = secrets[0][".id"];

          const mtData = [];

          if (data.password) mtData.push(`=password=${data.password}`);
          if (data.package) mtData.push(`=profile=${data.package}`);

          if (mtData.length > 0) {
            await conn.write("/ppp/secret/set", [`=.id=${rid}`, ...mtData]);
          }
        }
      });
    } catch (err) {
      console.warn("Warning updating MikroTik:", err.message);
    }

    res.json({ success: true, user: updated });
  } catch (err) {
    console.error("PUT /api/users/:id error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/users/:id
router.delete("/users/:id", async (req, res) => {
  console.log("DELETE USER HIT:", req.params.id);

  try {
    const id = Number(req.params.id);
    if (!id)
      return res.status(400).json({ success: false, error: "Invalid ID" });

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user)
      return res.status(404).json({ success: false, error: "User not found" });

    // ===============================
    // 1) Kill active PPP session FIRST
    // ===============================
    try {
      await withConn(async (conn) => {
        const active = await conn.write("/ppp/active/print", [
          `?name=${user.username}`,
        ]);

        if (Array.isArray(active) && active.length > 0) {
          const activeId = active[0][".id"];
          console.log("KILLING ACTIVE PPP SESSION:", activeId);

          await conn.write("/ppp/active/remove", [`=.id=${activeId}`]);
        }
      });
    } catch (err) {
      console.warn("⚠ Could not kill active PPP session:", err.message);
    }

    // ============================================
    // 2) Remove PPPoE virtual interface completely
    // ============================================
    try {
      await withConn(async (conn) => {
        const ifaceName = `<pppoe-${user.username}>`;

        const iface = await conn.write("/interface/print", [
          `?name=${ifaceName}`,
        ]);

        if (Array.isArray(iface) && iface.length > 0) {
          const ifaceId = iface[0][".id"];
          console.log("REMOVING PPPoE INTERFACE:", ifaceId);

          await conn.write("/interface/remove", [`=.id=${ifaceId}`]);
        }
      });
    } catch (err) {
      console.warn("⚠ Could not remove PPPoE interface:", err.message);
    }

    // ============================================
    // 3) Remove PPP Secret using your helper
    // ============================================
    const mt = await deleteMikrotikUser(user.username);

    if (!mt.success) {
      console.warn("⚠ MikroTik delete warning:", mt.message);
    }

    // ============================================
    // 4) Remove user from your local database
    // ============================================
    await prisma.user.delete({ where: { id } });

    res.json({
      success: true,
      message: "User disconnected, removed from MikroTik & deleted from database",
    });

  } catch (err) {
    console.error("Delete user error:", err);
    res.status(500).json({
      success: false,
      error: err.message || "Server error while deleting user",
    });
  }
});

/**
 * POST /api/users/:id/renew
 * - Resets used bytes to 0
 * - Enables the user
 * - Kicks the user offline (so they reconnect with 0 bytes)
 */
router.post("/users/:id/renew", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ success: false, error: "Invalid ID" });

    // 1. Update Database: Reset usage & Enable
    const updated = await prisma.user.update({
      where: { id },
      data: {
        usedBytesTotal: 0,       // Reset Counter
        lastBytesSnapshot: 0,    // Reset Snapshot
        disabled: false,         // Enable User
      },
    });

    // 2. Update MikroTik: Enable Secret & Kill Active Session
    try {
      await withConn(async (conn) => {
        // A. Enable Secret
        const secrets = await conn.write("/ppp/secret/print", [`?name=${updated.username}`]);
        if (secrets && secrets[0]) {
           const rid = secrets[0][".id"];
           await conn.write("/ppp/secret/set", [`=.id=${rid}`, "=disabled=no"]);
        }

        // B. KILL ACTIVE SESSION (Crucial Step!) 💀
        const active = await conn.write("/ppp/active/print", [`?name=${updated.username}`]);
        if (active && active[0]) {
           const activeId = active[0][".id"];
           await conn.write("/ppp/active/remove", [`=.id=${activeId}`]);
        }
      });
    } catch (mtErr) {
      console.warn("Renew: Failed to update MikroTik", mtErr.message);
    }

    res.json({ success: true, message: "User renewed & session reset." });

  } catch (err) {
    console.error("Renew error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});


export default router;
