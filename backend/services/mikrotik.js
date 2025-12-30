import { RouterOSAPI } from "node-routeros";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function getRouterConfig() {
  const settings = await prisma.setting.findFirst({
    orderBy: { id: "desc" }, // latest row
  });

  if (!settings) {
    throw new Error("⚠️ No settings found in DB");
  }

  const [host, portPart] = (settings.mikrotikIp || "").split(":");
  const port = portPart ? Number(portPart) : 8728;

  return {
    host,
    user: settings.mikrotikUser,
    password: settings.mikrotikPassword,
    port,
    timeout: 10000,
  };
}


export async function connectRouter() {
  const config = await getRouterConfig();
  console.log("🔍 Trying to connect with config:", config);

  const conn = new RouterOSAPI(config);

  try {
    await conn.connect();
    console.log("✅ Connected to MikroTik successfully");
    return conn;
  } catch (err) {
    console.error("❌ Failed to connect to MikroTik:", err.message);
    throw err;
  }
}

export async function withConn(handler) {
  const conn = await connectRouter();
  try {
    return await handler(conn);
  } finally {
    try {
      await conn.close();
    } catch {
      /* ignore */
    }
  }
}


export async function deleteMikrotikUser(username) {
  return await withConn(async (conn) => {
    const secrets = await conn.write("/ppp/secret/print", [
      `?name=${username}`
    ]);

    if (!secrets.length) {
      return { success: false, message: "User not found in MikroTik" };
    }

    const secretId = secrets[0][".id"];

    await conn.write("/ppp/secret/remove", [
      `=.id=${secretId}`
    ]);

    return { success: true };
  });
}

/**
 * 🔹 Get live usage for a PPPoE user from /ppp/active/print
 *  - bytes-in / bytes-out are total bytes for this active session
 *  - if user is offline, returns online:false and zeros
 */
export async function getLiveUsageForUser(username) {
  return await withConn(async (conn) => {
    // Ask only for fields we need (proplist)
    const rows = await conn.write("/ppp/active/print", [
      `?name=${username}`,
      "=.proplist=name,address,caller-id,uptime,bytes-in,bytes-out"
    ]);

    if (!rows || rows.length === 0) {
      // User is offline (no active PPP session)
      return {
        online: false,
        uptime: null,
        ip: null,
        mac: null,
        rxBytes: 0,
        txBytes: 0,
        totalBytes: 0,
        usedVolumeGB: 0
      };
    }

    const row = rows[0];

    const bytesIn = Number(row["bytes-in"] || 0);   // download
    const bytesOut = Number(row["bytes-out"] || 0); // upload
    const totalBytes = bytesIn + bytesOut;

    const toGB = (b) => Number((b / (1024 * 1024 * 1024)).toFixed(2));

    return {
      online: true,
      uptime: row.uptime || null,
      ip: row.address || null,
      mac: row["caller-id"] || null,
      rxBytes: bytesIn,
      txBytes: bytesOut,
      totalBytes,
      usedVolumeGB: toGB(totalBytes)
    };
  });
}



