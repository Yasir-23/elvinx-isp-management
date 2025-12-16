import React, { useEffect, useState } from "react";
import api from "../services/api"; // your axios wrapper (baseURL: /api)
import {
  Users,
  CheckCircle,
  Wifi,
  AlertTriangle,
  PowerOff,
  FilePlus,
  Slash,
  Calendar,
  Plug,
  Globe,
  Clock,
  CalendarDays
} from "lucide-react";

/**
 * UserStatistics
 * - Fetches DB users (/api/users), router secrets (/api/pppoe/users) and active sessions (/api/pppoe/active)
 * - Computes commonly-needed counts. Some metrics (expiry, expiring windows, registered) require extra DB fields.
 */
export default function UserStatistics() {
  const [dbUsers, setDbUsers] = useState([]);
  const [mtUsers, setMtUsers] = useState([]); // MikroTik secrets
  const [mtActive, setMtActive] = useState([]); // active sessions
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch data
  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);

    Promise.allSettled([
      api.get("/users").catch((e) => ({ data: [] })), // DB users (if /api/users exists)
      api.get("/pppoe/users").catch((e) => ({ data: { success: false, data: [] } })),
      api.get("/pppoe/active").catch((e) => ({ data: { success: false, data: [] } })),
    ])
      .then((results) => {
        if (!mounted) return;

        // API #1: DB users (may return array or { success:true, data: [...] } depending on your backend)
        const r0 = results[0].status === "fulfilled" ? results[0].value.data : [];
        const dbList = Array.isArray(r0) ? r0 : (r0.data || []);
        setDbUsers(dbList || []);

        // API #2: MikroTik PPPoE secrets
        const r1 = results[1].status === "fulfilled" ? results[1].value.data : { success: false, data: [] };
        const mtSecrets = r1?.data || [];
        setMtUsers(mtSecrets || []);

        // API #3: active sessions
        const r2 = results[2].status === "fulfilled" ? results[2].value.data : { success: false, data: [] };
        const mtActiveList = r2?.data || [];
        setMtActive(mtActiveList || []);
      })
      .catch((err) => {
        console.error("Stats load error:", err);
        setError("Failed to load stats");
      })
      .finally(() => setLoading(false));

    return () => { mounted = false; };
  }, []);

  // Helpers
  const countIf = (arr, fn) => (arr || []).filter(fn).length;
  const pct = (count, total) => (total > 0 ? ((count / total) * 100) : 0);
  const fmtPct = (count, total) => `${pct(count, total).toFixed(2)}%`;

  // Primary totals (choose DB users if available, otherwise fallback to MikroTik secrets)
  const totalUsers = dbUsers.length > 0 ? dbUsers.length : mtUsers.length;
  const totalRadiusUsers = mtUsers.length; // MikroTik PPPoE/Hotspot secrets (router)
  const totalApiUsers = dbUsers.length; // treat DB users as "API users" for now (users created via your system)

  // Compute counts (best-effort)
  // Active = secrets that are not disabled
  const activeCount = countIf(mtUsers, (u) => !(String(u.disabled) === "yes" || u.disabled === true));

  // Online = active sessions count
  const onlineCount = mtActive.length;

  // Disabled = secrets with disabled=yes
  const disabledCount = countIf(mtUsers, (u) => String(u.disabled) === "yes" || u.disabled === true);

  // PPPoE / Hotspot counts (service field or guess)
  const pppoeCount = countIf(mtUsers, (u) => {
    const s = (u.service || u.srv || "").toString().toLowerCase();
    return s.includes("pppoe") || s === "pppoe";
  });
  const hotspotCount = countIf(mtUsers, (u) => {
    const s = (u.service || u.srv || "").toString().toLowerCase();
    return s.includes("hotspot") || s === "hotspot";
  });

  // Offline = totalUsers - online (safe floor)
  const offlineCount = Math.max(0, totalUsers - onlineCount);

  // Registered / Expired / Expiring — require expiry data in DB (expiryDate or status).
  // We'll attempt to use dbUsers.expiryDate if present. Otherwise show 0 and a small hint.
  const now = new Date();
  let registeredCount = 0;
  let expiredCount = 0;
  let expiring1 = 0;
  let expiring3 = 0;
  let expiring7 = 0;
  let expiring14 = 0;

  if (dbUsers.length > 0) {
    // if users have expiryDate field (ISO string), compute counts
    dbUsers.forEach(u => {
      const expStr = u.expiryDate || u.expireAt || u.expiresAt || u.expire || null;
      if (!expStr) {
        registeredCount += 0; // can't tell
        return;
      }
      const d = new Date(expStr);
      if (isNaN(d)) return;
      const diffDays = Math.floor((d - now) / (1000 * 60 * 60 * 24));
      if (diffDays < 0) expiredCount++;
      if (diffDays === 0) expiring1++;
      if (diffDays <= 3 && diffDays > 0) expiring3++;
      if (diffDays <= 7 && diffDays > 0) expiring7++;
      if (diffDays <= 14 && diffDays > 0) expiring14++;
    });
  }

  // Expired Online: active sessions whose owner is expired according to DB expiryDate (best-effort)
  let expiredOnlineCount = 0;
  if (dbUsers.length > 0 && mtActive.length > 0) {
    mtActive.forEach(sess => {
      const sessName = sess.name || sess.user || sess.username || sess["name"];
      if (!sessName) return;
      const u = dbUsers.find(x => (x.username === sessName || x.name === sessName));
      if (!u) return;
      const expStr = u.expiryDate || u.expireAt || u.expiresAt || u.expire || null;
      if (!expStr) return;
      const d = new Date(expStr);
      if (!isNaN(d) && d < now) expiredOnlineCount++;
    });
  }

  // Compose metrics arrays for the three cards
  const makeStat = (label, count, total, Icon, hint) => ({
    label,
    count,
    pct: fmtPct(count, total),
    pctVal: pct(count, total),
    Icon,
    hint
  });

  const allTotal = Math.max(1, totalUsers); // avoid div by zero
  const cardAll = [
    makeStat("Users", totalUsers, allTotal, Users),
    makeStat("Active", activeCount, allTotal, CheckCircle),
    makeStat("Online", onlineCount, allTotal, Wifi),
    makeStat("Expired Online", expiredOnlineCount, allTotal, AlertTriangle, "Requires expiryDate in DB"),
    makeStat("Offline", offlineCount, allTotal, PowerOff),
    makeStat("Registered", registeredCount, allTotal, FilePlus, "Registered means 'registered but not active' — needs flag in DB"),
    makeStat("Disabled", disabledCount, allTotal, Slash),
    makeStat("Expired", expiredCount, allTotal, Calendar),
    makeStat("PPPoE", pppoeCount, allTotal, Plug),
    makeStat("Hotspot", hotspotCount, allTotal, Globe),
    makeStat("Expiring (1d)", expiring1, allTotal, Clock),
    makeStat("Expiring (3d)", expiring3, allTotal, Clock),
    makeStat("Expiring (1w)", expiring7, allTotal, CalendarDays),
    makeStat("Expiring (2w)", expiring14, allTotal, CalendarDays),
  ];

  // For Radius Users card (based on mtUsers as the baseline)
  const radiusTotal = Math.max(1, totalRadiusUsers);
  const radiusCard = [
    makeStat("Users", totalRadiusUsers, radiusTotal, Users),
    makeStat("Active", activeCount, radiusTotal, CheckCircle),
    makeStat("Online", onlineCount, radiusTotal, Wifi),
    makeStat("Expired Online", expiredOnlineCount, radiusTotal, AlertTriangle, "Needs expiry data"),
    makeStat("Offline", Math.max(0, totalRadiusUsers - onlineCount), radiusTotal, PowerOff),
    makeStat("Disabled", disabledCount, radiusTotal, Slash),
    makeStat("PPPoE", pppoeCount, radiusTotal, Plug),
    makeStat("Hotspot", hotspotCount, radiusTotal, Globe),
    makeStat("Expiring (2w)", expiring14, radiusTotal, CalendarDays),
  ];

  // API Users (DB users baseline)
  const apiTotal = Math.max(1, totalApiUsers);
  const apiCard = [
    makeStat("Users", totalApiUsers, apiTotal, Users),
    makeStat("Active (in router)", activeCount, apiTotal, CheckCircle),
    makeStat("Online", onlineCount, apiTotal, Wifi),
    makeStat("Registered", registeredCount, apiTotal, FilePlus),
    makeStat("Expired", expiredCount, apiTotal, Calendar),
    makeStat("Expiring (2w)", expiring14, apiTotal, CalendarDays),
  ];

  function StatRow({ stat }) {
    const Icon = stat.Icon;
    const barWidth = `${Math.min(100, Math.max(0, stat.pctVal))}%`;
    return (
      <div className="flex items-center justify-between py-2">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 flex items-center justify-center rounded-md bg-white/5">
            <Icon size={16} />
          </div>
          <div>
            <div className="text-sm font-medium">{stat.label}</div>
            {stat.hint && <div className="text-xs text-gray-400">{stat.hint}</div>}
          </div>
        </div>

        <div className="w-40">
          <div className="flex items-center justify-between text-sm">
            <div className="font-semibold">{stat.count}</div>
            <div className="text-xs text-gray-300">{stat.pct}</div>
          </div>
          <div className="mt-1 h-1 bg-white/5 rounded-full overflow-hidden">
            <div className="h-1 bg-teal-500" style={{ width: barWidth }} />
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-gray-800 p-4 rounded shadow">
        <div className="text-sm text-gray-300">Loading statistics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-800 p-4 rounded shadow">
        <div className="text-sm text-red-400">{error}</div>
      </div>
    );
  }

  // Card component
  const StatsCard = ({ title, stats }) => (
    <div className="bg-gray-800 p-4 rounded shadow">
      <div className="text-white font-semibold mb-3">{title}</div>
      <div className="space-y-1">
        {stats.map((s, i) => <StatRow key={s.label + i} stat={s} />)}
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <StatsCard title="All Users" stats={cardAll} />
      <StatsCard title="Radius Users" stats={radiusCard} />
      <StatsCard title="API Users" stats={apiCard} />
    </div>
  );
}
