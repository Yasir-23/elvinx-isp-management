import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import {
  Users,
  Pencil,
  Ban,
  CheckCircle,
  Trash2,
  Printer,
  Copy,
  FileText,
  FileSpreadsheet,
  FileDown,
  UserPlus,
} from "lucide-react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import AddUserModal from "../components/AddUserModal";
import { toast } from "react-hot-toast";

export default function AllUsers() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("id");
  const [order, setOrder] = useState("desc");
  const [copySuccess, setCopySuccess] = useState(false);
  const [showAddUser, setShowAddUser] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);

      const res = await api.get("/users", {
        params: {
          page,
          limit,
          search,
          sort,
          order,
        },
      });

      if (res.data?.success) {
        setUsers(res.data.data || []);
        setTotal(res.data.total || 0);

        console.log("✅ Users loaded:", res.data.data);
      }
    } catch (err) {
      console.error("❌ Failed to load users:", err);
    } finally {
      setLoading(false);
    }
  };

  /* Sorting function */
  const handleSort = (field) => {
    if (sort === field) {
      setOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSort(field);
      setOrder("asc");
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, limit, search, sort, order]);

  {
    /* Enable/Disable function */
  }
  const toggleUserStatus = async (user) => {
    if (!user?.id) {
      toast.error("User ID missing.");
      return;
    }

    try {
      const endpoint = user.disabled
        ? `/users/${user.id}/enable`
        : `/users/${user.id}/disable`;

      const res = await api.post(endpoint);

      if (res.data?.success) {
        toast.success(
          `User ${user.disabled ? "enabled" : "disabled"} successfully.`
        );
        return;
      }

      toast.error("Operation failed.");
    } catch (err) {
      console.warn("Toggle warning (ignored):", err);

      // Show server error if available
      toast.error(err.response?.data?.error || "Server error");
    } finally {
      // ✅ KEEP existing behavior
      fetchUsers();
    }
  };

  {
    /* Delete user function */
  }
  const deleteUser = async (user) => {
    const ok = window.confirm(
      `Delete "${user.username}"?\nThis will remove the user from MikroTik AND database.`
    );
    if (!ok) return;

    try {
      await api.delete(`/users/${user.id}`);

      // If you deleted the last row on this page, go back a page
      if (users.length === 1 && page > 1) {
        setPage(page - 1); // useEffect will fetch
        return;
      }

      // Otherwise just refresh this page
      fetchUsers();
    } catch (err) {
      console.error("Delete failed:", err);
      toast.error(err.response?.data?.error || "Failed to delete user");
    }
  };

  // Pagination calculations
  const start = total === 0 ? 0 : (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);
  const totalPages = Math.ceil(total / limit);

  // ---------- COPY (current page only) ----------
  const cleanCell = (val) => {
    if (val === null || val === undefined) return "";
    return String(val)
      .replace(/\r?\n|\r/g, " ")
      .replace(/\t/g, " ")
      .trim();
  };

  const getStatusText = (user) => {
    if (user.disabled) return "Disabled";
    if (user.online) return "Online";
    return "Offline";
  };

  const buildCopyTSV = () => {
    // Columns MUST match what user sees in table (skip Photo + Action)
    const headers = [
      "#",
      "Name",
      "User ID",
      "Mobile",
      "Package",
      "Salesperson",
      "Status",
    ];

    const lines = [];
    lines.push(headers.join("\t"));

    users.forEach((user, index) => {
      const row = [
        start + index, // same as your "#" column
        user.name || "-", // same as UI
        user.username || "-", // same as UI
        user.mobile || "-", // same as UI
        user.package || "-", // same as UI
        user.salesperson || "-", // same as UI
        getStatusText(user), // Disabled/Online/Offline exactly like UI
      ].map(cleanCell);

      lines.push(row.join("\t"));
    });

    return lines.join("\n");
  };

  const copyToClipboard = async (text) => {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return;
    }
    // fallback
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
  };

  const handleCopy = async () => {
    try {
      const text = buildCopyTSV();
      await copyToClipboard(text);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000); // auto hide
    } catch (err) {
      console.error("❌ Copy failed:", err);
    }
  };

  // ---------- CSV EXPORT ----------
  const buildCSV = () => {
    const headers = [
      "#",
      "Name",
      "User ID",
      "Mobile",
      "Package",
      "Salesperson",
      "Status",
    ];

    const rows = users.map((user, index) => [
      start + index,
      user.name || "",
      user.username || "",
      user.mobile || "",
      user.package || "",
      user.salesperson || "",
      getStatusText(user),
    ]);

    const csvContent = [headers, ...rows]
      .map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
      )
      .join("\n");

    return csvContent;
  };

  const downloadCSV = () => {
    const csv = buildCSV();
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `users_page_${page}.csv`;
    link.click();

    URL.revokeObjectURL(url);
  };
  // ---------- /CSV EXPORT ----------

  // ---------- EXCEL EXPORT ----------
  const downloadExcel = () => {
    const headers = [
      "#",
      "Name",
      "User ID",
      "Mobile",
      "Package",
      "Salesperson",
      "Status",
    ];

    const data = users.map((user, index) => ({
      "#": start + index,
      Name: user.name || "",
      "User ID": user.username || "",
      Mobile: user.mobile || "",
      Package: user.package || "",
      Salesperson: user.salesperson || "",
      Status: getStatusText(user),
    }));

    const worksheet = XLSX.utils.json_to_sheet(data, {
      header: headers,
    });

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Users");

    XLSX.writeFile(workbook, `users_page_${page}.xlsx`);
  };
  // ---------- /EXCEL EXPORT ----------

  // ---------- PDF EXPORT ----------
  const downloadPDF = () => {
    const doc = new jsPDF({
      orientation: "landscape",
      unit: "pt",
      format: "A4",
    });

    const headers = [
      ["#", "Name", "User ID", "Mobile", "Package", "Salesperson", "Status"],
    ];

    const body = users.map((user, index) => [
      start + index,
      user.name || "",
      user.username || "",
      user.mobile || "",
      user.package || "",
      user.salesperson || "",
      getStatusText(user),
    ]);

    doc.setFontSize(14);
    doc.text("Users List (Current Page)", 40, 40);

    autoTable(doc, {
      startY: 60,
      head: headers,
      body: body,
      styles: {
        fontSize: 9,
        cellPadding: 6,
      },
      headStyles: {
        fillColor: [30, 30, 30],
        textColor: 255,
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245],
      },
      margin: { left: 40, right: 40 },
    });

    doc.save(`users_page_${page}.pdf`);
  };
  // ---------- /PDF EXPORT ----------

  const handlePrint = () => window.print();

  return (
    <div className="p-4 space-y-4">
      <button
        onClick={() => setShowAddUser(true)} // SAME function sidebar uses
        className=" flex items-center gap-1.5 px-2 py-1.5 text-sm rounded border border-gray-700 bg-gray-900 text-gray-300 hover:bg-gray-700 hover:text-white transition"
      >
        <UserPlus size={18} />
        Add User
      </button>
      {/* Page Header - HIDDEN IN PRINT */}
      <div className="flex items-center gap-2 bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 screen-only">
        <Users className="text-sky-400" size={20} />
        <h1 className="text-lg font-semibold text-white">All Users</h1>
      </div>

      {/* Controls - HIDDEN IN PRINT */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 screen-only">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Left side: Show entries + export buttons */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Show entries */}
            <div className="flex items-center gap-2 text-sm text-gray-300">
              <span>Show</span>
              <select
                value={limit}
                onChange={(e) => {
                  setPage(1); // 🔑 always reset page
                  setLimit(Number(e.target.value));
                }}
                className="bg-gray-900 border border-gray-700 rounded px-2 py-1 text-sm text-white focus:outline-none"
              >
                <option value="10">10</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </select>
              <span>entries</span>
            </div>

            {/* Export buttons */}
            <div className="flex items-center gap-2">
              {/* Print */}
              <button
                onClick={handlePrint}
                className=" flex items-center gap-1.5 px-2 py-1.5 text-sm rounded border border-gray-700 bg-gray-900 text-gray-300 hover:bg-gray-700 hover:text-white transition"
              >
                <Printer size={16} />
                Print
              </button>

              {/* (Copy) */}
              <button
                onClick={handleCopy}
                className=" flex items-center gap-1.5 px-3 py-1.5 text-sm rounded border border-gray-700 bg-gray-900 text-gray-300 hover:bg-gray-700 hover:text-white transition"
              >
                <Copy size={16} />
                Copy
              </button>

              {/* PDF */}
              <button
                onClick={downloadPDF}
                className=" flex items-center gap-1.5 px-3 py-1.5 text-sm rounded border border-gray-700 bg-gray-900 text-gray-300 hover:bg-gray-700 hover:text-white transition"
              >
                <FileText size={16} />
                PDF
              </button>

              {/* Excel */}
              <button
                onClick={downloadExcel}
                className=" flex items-center gap-1.5 px-3 py-1.5 text-sm rounded border border-gray-700 bg-gray-900 text-gray-300 hover:bg-gray-700 hover:text-white transition"
              >
                <FileSpreadsheet size={16} />
                Excel
              </button>

              {/* CSV */}
              <button
                onClick={downloadCSV}
                className=" flex items-center gap-1.5 px-3 py-1.5 text-sm rounded border border-gray-700 bg-gray-900 text-gray-300 hover:bg-gray-700 hover:text-white transition"
              >
                <FileDown size={16} />
                CSV
              </button>
            </div>
          </div>

          {/* Right side: Search */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-300">Search:</span>
            <input
              type="text"
              placeholder="Search users..."
              value={search}
              onChange={(e) => {
                setPage(1); // 🔑 reset page
                setSearch(e.target.value);
              }}
              className="bg-gray-900 border border-gray-700 rounded px-3 py-1.5 text-sm text-white focus:outline-none focus:border-sky-500"
            />
          </div>
        </div>
      </div>

      {/* Users Table - VISIBLE IN PRINT */}
      <div
        id="print-area"
        className="bg-gray-800 border border-gray-700 rounded-lg overflow-x-auto"
      >
        {/* PRINT ONLY Header */}
        <div className="hidden print-only mb-4">
          <h1 className="text-2xl font-bold text-black mb-1">All Users List</h1>
          <p className="text-sm text-gray-600">
            Generated on: {new Date().toLocaleString()}
          </p>
        </div>

        <table className="min-w-full text-sm">
          <thead className="bg-gray-900 text-gray-300">
            <tr>
              <th className="px-4 py-3 text-left">#</th>
              {/* Photo - Hide in Print? Per requirements: Skip Photo */}
              <th className="px-4 py-3 text-left screen-only">Photo</th>
              <th
                className="px-4 py-3 text-left cursor-pointer select-none"
                onClick={() => handleSort("name")}
              >
                Name
                {sort === "name" && (order === "asc" ? " ▲" : " ▼")}
              </th>
              <th
                onClick={() => handleSort("username")}
                className="px-4 py-3 text-left cursor-pointer select-none"
              >
                User ID
                {sort === "username" && (order === "asc" ? " ▲" : " ▼")}
              </th>
              <th className="px-4 py-3 text-left">Mobile</th>
              <th
                onClick={() => handleSort("package")}
                className="px-4 py-3 text-left cursor-pointer select-none"
              >
                Package {sort === "package" && (order === "asc" ? " ▲" : " ▼")}
              </th>
              <th
                onClick={() => handleSort("salesperson")}
                className="px-4 py-3 text-left"
              >
                Salesperson
                {sort === "salesperson" && (order === "asc" ? " ▲" : " ▼")}
              </th>
              <th
                onClick={() => handleSort("disabled")}
                className="px-4 py-3 text-left"
              >
                Status
                {sort === "disabled" && (order === "asc" ? " ▲" : " ▼")}
              </th>
              {/* Action - Hide in Print */}
              <th className="px-4 py-3 text-center screen-only">Action</th>
            </tr>
          </thead>

          <tbody>
            {users.map((user, index) => (
              <tr key={user.id} className="border-b border-gray-700">
                {/* No */}
                <td className="px-3 py-2 text-sm">{start + index}</td>

                {/* Photo (Hidden in screen-only class above check) */}
                <td className="px-3 py-2 screen-only">
                  <img
                    src={user.photoUrl || "/avatar.png"}
                    alt=""
                    className="w-8 h-8 rounded-full"
                  />
                </td>

                <td className="px-3 py-2">{user.name || "-"}</td>
                <td className="px-3 py-2">{user.username}</td>
                <td className="px-3 py-2">{user.mobile || "-"}</td>
                <td className="px-3 py-2">{user.package || "-"}</td>
                <td className="px-3 py-2">{user.salesperson || "-"}</td>
                <td className="px-3 py-2">
                  {(() => {
                    // Check for Expiry
                    const isExpired = user.expiryDate && new Date(user.expiryDate) < new Date();

                    if (user.disabled) {
                      if (isExpired) {
                        // Orange for Expired (using your same style structure)
                        return (
                          <span className="px-2 py-1 rounded text-xs bg-orange-500 text-white print:bg-transparent print:text-black print:border print:border-black">
                            Expired
                          </span>
                        );
                      }
                      // Red for Disabled
                      return (
                        <span className="px-2 py-1 rounded text-xs bg-red-600 text-white print:bg-transparent print:text-black print:border print:border-black">
                          Disabled
                        </span>
                      );
                    }

                    // Green for Online
                    if (user.online) {
                      return (
                        <span className="px-2 py-1 rounded text-xs bg-green-600 text-white print:bg-transparent print:text-black print:border print:border-black">
                          Online
                        </span>
                      );
                    }

                    // Gray for Offline
                    return (
                      <span className="px-2 py-1 rounded text-xs bg-gray-600 text-white print:bg-transparent print:text-black print:border print:border-black">
                        Offline
                      </span>
                    );
                  })()}
                </td>

                {/* Buttons (Hidden in screen-only) */}
                <td className="px-4 py-2 screen-only">
                  <div className="flex items-center justify-center gap-1">
                    <button
                      onClick={() => navigate(`/users/${user.id}/profile`)}
                      className="p-2 rounded hover:bg-gray-700 text-blue-400"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => toggleUserStatus(user)}
                      className={`p-2 rounded hover:bg-gray-700 ${
                        user.disabled ? "text-green-400" : "text-yellow-400"
                      }`}
                    >
                      {user.disabled ? (
                        <CheckCircle size={16} />
                      ) : (
                        <Ban size={16} />
                      )}
                    </button>
                    <button
                      onClick={() => deleteUser(user)}
                      className="p-2 rounded bg-red-600/20 hover:bg-red-600/30 text-red-400"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Print Only Footer */}
        <div className="hidden print-only mt-4 border-t border-gray-400 pt-2 text-sm text-gray-600">
          Showing {start} to {Math.min(end, total)} of {total} entries (Page{" "}
          {page})
        </div>

        {/* Screen Only Footer (Pagination) */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 px-4 pb-4 text-sm text-gray-400 screen-only">
          <div>
            Showing <span className="text-white">{start}</span> to{" "}
            <span className="text-white">{end}</span> of{" "}
            <span className="text-white">{total}</span> entries
          </div>

          <div className="flex items-center gap-1">
            <button
              className="px-3 py-1 rounded border border-gray-600 hover:bg-gray-700 disabled:opacity-50"
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </button>
            <button className="px-3 py-1 rounded bg-sky-600 text-white cursor-default">
              {page}
            </button>
            <button
              className="px-3 py-1 rounded border border-gray-600 hover:bg-gray-700 disabled:opacity-50"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
            </button>
          </div>
        </div>
      </div>
      {copySuccess && (
        <div className="fixed bottom-5 right-5 z-50 px-4 py-2 rounded-md bg-green-600 text-white text-sm shadow-lg">
          ✅ Copied to clipboard
        </div>
      )}
      {/* Add User Modal */}
      {showAddUser && (
        <AddUserModal
          onClose={() => setShowAddUser(false)}
          onCreated={() => window.location.reload()}
        />
      )}
    </div>
  );
}
