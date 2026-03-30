import express from "express";
import multer from "multer";
import path from "path";
import { PrismaClient } from "@prisma/client";
import { requireAuth } from "../middleware/authMiddleware.js";
import { syncMikrotikPackages, syncMikrotikUsers } from "../services/mikrotikSync.js";

const router = express.Router();
const prisma = new PrismaClient();

// 📂 Multer storage for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage });

// ---------------------------------------------------
// GET /api/settings → fetch settings
// ---------------------------------------------------
router.get("/", async (req, res) => {
  try {
    const setting = await prisma.setting.findFirst();
    res.json(setting || null);
  } catch (error) {
    console.error("GET /api/settings error:", error);
    res.status(500).json({ error: "Failed to fetch settings" });
  }
});

// ---------------------------------------------------
// POST /api/settings → create or update settings
// ---------------------------------------------------
router.post(
  "/",
  requireAuth,
  upload.fields([
    { name: "logo", maxCount: 1 },
    { name: "favicon", maxCount: 1 },
  ]),
  async (req, res) => {
    if (req.user.role !== "SUPER_ADMIN") return res.status(403).json({ success: false, error: "Forbidden" });
    try {
      const data = {
        companyName: req.body.companyName || null,
        slogan: req.body.slogan || null,
        mobile: req.body.mobile || null,
        email: req.body.email || null,
        website: req.body.website || null,

        defaultCurrency: req.body.defaultCurrency || null,
        defaultPaymentMethod: req.body.defaultPaymentMethod || null,
        defaultPaymentRecipient: req.body.defaultPaymentRecipient || null,
        defaultVAT: req.body.defaultVAT
          ? parseFloat(req.body.defaultVAT)
          : null,

        defaultEmailApi: req.body.defaultEmailApi || null,
        defaultSmsApi: req.body.defaultSmsApi || null,
        sendSmsOnInvoice: req.body.sendSmsOnInvoice === "true",
        sendEmailOnInvoice: req.body.sendEmailOnInvoice === "true",

        mikrotikIp: req.body.mikrotikIp || null,
        mikrotikUser: req.body.mikrotikUser || null,
        mikrotikPassword: req.body.mikrotikPassword || null,

        address: req.body.address || null,
        city: req.body.city || null,
        country: req.body.country || null,
        zipCode: req.body.zipCode || null,
        copyrightText: req.body.copyrightText || null,
      };

      const baseUrl = process.env.BASE_URL || "http://localhost:3000";

      // Handle file uploads
      if (req.files?.logo) {
        data.logoUrl = `${baseUrl}/uploads/${req.files.logo[0].filename}`;
      }

      if (req.files?.favicon) {
        data.faviconUrl = `${baseUrl}/uploads/${req.files.favicon[0].filename}`;
      }

      // Check if settings exist
      let setting = await prisma.setting.findFirst();

      if (setting) {
        setting = await prisma.setting.update({
          where: { id: setting.id },
          data,
        });
      } else {
        setting = await prisma.setting.create({ data });
      }

      res.json(setting);
    } catch (error) {
      console.error("POST /api/settings error:", error);
      res.status(500).json({ error: "Failed to save settings" });
    }
  }
);

// ---------------------------------------------------
// POST /api/settings/sync → Trigger manual hardware sync
// ---------------------------------------------------
router.post("/sync", requireAuth, async (req, res) => {
  try {
    if (req.user.role !== "SUPER_ADMIN") {
      return res.status(403).json({ success: false, error: "Only SUPER_ADMIN can trigger router sync." });
    }
    const pkgRes = await syncMikrotikPackages();
    const userRes = await syncMikrotikUsers();

    return res.json({ 
      success: true, 
      message: `Sync complete. ${pkgRes.synced} packages and ${userRes.synced} users processed.`
    });
  } catch (err) {
    console.error("Manual sync error:", err);
    return res.status(500).json({ success: false, error: "Sync failed. Check hardware connectivity." });
  }
});

export default router;
