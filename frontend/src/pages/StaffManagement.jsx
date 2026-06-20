import React, { useEffect, useState } from "react";
import api from "../services/api";
import {
  Shield,
  Search,
  RefreshCw,
  Printer,
  Copy,
  FileText,
  FileSpreadsheet,
  FileDown,
  UserPlus,
  Wallet,
  Landmark,
  Pencil,
} from "lucide-react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import AddStaffModal from "../components/AddStaffModal";
import TransferCreditsModal from "../components/TransferCreditsModal";
import AdjustBalanceModal from "../components/AdjustBalanceModal";

export default function StaffManagement() {
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [sort, setSort] = useState("createdAt");
  const [order, setOrder] = useState("desc");
  const [copySuccess, setCopySuccess] = useState(false);
  const [showAddStaff, setShowAddStaff] = useState(false);
  const [selectedStaffForEdit, setSelectedStaffForEdit] = useState(null);
  const [selectedStaffForTransfer, setSelectedStaffForTransfer] = useState(null);
  const [selectedStaffForAdjust, setSelectedStaffForAdjust] = useState(null);

  const token = localStorage.getItem("token");
  let userRole = "";
  let userId = null;
  try {
    if (token) {
      const payload = JSON.parse(atob(token.split(".")[1]));
      userRole = payload.role;
      userId = payload.id;
    }
  } catch (e) {
    console.error("JWT parse error in StaffManagement:", e);
  }

  const fetchStaff = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get("/staff");
      if (res.data?.success) {
        setStaffList(res.data.staff || []);
      }
    } catch (err) {
      console.error("Failed to load staff:", err);
      setError("Failed to load staff data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleSort = (field) => {
    if (sort === field) {
      setOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSort(field);
      setOrder("asc");
    }
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case "SUPER_ADMIN":
        return "bg-red-600";
      case "FRANCHISE":
        return "bg-purple-600";
      case "DEALER":
        return "bg-sky-600";
      case "SUB_DEALER":
        return "bg-emerald-600";
      default:
        return "bg-gray-600";
    }
  };

  const getDirectChildRoles = (role) => {
    if (role === "SUPER_ADMIN") return ["FRANCHISE", "DEALER", "SUB_DEALER"];
    if (role === "FRANCHISE") return ["DEALER", "SUB_DEALER"];
    if (role === "DEALER") return ["SUB_DEALER"];
    return [];
  };

  const canEditPackages = (staff) => {
    if (!staff || staff.role === "SUPER_ADMIN") return false;
    if (userRole === "SUPER_ADMIN") return true;

    return (
      staff.parentId === userId &&
      getDirectChildRoles(userRole).includes(staff.role)
    );
  };

  const filteredStaff = staffList.filter((s) => {
    if (!search) return true;
    const term = search.toLowerCase();
    return (
      (s.name || "").toLowerCase().includes(term) ||
      (s.username || "").toLowerCase().includes(term) ||
      (s.role || "").toLowerCase().includes(term)
    );
  });

  const sortedStaff = [...filteredStaff].sort((a, b) => {
    let valA = a[sort];
    let valB = b[sort];

    if (sort === "walletBalance") {
      valA = valA || 0;
      valB = valB || 0;
    }

    if (valA < valB) return order === "asc" ? -1 : 1;
    if (valA > valB) return order === "asc" ? 1 : -1;
    return 0;
  });

  const total = sortedStaff.length;
  const totalPages = Math.ceil(total / limit);
  const start = total === 0 ? 0 : (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);
  const paginatedStaff = sortedStaff.slice((page - 1) * limit, page * limit);

  const cleanCell = (val) => {
    if (val === null || val === undefined) return "";
    return String(val).replace(/\r?\n|\r/g, " ").replace(/\t/g, " ").trim();
  };

  const getPackageSummary = (staff) => {
    const assignments = staff.packageAssignments || [];
    if (assignments.length === 0) return "No packages";

    return assignments
      .map((assignment) => assignment.package?.displayName || assignment.package?.name || `#${assignment.packageId}`)
      .join(", ");
  };

  const buildCopyTSV = () => {
    const headers = [
      "#",
      "Name",
      "Username",
      "Role",
      "Packages",
      "Wallet Balance",
      "Joined Date",
    ];

    const lines = [headers.join("\t")];

    paginatedStaff.forEach((staff, index) => {
      const row = [
        start + index,
        staff.name || "-",
        staff.username || "-",
        (staff.role || "").replace("_", " "),
        getPackageSummary(staff),
        staff.walletBalance != null ? staff.walletBalance : "0",
        new Date(staff.createdAt).toLocaleDateString(),
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
      await copyToClipboard(buildCopyTSV());
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error("Copy failed:", err);
    }
  };

  const buildCSV = () => {
    const headers = [
      "#",
      "Name",
      "Username",
      "Role",
      "Packages",
      "Wallet Balance",
      "Joined Date",
    ];

    const rows = sortedStaff.map((staff, index) => [
      index + 1,
      staff.name || "",
      staff.username || "",
      (staff.role || "").replace("_", " "),
      getPackageSummary(staff),
      staff.walletBalance != null ? staff.walletBalance : "0",
      new Date(staff.createdAt).toLocaleDateString(),
    ]);

    return [headers, ...rows]
      .map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
      )
      .join("\n");
  };

  const downloadCSV = () => {
    const csv = buildCSV();
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "staff_list.csv";
    link.click();

    URL.revokeObjectURL(url);
  };

  const downloadExcel = () => {
    const data = sortedStaff.map((staff, index) => ({
      "#": index + 1,
      Name: staff.name || "",
      Username: staff.username || "",
      Role: (staff.role || "").replace("_", " "),
      Packages: getPackageSummary(staff),
      "Wallet Balance": staff.walletBalance != null ? staff.walletBalance : 0,
      "Joined Date": new Date(staff.createdAt).toLocaleDateString(),
    }));

    const worksheet = XLSX.utils.json_to_sheet(data, {
      header: [
        "#",
        "Name",
        "Username",
        "Role",
        "Packages",
        "Wallet Balance",
        "Joined Date",
      ],
    });

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Staff");
    XLSX.writeFile(workbook, "staff_list.xlsx");
  };

  const downloadPDF = () => {
    const doc = new jsPDF({
      orientation: "landscape",
      unit: "pt",
      format: "A4",
    });

    const headers = [[
      "#",
      "Name",
      "Username",
      "Role",
      "Packages",
      "Wallet Balance",
      "Joined Date",
    ]];

    const body = sortedStaff.map((staff, index) => [
      index + 1,
      staff.name || "",
      staff.username || "",
      (staff.role || "").replace("_", " "),
      getPackageSummary(staff),
      staff.walletBalance != null ? staff.walletBalance : "0",
      new Date(staff.createdAt).toLocaleDateString(),
    ]);

    doc.setFontSize(14);
    doc.text("Staff List", 40, 40);

    autoTable(doc, {
      startY: 60,
      head: headers,
      body,
      styles: { fontSize: 9, cellPadding: 6 },
      headStyles: { fillColor: [30, 30, 30], textColor: 255 },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      margin: { left: 40, right: 40 },
    });

    doc.save("staff_list.pdf");
  };

  const handlePrint = () => window.print();

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 screen-only">
        <div className="flex items-center gap-2">
          <Shield className="text-sky-400" size={20} />
          <h1 className="text-lg font-semibold text-white">Staff Management</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddStaff(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded border border-gray-700 bg-gray-900 text-gray-300 hover:bg-gray-700 hover:text-white transition"
          >
            <UserPlus size={16} /> Add Staff
          </button>
          <button
            onClick={fetchStaff}
            disabled={loading}
            className="p-1.5 text-gray-400 hover:text-white transition"
          >
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 screen-only">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-gray-300">
              <span>Show</span>
              <select
                value={limit}
                onChange={(e) => {
                  setPage(1);
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

            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-2 py-1.5 text-sm rounded border border-gray-700 bg-gray-900 text-gray-300 hover:bg-gray-700 hover:text-white transition"
              >
                <Printer size={16} /> Print
              </button>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded border border-gray-700 bg-gray-900 text-gray-300 hover:bg-gray-700 hover:text-white transition"
              >
                <Copy size={16} /> Copy
              </button>
              <button
                onClick={downloadPDF}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded border border-gray-700 bg-gray-900 text-gray-300 hover:bg-gray-700 hover:text-white transition"
              >
                <FileText size={16} /> PDF
              </button>
              <button
                onClick={downloadExcel}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded border border-gray-700 bg-gray-900 text-gray-300 hover:bg-gray-700 hover:text-white transition"
              >
                <FileSpreadsheet size={16} /> Excel
              </button>
              <button
                onClick={downloadCSV}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded border border-gray-700 bg-gray-900 text-gray-300 hover:bg-gray-700 hover:text-white transition"
              >
                <FileDown size={16} /> CSV
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-300">Search:</span>
            <div className="relative">
              <Search className="absolute left-2.5 top-2 text-gray-500" size={14} />
              <input
                type="text"
                placeholder="Search staff..."
                value={search}
                onChange={(e) => {
                  setPage(1);
                  setSearch(e.target.value);
                }}
                className="bg-gray-900 border border-gray-700 rounded pl-8 pr-3 py-1.5 text-sm text-white focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>
        </div>
      </div>

      <div
        id="print-area"
        className="bg-gray-800 border border-gray-700 rounded-lg overflow-x-auto"
      >
        <div className="hidden print-only mb-4">
          <h1 className="text-2xl font-bold text-black mb-1">Staff List</h1>
          <p className="text-sm text-gray-600">
            Generated on: {new Date().toLocaleString()}
          </p>
        </div>

        <table className="min-w-full text-sm">
          <thead className="bg-gray-900 text-gray-300">
            <tr>
              <th className="px-4 py-3 text-left">#</th>
              <th
                className="px-4 py-3 text-left cursor-pointer select-none"
                onClick={() => handleSort("name")}
              >
                Name {sort === "name" && (order === "asc" ? " ▲" : " ▼")}
              </th>
              <th
                className="px-4 py-3 text-left cursor-pointer select-none"
                onClick={() => handleSort("username")}
              >
                Username {sort === "username" && (order === "asc" ? " ▲" : " ▼")}
              </th>
              <th
                className="px-4 py-3 text-left cursor-pointer select-none"
                onClick={() => handleSort("role")}
              >
                Role {sort === "role" && (order === "asc" ? " ▲" : " ▼")}
              </th>
              <th className="px-4 py-3 text-left">Packages</th>
              <th
                className="px-4 py-3 text-left cursor-pointer select-none"
                onClick={() => handleSort("walletBalance")}
              >
                Wallet Balance {sort === "walletBalance" && (order === "asc" ? " ▲" : " ▼")}
              </th>
              <th
                className="px-4 py-3 text-left cursor-pointer select-none"
                onClick={() => handleSort("createdAt")}
              >
                Joined Date {sort === "createdAt" && (order === "asc" ? " ▲" : " ▼")}
              </th>
              <th className="px-4 py-3 text-center screen-only">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading && staffList.length === 0 ? (
              <tr>
                <td colSpan="8" className="text-center py-8 text-gray-400">
                  Loading staff data...
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan="8" className="text-center py-8 text-red-400">
                  {error}
                </td>
              </tr>
            ) : paginatedStaff.length === 0 ? (
              <tr>
                <td colSpan="8" className="text-center py-8 text-gray-400">
                  No staff members found.
                </td>
              </tr>
            ) : (
              paginatedStaff.map((staff, index) => (
                <tr key={staff.id} className="border-b border-gray-700 hover:bg-gray-750 transition-colors">
                  <td className="px-4 py-3 text-sm">{start + index}</td>
                  <td className="px-4 py-3 text-white font-medium">
                    <div className="flex items-center gap-3">
                      {staff.photoUrl ? (
                        <img src={staff.photoUrl} alt="" className="w-8 h-8 rounded-full" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-xs font-bold">
                          {staff.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      {staff.name}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-300">{staff.username}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs font-bold text-white shadow-sm print:bg-transparent print:text-black print:shadow-none print:border print:border-black ${getRoleBadgeColor(staff.role)}`}>
                      {staff.role.replace("_", " ")}
                    </span>
                    {staff.parent?.username && (
                      <div className="text-xs text-gray-400 mt-1 print:text-gray-600">
                        Manager: {staff.parent.username}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {staff.packageAssignments?.length ? (
                      <div className="flex max-w-xs flex-wrap gap-1">
                        {staff.packageAssignments.map((assignment) => (
                          <span
                            key={`${staff.id}-${assignment.packageId}`}
                            className={`rounded-full px-2 py-1 text-xs ${
                              assignment.package?.sellable
                                ? "bg-teal-500/10 text-teal-300 border border-teal-500/20"
                                : "bg-amber-500/10 text-amber-300 border border-amber-500/20"
                            }`}
                          >
                            {assignment.package?.displayName || assignment.package?.name || `#${assignment.packageId}`}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-gray-500">No packages</span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono text-gray-300">
                    {staff.walletBalance != null ? staff.walletBalance.toLocaleString() : "0"}
                  </td>
                  <td className="px-4 py-3 text-gray-400">
                    {new Date(staff.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-center screen-only">
                    <div className="flex items-center justify-center gap-2">
                      {canEditPackages(staff) && (
                        <button
                          onClick={() => setSelectedStaffForEdit(staff)}
                          title="Edit Package Access"
                          className="p-2 rounded bg-teal-600/20 text-teal-400 hover:bg-teal-600/40 transition"
                        >
                          <Pencil size={16} />
                        </button>
                      )}
                      <button
                        onClick={() => setSelectedStaffForTransfer(staff)}
                        title="Transfer Credits"
                        className="p-2 rounded bg-sky-600/20 text-sky-400 hover:bg-sky-600/40 transition"
                      >
                        <Wallet size={16} />
                      </button>
                      {userRole === "SUPER_ADMIN" && (
                        <button
                          onClick={() => setSelectedStaffForAdjust(staff)}
                          title="Adjust Balance"
                          className="p-2 rounded bg-rose-600/20 text-rose-400 hover:bg-rose-600/40 transition"
                        >
                          <Landmark size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <div className="hidden print-only mt-4 border-t border-gray-400 pt-2 text-sm text-gray-600">
          Showing {start} to {end} of {total} entries
        </div>

        {!loading && !error && staffList.length > 0 && (
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
                disabled={page >= totalPages || totalPages === 0}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {copySuccess && (
        <div className="fixed bottom-5 right-5 z-50 px-4 py-2 rounded-md bg-green-600 text-white text-sm shadow-lg">
          Copied to clipboard
        </div>
      )}

      {showAddStaff && (
        <AddStaffModal
          onClose={() => setShowAddStaff(false)}
          onStaffAdded={fetchStaff}
        />
      )}

      {selectedStaffForEdit && (
        <AddStaffModal
          staffToEdit={selectedStaffForEdit}
          onClose={() => setSelectedStaffForEdit(null)}
          onStaffAdded={fetchStaff}
        />
      )}

      {selectedStaffForTransfer && (
        <TransferCreditsModal
          receiver={selectedStaffForTransfer}
          onClose={() => setSelectedStaffForTransfer(null)}
          onSuccess={fetchStaff}
        />
      )}

      {selectedStaffForAdjust && (
        <AdjustBalanceModal
          target={selectedStaffForAdjust}
          onClose={() => setSelectedStaffForAdjust(null)}
          onSuccess={fetchStaff}
        />
      )}
    </div>
  );
}
