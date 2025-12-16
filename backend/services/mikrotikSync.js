import prisma from "../lib/prismaClient.js";
import { connectRouter, withConn } from "./mikrotik.js";

/**
 * syncMikrotikUsers()
 * - Fetches PPP secrets + active sessions from MikroTik
 * - Upserts a minimal record into DB for router-only users (username unique)
 * - Updates fields for existing DB users (online, disabled, package, lastSync)
 */
export async function syncMikrotikUsers() {
  const conn = await connectRouter();
  try {
    const secretsRes = await conn.write("/ppp/secret/print", []);
    const activeRes = await conn.write("/ppp/active/print", []);
    const secrets = Array.isArray(secretsRes) ? secretsRes : [];
    const active = Array.isArray(activeRes) ? activeRes : [];
    const activeSet = new Set(active.map(a => (a.name || a.user || "").toString()));

    for (const s of secrets) {
      const username = (s.name || s.user || "").toString();
      if (!username) continue;

      // Upsert so router-only accounts appear in DB (minimal fields)
      await prisma.user.upsert({
        where: { username },
        update: {
          package: s.profile || s["profile"] || null,
          connection: s.service || s.srv || "pppoe",
          disabled: String(s.disabled) === "yes",
          online: activeSet.has(username),
          lastSync: new Date(),
        },
        create: {
          username,
          name: username,
          password: "",
          package: s.profile || s["profile"] || null,
          connection: s.service || s.srv || "pppoe",
          salesperson: "mikrotik",
          nas: "",
          nationalId: null,
          mobile: null,
          email: null,
          address: null,
          city: null,
          latitude: null,
          longitude: null,
          balance: null,
          expiryDate: null,
          disabled: String(s.disabled) === "yes",
          online: activeSet.has(username),
          lastSync: new Date(),
          photoUrl: null
        },
      });
    }

    return { success: true, synced: secrets.length };
  } catch (err) {
    console.error("syncMikrotikUsers error:", err);
    throw err;
  } finally {
    try { await conn.close(); } catch (e) {}
  }
}

/**
 * getReportUsers(query)
 * - Implements merging logic used by /api/reports/users
 * - Accepts filter/page/limit/search/sort/order in the `query` object (strings)
 * - Returns { data: rows, total }
 */
export async function getReportUsers(query = {}) {
  const filter = query.filter || "all";
  const page = Math.max(1, parseInt(query.page || "1"));
  const limit = Math.max(1, parseInt(query.limit || "10"));
  const search = (query.search || "").trim();
  const sort = query.sort || "id";
  const order = (query.order || "desc").toLowerCase() === "asc" ? "asc" : "desc";
  const offset = (page - 1) * limit;
  const now = new Date();

  // Build base where for DB
  const where = {};
  if (search) {
    where.OR = [
      { username: { contains: search } },
      { name: { contains: search } },
      { mobile: { contains: search } },
      { package: { contains: search } },
      { salesperson: { contains: search } },
    ];
  }

  // expiry filters — best effort (will fallback if expiryDate doesn't exist)
  if (filter === "disabled") where.disabled = true;
  else if (filter === "expired") where.expiryDate = { lt: now };
  else if (filter === "expiring1") {
    const to = new Date(now); to.setDate(now.getDate() + 1);
    where.expiryDate = { gte: now, lte: to };
  } else if (filter === "expiring3") {
    const to = new Date(now); to.setDate(now.getDate() + 3);
    where.expiryDate = { gte: now, lte: to };
  } else if (filter === "expiring7") {
    const to = new Date(now); to.setDate(now.getDate() + 7);
    where.expiryDate = { gte: now, lte: to };
  } else if (filter === "expiring14") {
    const to = new Date(now); to.setDate(now.getDate() + 14);
    where.expiryDate = { gte: now, lte: to };
  }

  // Query DB with fallback if expiryDate doesn't exist
  let dbUsers = [];
  let dbCount = 0;
  try {
    [dbUsers, dbCount] = await Promise.all([
      prisma.user.findMany({
        where,
        skip: offset,
        take: limit,
        orderBy: { [sort]: order },
      }),
      prisma.user.count({ where }),
    ]);
  } catch (dbErr) {
    // fallback: remove expiryDate filter if Prisma complains
    const fallbackWhere = { ...where };
    delete fallbackWhere.expiryDate;
    if (filter === "disabled") fallbackWhere.disabled = true;
    try {
      [dbUsers, dbCount] = await Promise.all([
        prisma.user.findMany({
          where: fallbackWhere,
          skip: offset,
          take: limit,
          orderBy: { [sort]: order },
        }),
        prisma.user.count({ where: fallbackWhere }),
      ]);
    } catch (err2) {
      dbUsers = [];
      dbCount = 0;
    }
  }

  // Fetch MikroTik secrets & active sessions (best-effort)
  let mtSecrets = [];
  let mtActive = [];
  try {
    await withConn(async (conn) => {
      const s = await conn.write("/ppp/secret/print", []);
      mtSecrets = Array.isArray(s) ? s : [];
      const a = await conn.write("/ppp/active/print", []);
      mtActive = Array.isArray(a) ? a : [];
    });
  } catch (mtErr) {
    console.warn("MikroTik not available for reports:", mtErr?.message || mtErr);
    mtSecrets = [];
    mtActive = [];
  }

  const activeSet = new Set(mtActive.map(a => (a.name || a.user || "").toString()));
  const secretMap = new Map();
  mtSecrets.forEach(s => {
    const key = (s.name || s.user || "").toString();
    if (key) secretMap.set(key, s);
  });

  // Map DB users
  const mappedDb = dbUsers.map(u => {
    const secret = secretMap.get(u.username || "") || null;
    return {
      id: u.id,
      username: u.username || "",
      name: u.name || null,
      phone: u.mobile || null,
      package: u.package || (secret && (secret.profile || secret["profile"])) || null,
      seller: u.salesperson || null,
      balance: u.balance == null ? null : Number(u.balance),
      service: u.connection || (secret && (secret.service || secret.srv)) || "pppoe",
      online: activeSet.has(u.username || ""),
      expiryDate: u.expiryDate || null,
      disabled: !!u.disabled || (secret && String(secret.disabled) === "yes"),
      photoUrl: u.photoUrl || null,
      source: "db",
      meta: { routerSecret: secret || null }
    };
  });

  // Map MikroTik-only extras (not present in DB)
  const dbUsernames = new Set(mappedDb.map(x => x.username));
  let mappedMtExtra = mtSecrets
    .map(s => {
      const uname = (s.name || s.user || "").toString();
      if (!uname) return null;
      return {
        id: null,
        username: uname,
        name: null,
        phone: null,
        package: s.profile || s["profile"] || null,
        seller: null,
        balance: null,
        service: s.service || s.srv || "pppoe",
        online: activeSet.has(uname),
        expiryDate: null,
        disabled: String(s.disabled) === "yes",
        photoUrl: null,
        source: "mikrotik",
        meta: { routerSecret: s }
      };
    })
    .filter(Boolean)
    .filter(u => !dbUsernames.has(u.username));

  if (filter === "disabled") mappedMtExtra = mappedMtExtra.filter(u => u.disabled);

  const rows = [...mappedDb, ...mappedMtExtra];
  const total = dbCount + mappedMtExtra.length;

  return { data: rows, total };
}
