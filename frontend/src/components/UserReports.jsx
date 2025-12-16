import React, { useEffect, useState, useRef } from "react";
import api from "../services/api"; // your axios wrapper with baseURL
import { Printer, FileText, Download, Search, ChevronLeft, ChevronRight } from "lucide-react";

const TABS = [
  { key: "expired", label: "Expired Users" },
  { key: "expiring1", label: "Expiring (1 Days)" },
  { key: "expiring3", label: "Expiring (3 Days)" },
  { key: "expiring7", label: "Expiring (1 week)" },
  { key: "expiring14", label: "Expiring (2 weeks)" },
  { key: "disabled", label: "Disabled Users" },
  { key: "problematic", label: "Problematic Users" }, // placeholder
];

export default function UserReports() {
  const [tab, setTab] = useState("expired");
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const searchTimer = useRef(null);
  const [sortColumn, setSortColumn] = useState("id");
  const [sortOrder, setSortOrder] = useState("desc");

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, page, limit, sortColumn, sortOrder]);

  // fetchData supports optional overrides to avoid stale-state issues (used by debounced search)
  async function fetchData(overrides = {}) {
  setLoading(true);
  try {
    // allow callers to override page/limit/tab/search (use current state as default)
    const p = overrides.page ?? page;
    const l = overrides.limit ?? limit;
    const t = overrides.tab ?? tab;
    const s = overrides.search ?? search;
    const sc = overrides.sortColumn ?? sortColumn;
    const so = overrides.sortOrder ?? sortOrder;

    // Build query
    const q = {
      page: p,
      limit: l,
      sort: sc,
      order: so,
    };

    // ✅ Apply search (ignore tab when searching → search across all)
    if (s && s.trim() !== "") {
      q.search = s.trim();
      q.filter = "all";
    } else {
      q.filter = t; // use active tab filter
    }

    const res = await api.get("/reports/users", { params: q });

    if (res.data && res.data.success) {
      setRows(res.data.data || []);
      setTotal(res.data.total || 0);
    } else {
      setRows([]);
      setTotal(0);
    }
  } catch (err) {
    console.error("UserReports fetch error:", err);
    setRows([]);
    setTotal(0);
  } finally {
    setLoading(false);
  }
}
  // Called on every key change — we debounce the actual fetch
  function handleSearchChange(e) {
  const newVal = e.target.value;
  setSearch(newVal);
  setPage(1);

  if (searchTimer.current) clearTimeout(searchTimer.current);
  // debounce 350ms (tweak this if you want)
  searchTimer.current = setTimeout(() => {
    // pass overrides so we use the fresh search value and reset to page 1
    fetchData({ search: newVal, page: 1 });
  }, 350);
  }

    // Keep Enter search for keyboard users (optional)
  const onSearch = (e) => {
  if (e.key === "Enter") {
    setPage(1);
    // immediate fetch using current input value
    fetchData({ search, page: 1 });
  }
  };

  async function toggleDisable(row) {
    if (!row || !row.id) return alert("Only DB users can be disabled via this action.");
    try {
      const endpoint = row.disabled ? `/users/${row.id}/enable` : `/users/${row.id}/disable`;
      await api.post(endpoint);
      fetchData();
    } catch (err) {
      console.error("toggle disable error:", err);
      alert("Failed to toggle disable");
    }
  }

  async function exportCSV() {
    try {
      const res = await api.get("/reports/users/export", {
        params: { filter: tab, format: "csv", limit: 1000, page: 1 },
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = `users_${tab}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      console.error("export error:", err);
      alert("Export failed (server export not implemented?).");
    }
  }

  const totalPages = Math.max(1, Math.ceil((total || 0) / limit));
  const start = (page - 1) * limit + 1;
  const end = Math.min(total, page * limit);

  return (
    <div className="bg-gray-800 rounded shadow p-4">
      <div className="flex items-center mb-3">
        <h3 className="text-lg font-semibold text-white mr-4">User Reports</h3>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => {
              setTab(t.key);
              setPage(1);
            }}
            className={`px-4 py-2 rounded text-sm ${
              tab === t.key
                ? "bg-teal-600 text-white"
                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between mb-3 text-gray-300">
        <div className="flex items-center gap-3">
          <label>Show</label>
          <select
            value={limit}
            onChange={(e) => {
              setLimit(Number(e.target.value));
              setPage(1);
            }}
            className="bg-gray-700 text-gray-200 p-1 rounded"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="px-3 py-1 bg-teal-600 text-white rounded flex items-center gap-2"
            >
              <Printer size={14} /> Print
            </button>
            <button
              onClick={exportCSV}
              className="px-3 py-1 bg-teal-600 text-white rounded flex items-center gap-2"
            >
              <Download size={14} /> CSV
            </button>
            <button
              onClick={() => alert("Copy not implemented")}
              className="px-3 py-1 bg-teal-600 text-white rounded flex items-center gap-2"
            >
              <FileText size={14} /> Copy
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
          value={search}
          onChange={handleSearchChange}
          onKeyDown={onSearch}
          placeholder="Search..."
          className="px-2 py-1 bg-gray-700 text-gray-200 rounded"
          />

          <button
            onClick={() => {
              setPage(1);
              fetchData();
            }}
            className="px-3 py-1 bg-teal-600 text-white rounded flex items-center gap-2"
          >
            <Search size={14} /> Search
          </button>
        </div>
      </div>

      {/* Table */}
        <div className="overflow-auto border border-gray-700 rounded">
          <table className="min-w-full text-sm text-gray-300">
            <thead className="bg-gray-900 text-gray-400">
      <tr>
        <th className="p-2 text-left">#ID</th>
        <th className="p-2 text-left">Photo</th>
        <th className="p-2 text-left">Username</th>
        <th className="p-2 text-left">Phone</th>
        <th className="p-2 text-left">Package</th>
        <th className="p-2 text-left">Salesperson</th>
        <th className="p-2 text-left">Balance</th>
        <th className="p-2 text-left">Connection</th>
        <th className="p-2 text-left">On/Off</th>
        <th className="p-2 text-left">Expiry</th>
        <th className="p-2 text-left">Action</th>
      </tr>
    </thead>
    <tbody>
      {!loading && rows.length === 0 && (
        <tr>
          <td colSpan={11} className="p-4 text-center text-gray-500">
            No data available in table
          </td>
        </tr>
      )}

      {rows.map((r, idx) => (
        <tr key={(r.id || r.username) + idx} className="border-t border-gray-700">
          <td className="p-2">{r.id || "-"}</td>
          <td className="p-2">
            {r.photoUrl ? (
              <img src={r.photoUrl} alt="photo" className="w-8 h-8 rounded" />
            ) : (
              <div className="w-8 h-8 bg-gray-600 rounded" />
            )}
          </td>
          <td className="p-2">{r.username}</td>
          <td className="p-2">{r.mobile || "-"}</td>
          <td className="p-2">{r.package || "-"}</td>
          <td className="p-2">{r.salesperson || "-"}</td>
          <td className="p-2">
            {r.balance != null ? r.balance.toFixed(2) : "-"}
          </td>
          <td className="p-2">{r.connection || "-"}</td>
          <td className="p-2">
            {r.online ? (
              <span className="text-green-500 font-semibold">Online</span>
            ) : (
              <span className="text-gray-400">Offline</span>
            )}
          </td>
          <td className="p-2">
            {r.expiryDate ? new Date(r.expiryDate).toLocaleDateString() : "-"}
          </td>
          <td className="p-2 space-x-2">
            <button
              className="px-2 py-1 bg-blue-600 text-white rounded text-xs"
              onClick={() => alert("View user")}
            >
              View
            </button>
            <button
              className="px-2 py-1 bg-yellow-600 text-white rounded text-xs"
              onClick={() => toggleDisable(r)}
            >
              {r.disabled ? "Enable" : "Disable"}
            </button>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
</div>


      {/* Pagination */}
      <div className="flex items-center justify-between mt-3 text-gray-400">
        <div>
          Showing {rows.length ? start : 0} to {rows.length ? end : 0} of {total} entries
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded disabled:opacity-50"
          >
            <ChevronLeft size={14} />
          </button>
          <div className="px-3 py-1 bg-gray-900 rounded">
            {page} / {totalPages}
          </div>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded disabled:opacity-50"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
