import { Router } from "express";
import { withConn } from "../services/mikrotik.js";

const router = Router();

/**
 * GET /api/pppoe/users
 * GET /api/pppoe/active
 * GET /api/pppoe/profiles
 */
router.get("/users", async (req, res) => {
  const name = req.query.name;
  try {
    const data = await withConn(async (conn) => {
      const q = name ? [`?name=${name}`] : [];
      return await conn.write("/ppp/secret/print", q);
    });
    res.json({ success: true, data });
  } catch (err) {
    console.error("GET /api/pppoe/users error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get("/active", async (req, res) => {
  const name = req.query.name;
  try {
    const data = await withConn(async (conn) => {
      const q = name ? [`?name=${name}`] : [];
      return await conn.write("/ppp/active/print", q);
    });
    res.json({ success: true, data });
  } catch (err) {
    console.error("GET /api/pppoe/active error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get("/profiles", async (req, res) => {
  try {
    const data = await withConn(async (conn) => {
      return await conn.write("/ppp/profile/print");
    });
    res.json({ success: true, data });
  } catch (err) {
    console.error("GET /api/pppoe/profiles error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get("/debug/iface", async (req, res) => {
  const user = req.query.name;
  if (!user) return res.json({ success: false, error: "Missing name" });

  const ifaceName = `pppoe-${user}`;

  try {
    const result = await withConn(async (conn) => {
      return await conn.write("/interface/print", [
        `?name=${ifaceName}`,
        "=.proplist=name,rx-byte,tx-byte,rx-packet,tx-packet"
      ]);
    });

    res.json({ success: true, ifaceName, result });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
});

router.get("/interfaces", async (req, res) => {
  try {
    const data = await withConn(async (conn) => {
      return await conn.write("/interface/print");
    });

    res.json({ success: true, data });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
});


export default router;
