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

    const result = await withConn(async (conn) => {
      const data = await conn.write("/system/resource/print");
      return data[0];
    });

    res.json({
      success: true,
      online: true,
      router: {
        ip: settings?.mikrotikIp || null,
        user: settings?.mikrotikUser || null,
      },
      info: {
        uptime: result.uptime,
        version: result.version,
        board: result.boardName,
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
      success: true,
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



export default router;
