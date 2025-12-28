import express from "express";
import { withConn } from "../services/mikrotik.js";
import prisma from "../lib/prismaClient.js";

const router = express.Router();

// ===================
// GET /api/network/router-status
// ===================
router.get("/router-status", async (req, res) => {
  try {
    const settings = await prisma.setting.findFirst({
      select: {
        mikrotikIp: true,
        mikrotikUser: true,
      },
    });

    // Fetch multiple stats from Mikrotik
    const data = await withConn(async (conn) => {
      const [resource] = await conn.write("/system/resource/print");
      const [board] = await conn.write("/system/routerboard/print");
      const activeSessions = await conn.write("/ppp/active/print");

      return {
        resource: resource || {},
        board: board || {},
        activeCount: activeSessions ? activeSessions.length : 0
      };
    });

    // Helper to convert bytes to MB
    const toMB = (bytes) => (bytes ? (parseInt(bytes) / 1024 / 1024).toFixed(1) : "0");

    res.json({
      success: true,
      online: true,
      router: {
        ip: settings?.mikrotikIp || null,
        user: settings?.mikrotikUser || null,
      },
      info: {
        uptime: data.resource.uptime,
        version: data.resource.version,
        board: data.board.model || data.resource["board-name"],
        cpuLoad: data.resource["cpu-load"],
        memory: {
          free: toMB(data.resource["free-memory"]),
          total: toMB(data.resource["total-memory"]),
        },
        disk: {
          free: toMB(data.resource["free-hdd-space"]),
          total: toMB(data.resource["total-hdd-space"]),
        },
        activeUsers: data.activeCount
      },
    });
  } catch (err) {
    console.error("❌ Router status check failed:", err.message);

    const settings = await prisma.setting.findFirst({
      select: {
        mikrotikIp: true,
        mikrotikUser: true,
      },
    });

    res.json({
      success: true, // Keep success true so frontend doesn't crash, just shows offline
      online: false,
      router: {
        ip: settings?.mikrotikIp || null,
        user: settings?.mikrotikUser || null,
      },
      error: err.message,
    });
  }
});

// ===================
// GET /api/network/interfaces
// ===================
router.get("/interfaces", async (req, res) => {
  try {
    const interfaces = await withConn(async (conn) => {
      return await conn.write("/interface/print");
    });

    res.json({
      success: true,
      interfaces: interfaces.map((iface) => ({
        name: iface.name,
        type: iface.type || "—",
        mac: iface["mac-address"] || "—",
        running: iface.running === "true",
        disabled: iface.disabled === "true",
      })),
    });
  } catch (err) {
    console.error("❌ Failed to fetch interfaces:", err.message);
    res.json({
      success: false,
      error: err.message,
      interfaces: [],
    });
  }
});

// ===================
// GET /api/network/address-lists
// ===================
router.get("/address-lists", async (req, res) => {
  try {
    const data = await withConn(async (conn) => {
      return await conn.write("/ip/firewall/address-list/print");
    });

    res.json({
      success: true,
      lists: data.map((item) => ({
        id: item[".id"],
        list: item.list,
        address: item.address,
        comment: item.comment || "",
        disabled: item.disabled === "true",
      })),
    });
  } catch (err) {
    console.error("❌ Failed to fetch address-lists:", err.message);
    res.json({
      success: false,
      lists: [],
      error: err.message,
    });
  }
});

// ===================
// GET /api/network/monitor?name=<interfaceName>
// ===================
router.get("/monitor", async (req, res) => {
  const ifaceName = req.query.name;
  if (!ifaceName) {
    return res.json({ success: false, error: "Missing ?name=" });
  }

  try {
    const data = await withConn(async (conn) => {
      // /interface/monitor-traffic interface=<name> once
      return await conn.write("/interface/monitor-traffic", [
        `=interface=${ifaceName}`,
        "=once="
      ]);
    });

    res.json({ success: true, ifaceName, data });
  } catch (err) {
    console.error("❌ monitor-traffic error:", err.message);
    res.json({ success: false, error: err.message });
  }
});


// TEMP: Raw MikroTik command executor for debugging
router.post("/raw", async (req, res) => {
  try {
    const { cmd } = req.body;
    if (!cmd) return res.json({ success: false, error: "cmd required" });

    const result = await withConn((conn) => conn.write(cmd));
    res.json({ success: true, result });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
});

// ===================
// GET /api/network/auto-config
// Automatically finds the best Local Address and Pool Name
// ===================
router.get("/auto-config", async (req, res) => {
  try {
    const data = await withConn(async (conn) => {
      // 1. Get all IP Pools
      const pools = await conn.write("/ip/pool/print");
      
      // 2. Get existing PPP Profiles (to see what is currently working)
      const profiles = await conn.write("/ppp/profile/print");

      // 3. Get Router IP Addresses (fallback if profiles are empty)
      const addresses = await conn.write("/ip/address/print");

      return { pools, profiles, addresses };
    });

    // --- 🕵️‍♂️ AUTO-DISCOVERY LOGIC ---
    
    // A. Find Best Remote Address (Pool)
    // Strategy: Look for a pool used in an existing profile first. 
    // If not found, just pick the first pool available.
    let bestPool = data.profiles.find(p => p["remote-address"])?.["remote-address"];
    
    if (!bestPool && data.pools.length > 0) {
      bestPool = data.pools[0].name;
    }

    // B. Find Best Local Address (Gateway IP)
    // Strategy: Copy from an existing profile.
    let bestLocal = data.profiles.find(p => p["local-address"])?.["local-address"];

    // Fallback: If no profile has it, look for a static IP on a "bridge" or "lan" interface
    if (!bestLocal && data.addresses.length > 0) {
      const staticIps = data.addresses.filter(a => a.dynamic !== "true");
      if (staticIps.length > 0) {
        // Prefer 'bridge' or 'lan' interface
        const bridgeIp = staticIps.find(a => a.interface.toLowerCase().includes("bridge") || a.interface.toLowerCase().includes("lan"));
        bestLocal = bridgeIp ? bridgeIp.address : staticIps[0].address;
      }
    }

    // Clean up IP (Remove CIDR suffix like /24)
    if (bestLocal && bestLocal.includes("/")) {
      bestLocal = bestLocal.split("/")[0];
    }

    res.json({
      success: true,
      suggested: {
        localAddress: bestLocal || null,
        remoteAddress: bestPool || null
      },
      // Debug info to help us verify
      debug: {
        poolsFound: data.pools.map(p => p.name),
        profilesFound: data.profiles.map(p => ({
          name: p.name, 
          local: p["local-address"], 
          remote: p["remote-address"]
        })),
        ipsFound: data.addresses.map(a => ({
          ip: a.address, 
          iface: a.interface, 
          type: a.dynamic === "true" ? "Dynamic" : "Static"
        }))
      }
    });

  } catch (err) {
    console.error("Auto-config error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});



export default router;
