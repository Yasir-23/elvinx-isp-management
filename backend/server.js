import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

import {requireAuth} from "./middleware/authMiddleware.js"
import mikrotikRouter from "./routes/mikrotik.js";
import usersRouter from "./routes/users.js";
import reportsRouter from "./routes/reports.js";
import { syncMikrotikUsers } from "./services/mikrotikSync.js";
import dbuserRoutes from "./routes/dbuser.js";
import settingsRouters from "./routes/settings.js";
const uploadsPath = path.join(process.cwd(), "uploads");
import networkRoutes from "./routes/network.js";
import authRouter from "./routes/auth.js"
import profileRouter from "./routes/profile.js";
import dashboardRoutes from "./routes/dashboard.js";
import adminRoutes from "./routes/admin.js";
import packageRouter from "./routes/packages.js";
import invoiceRoutes from "./routes/invoices.js";
import { checkQuotas } from "./services/quotaEnforcer.js";

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Global BigInt JSON fix (place once in backend entry file)
BigInt.prototype.toJSON = function () {
  return this.toString(); // safest (no overflow)
};

// ----------------------
// Public Routes (must stay at the top)
// ----------------------
app.use("/api/auth", authRouter);  // <-- DO NOT MOVE THIS
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));  // public

// ============================================================
// NEW: Safe Mode Middleware (Place this HERE)
// ============================================================
import { getRouterConfig } from "./services/mikrotik.js"; // Ensure this is imported
import net from "net";

const mikrotikGuard = async (req, res, next) => {
  // 1. ALWAYS Allow Read Operations (GET)
  // This ensures your Dashboard, Tables, and Invoices ALWAYS load from DB.
  if (req.method === "GET") {
    return next();
  }

  // 2. ALWAYS Allow Settings & Admin
  // (So you can update the IP/User/Pass if they are wrong)
  if (req.originalUrl.startsWith("/api/settings") || req.originalUrl.startsWith("/api/admin")) {
    return next();
  }

  // 3. For WRITE Operations (POST, PUT, DELETE), check connection
  // This prevents creating users in DB if MikroTik is dead.
  try {
    const config = await getRouterConfig(); // Get creds from DB
    if (!config) return next(); // If no config, let the route handle the error

    // Quick Ping Test to MikroTik API Port (usually 8728)
    const socket = new net.Socket();
    socket.setTimeout(2000); // 2 second timeout
    
    socket.connect(config.port || 8728, config.host, () => {
      socket.destroy();
      next(); // Connection success! Proceed to controller.
    });

    socket.on('error', (err) => {
      socket.destroy();
      res.status(503).json({ error: "MikroTik Disconnected. Action blocked to prevent data mismatch." });
    });

    socket.on('timeout', () => {
      socket.destroy();
      res.status(503).json({ error: "MikroTik Timeout. Action blocked." });
    });

  } catch (error) {
    // If DB fails or other error, block the write to be safe
    res.status(503).json({ error: "System Error. Cannot verify router connection." });
  }
};

// Apply the Guard
app.use("/api", mikrotikGuard); 
// ============================================================

// ----------------------
// Protected Routes (all after /api/auth)
// ----------------------
app.use("/api/pppoe", requireAuth, mikrotikRouter);
app.use("/api", requireAuth, usersRouter);
app.use("/api/reports", requireAuth, reportsRouter);
app.use("/api/settings", requireAuth, settingsRouters);
app.use("/api/dbusers", requireAuth, dbuserRoutes);
app.use("/api/network", requireAuth, networkRoutes);
app.use("/api/profile", requireAuth, profileRouter);
app.use("/api/dashboard", requireAuth, dashboardRoutes);
app.use("/api/admin",requireAuth, adminRoutes);
app.use("/api/packages", requireAuth, packageRouter);
app.use("/api/invoices",requireAuth, invoiceRoutes);


// sync endpoint (keeps behavior you had)
app.get("/api/sync", async (req, res) => {
  try {
    await syncMikrotikUsers();
    res.json({ success: true, message: "Synced with MikroTik" });
  } catch (err) {
    console.error("Sync error:", err);
    res.status(500).json({ success: false, error: err.message || "Sync failed" });
  }
});

// Start the Interval (e.g., every 2 minutes)
setInterval(() => {
  checkQuotas();
}, 2 * 60 * 1000); // 2 minutes in milliseconds



// Serve frontend build when in production (keep same behavior)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const staticPath = path.join(__dirname, "../frontend/dist");
app.use(express.static(staticPath));
app.get("*", (req, res) => {
  res.sendFile(path.join(staticPath, "index.html"));
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Backend listening at http://localhost:${PORT}`);
});
