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

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ----------------------
// Public Routes (must stay at the top)
// ----------------------
app.use("/api/auth", authRouter);  // <-- DO NOT MOVE THIS
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));  // public

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
