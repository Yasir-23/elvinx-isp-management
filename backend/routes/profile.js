import express from "express";
import prisma from "../lib/prismaClient.js";
import { withConn } from "../services/mikrotik.js";

const router = express.Router();

// GET /api/profile/:id
router.get("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id) {
      return res.status(400).json({ success: false, error: "Invalid ID" });
    }

    // 1) Get user + staff from DB
    const user = await prisma.user.findUnique({
      where: { id },
      include: { staff: true },
    });

    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    const maskedPassword = user.passwordRaw
      ? user.passwordRaw.replace(/./g, "•")
      : null;

    const profile = {
      id: user.id,
      photoUrl: user.photoUrl,
      name: user.name,
      username: user.username,
      email: user.email,
      mobile: user.mobile,
      address: user.address,
      city: user.city,
      area: user.area,
      connection: user.connection,
      package: user.package,
      packagePrice: user.packagePrice,
      createdAt: user.createdAt,
      disabled: user.disabled,
      online: user.online,
      passwordMasked: maskedPassword,
      salesperson: user.salesperson,
      staff: user.staff
        ? {
            id: user.staff.id,
            name: user.staff.name,
            phone: user.staff.phone,
            area: user.staff.area,
            photoUrl: user.staff.photoUrl,
          }
        : null,
    };

    // 2) Fetch metrics from MikroTik
    let metrics = null;

    try {
      if (user.username) {
        metrics = await withConn(async (conn) => {
          // Format date like "09 Dec 2025 12:22:11"
          const formatRouterDate = (raw) => {
            if (!raw) return null;
            try {
              const [mdy, time] = raw.split(" ");
              if (!mdy || !time) return raw;

              const [monStr, dayStr, yearStr] = mdy.split("/");
              const map = {
                jan: "Jan",
                feb: "Feb",
                mar: "Mar",
                apr: "Apr",
                may: "May",
                jun: "Jun",
                jul: "Jul",
                aug: "Aug",
                sep: "Sep",
                oct: "Oct",
                nov: "Nov",
                dec: "Dec",
              };
              const mon = map[monStr.toLowerCase()] || monStr;

              return `${dayStr} ${mon} ${yearStr} ${time}`;
            } catch {
              return raw;
            }
          };

          // 1) PPP Active
          const active = await conn.write("/ppp/active/print", [
            `?name=${user.username}`,
            "=.proplist=name,address,caller-id,uptime,service,encoding,session-id,interface,last-link-up-time,last-link-down-time",
          ]);

          const act = active?.[0] || null;
          const online = !!act;

          // 3) Detect physical connected port using MAC lookup in bridge-host table
          let connectedPort = null;
          try {
            const userMac = act?.["caller-id"]?.toUpperCase();

            if (userMac) {
              const hosts = await conn.write("/interface/bridge/host/print");

              const match = hosts.find(
                (h) => h["mac-address"]?.toUpperCase() === userMac
              );

              if (match) {
                // MikroTik always reports the physical port here
                connectedPort =
                  match["interface"] || match["on-interface"] || null;
              }
            }
          } catch (e) {
            console.warn("Bridge-host lookup failed:", e.message);
          }

          const ifaceName = act?.interface || `<pppoe-${user.username}>`;

          // 2) Interface lifetime bytes
          const ifaceList = await conn.write("/interface/print", [
            `?name=${ifaceName}`,
            "=.proplist=name,tx-byte,rx-byte,tx-bytes,rx-bytes,tx-byte-count,rx-byte-count",
          ]);

          const iface = ifaceList?.[0] || {};

          const tx =
            Number(iface["tx-byte"]) ||
            Number(iface["tx-bytes"]) ||
            Number(iface["tx-byte-count"]) ||
            0;

          const rx =
            Number(iface["rx-byte"]) ||
            Number(iface["rx-bytes"]) ||
            Number(iface["rx-byte-count"]) ||
            0;

          const liveUsedBytes = tx + rx;
          // -------------------------------
          // ⭐ NEW PERSISTENT TRACKING LOGIC
          // -------------------------------
          let storedTotal = BigInt(user.usedBytesTotal || 0);
          let lastSnapshot = BigInt(user.lastBytesSnapshot || 0);
          const live = BigInt(liveUsedBytes);

          if (live < lastSnapshot) {
            // PPPoE session reset → do NOT add anything
            lastSnapshot = live;
          } else {
            // Add only the difference since last snapshot
            const diff = live - lastSnapshot;
            storedTotal += diff;
            lastSnapshot = live;
          }

          // Save updated totals
          await prisma.user.update({
            where: { id: user.id },
            data: {
              usedBytesTotal: storedTotal,
              lastBytesSnapshot: lastSnapshot,
            },
          });

          const toGB = (b) =>
            Number((Number(b) / (1024 * 1024 * 1024)).toFixed(2));

          // 3) Live bandwidth
          let txBps = 0;
          let rxBps = 0;

          try {
            const traffic = await conn.write("/interface/monitor-traffic", [
              `=interface=${ifaceName}`,
              "=once=yes",
              "=.proplist=tx-bits-per-second,rx-bits-per-second",
            ]);

            const tr = traffic?.[0] || {};
            txBps = Number(tr["tx-bits-per-second"] || 0);
            rxBps = Number(tr["rx-bits-per-second"] || 0);
          } catch {}

          const formatSpeed = (bps) => {
            if (!bps || bps <= 0) return "0";
            if (bps >= 1_000_000) return `${(bps / 1_000_000).toFixed(2)} Mbps`;
            if (bps >= 1_000) return `${(bps / 1_000).toFixed(2)} Kbps`;
            return `${bps} bps`;
          };

          const txSpeed = formatSpeed(txBps);
          const rxSpeed = formatSpeed(rxBps);

          // 4) PPP Secret info
          const secret = await conn.write("/ppp/secret/print", [
            `?name=${user.username}`,
            "=.proplist=name,remote-address,profile,last-logged-out,last-logged-in,last-caller-id,last-disconnect-reason",
          ]);

          const sec = secret?.[0] || {};
          const ipPool = sec["remote-address"] || null;
          const policy = sec["profile"] || null;

          const lastLoggedOutRaw = sec["last-logged-out"] || null;
          const lastLoggedInRaw = sec["last-logged-in"] || null;

          // // 5) Correct connected port
          // let connectedPort = ifaceName;

          // try {
          //   const ifaceInfo = await conn.write("/interface/print", [
          //     `?name=${ifaceName}`,
          //     "=.proplist=default-name,name",
          //   ]);

          //   if (ifaceInfo[0]) {
          //     connectedPort =
          //       ifaceInfo[0]["default-name"] || ifaceInfo[0]["name"];
          //   }
          // } catch {}

          // 6) Last login
          let lastLoginRaw =
            act?.["last-link-up-time"] ||
            lastLoggedInRaw ||
            lastLoggedOutRaw ||
            null;

          const lastLogin = lastLoginRaw
            ? formatRouterDate(lastLoginRaw)
            : null;

          const lastDisconnect = act?.["last-link-down-time"]
            ? formatRouterDate(act["last-link-down-time"])
            : null;

          return {
            online,
            uptime: act?.uptime || null,
            ip: act?.address || null,
            mac: act?.["caller-id"] || null,

            service: act?.service || null,
            encoding: act?.encoding || null,
            sessionId: act?.["session-id"] || null,
            interfaceName: ifaceName,

            lastLogin,
            lastDisconnect,

            usedBytesTX: tx,
            usedBytesRX: rx,
            usedVolumeBytes: Number(storedTotal),
            usedVolumeGB: toGB(storedTotal),

            totalVolumeBytes: null,
            totalVolumeGB: null,
            remainingVolumeBytes: null,
            remainingVolumeGB: null,

            ipPool,
            policy,
            connectedPort,

            txBps,
            rxBps,
            txSpeed,
            rxSpeed,
          };
        });
      }
    } catch (e) {
      metrics = { online: false, error: e.message };
    }

    // 3) Connected NAS IP from DB settings
    try {
      const settings = await prisma.setting.findFirst({
        select: { mikrotikIp: true },
      });
      if (settings?.mikrotikIp) {
        metrics.connectedNAS = settings.mikrotikIp.split(":")[0];
      } else {
        metrics.connectedNAS = "-";
      }
    } catch {
      metrics.connectedNAS = "-";
    }

    // 4) Service Details object for UI
    metrics.serviceDetails = {
      connectionStatus: metrics.online ? "Online" : "Offline",
      onlineUptime: metrics.uptime || "-",
      profileStatus: user.disabled ? "Disabled" : "Active",
      connectionType: user.connection?.toUpperCase() || "PPPOE",

      packageName: user.package || "-",
      policy: metrics.policy || "-",
      ipPool: metrics.ipPool || "-",

      packageDuration: "1 Month",
      lastExpirationDate: user.lastExpiration || "-",
      expirationDate: user.nextExpiration || "-",

      totalVolumeGB: metrics.totalVolumeGB ?? 0,
      // usedVolumeGB: metrics.usedVolumeGB ?? 0,
      usedVolumeGB: metrics.usedVolumeGB ?? 0,
      remainingVolumeGB: metrics.remainingVolumeGB ?? 0,

      totalSessionTime: "-",
      usedSessionTime: metrics.uptime || "-",
      remainingSessionTime: "-",

      lastActivationDate: user.lastActivation || "-",
      lastActivationBy: user.lastActivationBy || "-",

      salesperson: user.salesperson || "-",

      macAddress: metrics.mac || "-",
      lastLogin: metrics.lastLogin || "-",
      connectedIP: metrics.ip || "-",
      connectedMAC: metrics.mac || "-",
      connectedNAS: metrics.connectedNAS || "-",
      connectedPort: metrics.connectedPort || "-",
    };

    return res.json({ success: true, profile, metrics });
  } catch (err) {
    console.error("PROFILE ERROR:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
