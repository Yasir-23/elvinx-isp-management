import React, { useEffect, useState } from "react";
import api from "../services/api";
import {
  Package,
  Pencil,
  Printer,
  Copy,
  FileText,
  FileSpreadsheet,
  FileDown,
} from "lucide-react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";

export default function AllPackages() {
  const [packages, setPackages] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("id");
  const [order, setOrder] = useState("desc");
  const [copySuccess, setCopySuccess] = useState(false);
  const [togglingPackageId, setTogglingPackageId] = useState(null);
  const navigate = useNavigate();

  const token = localStorage.getItem("token");
  let userRole = "";
  try {
    if (token) {
      const payload = JSON.parse(atob(token.split(".")[1]));
      userRole = payload.role || "";
    }
  } catch (err) {
    console.error("JWT parse error in AllPackagesPage:", err);
  }

  const fetchPackages = async () => {
    try {
      setLoading(true);

      const res = await api.get("/packages", {
        params: { page, limit, search, sort, order },
      });

      if (res.data?.success) {
        setPackages(res.data.data || []);
        setTotal(res.data.total || 0);
      }
    } catch (err) {
      console.error("Failed to fetch packages:", err);
      toast.error("Failed to load packages");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPackages();
  }, [page, limit, search, sort, order]);

  const handleSort = (field) => {
    if (sort === field) {
      setOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSort(field);
      setOrder("asc");
    }
  };

  const handleToggleSellable = async (pkg) => {
    if (userRole !== "SUPER_ADMIN") return;

    try {
      setTogglingPackageId(pkg.id);

      const res = await api.patch(`/packages/${pkg.id}/sellable`, {
        sellable: !pkg.sellable,
      });

      if (res.data?.success) {
        toast.success(
          `${pkg.displayName || pkg.name} is now ${
            !pkg.sellable ? "sellable" : "hidden"
          }`
        );
        await fetchPackages();
      } else {
        toast.error(res.data?.error || "Failed to update package visibility");
      }
    } catch (err) {
      console.error("Failed to toggle package visibility:", err);
      toast.error(
        err.response?.data?.error || "Failed to update package visibility"
      );
    } finally {
      setTogglingPackageId(null);
    }
  };

  const start = total === 0 ? 0 : (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);
  const totalPages = Math.ceil(total / limit);

  const cleanCell = (val) => {
    if (val === null || val === undefined) return "";
    return String(val).replace(/\s+/g, " ").trim();
  };

  const buildCopyTSV = () => {
    const headers = [
      "#",
      "Name",
      "Volume",
      "Visibility",
      "Users",
      "Active",
      "Regular Price",
    ];
    const lines = [headers.join("\t")];

    packages.forEach((pkg, index) => {
      const row = [
        start + index,
        pkg.displayName || "-",
        pkg.name || "-",
        pkg.sellable ? "Sellable" : "Hidden",
        pkg.usersCount || "",
        pkg.activeCount || "",
        pkg.regularPrice ?? "-",
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
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
  };

  const handleCopy = async () => {
    const text = buildCopyTSV();
    await copyToClipboard(text);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const handlePrint = () => {
    const doc = new jsPDF({
      orientation: "landscape",
      unit: "pt",
      format: "A4",
    });

    const headers = [
      ["#", "Name", "Volume", "Visibility", "Users", "Active", "Regular Price"],
    ];

    const body = packages.map((pkg, index) => [
      start + index,
      pkg.displayName || "",
      pkg.name || "",
      pkg.sellable ? "Sellable" : "Hidden",
      pkg.usersCount || "",
      pkg.activeCount || "",
      pkg.regularPrice ?? "",
    ]);

    doc.setFontSize(14);
    doc.text("Packages List (Current Page)", 40, 40);

    autoTable(doc, {
      startY: 60,
      head: headers,
      body,
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

    const pdfBlob = doc.output("bloburl");
    window.open(pdfBlob, "_blank");
  };

  const downloadCSV = () => {
    const headers = [
      "#",
      "Name",
      "Volume",
      "Visibility",
      "Users",
      "Active",
      "Regular Price",
    ];

    const rows = packages.map((pkg, index) => [
      start + index,
      pkg.displayName || "",
      pkg.name || "",
      pkg.sellable ? "Sellable" : "Hidden",
      pkg.usersCount || "",
      pkg.activeCount || "",
      pkg.regularPrice ?? "",
    ]);

    const csvContent = [headers, ...rows]
      .map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
      )
      .join("\n");

    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `packages_page_${page}.csv`;
    link.click();

    URL.revokeObjectURL(url);
  };

  const downloadExcel = () => {
    const data = packages.map((pkg, index) => ({
      "#": start + index,
      Name: pkg.displayName || "",
      Volume: pkg.name || "",
      Visibility: pkg.sellable ? "Sellable" : "Hidden",
      Users: pkg.usersCount || "",
      Active: pkg.activeCount || "",
      "Regular Price": pkg.regularPrice ?? "",
    }));

    const worksheet = XLSX.utils.json_to_sheet(data, {
      header: [
        "#",
        "Name",
        "Volume",
        "Visibility",
        "Users",
        "Active",
        "Regular Price",
      ],
    });

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Packages");

    XLSX.writeFile(workbook, `packages_page_${page}.xlsx`);
  };

  const downloadPDF = () => {
    const doc = new jsPDF({
      orientation: "landscape",
      unit: "pt",
      format: "A4",
    });

    const headers = [
      ["#", "Name", "Volume", "Visibility", "Users", "Active", "Regular Price"],
    ];

    const body = packages.map((pkg, index) => [
      start + index,
      pkg.displayName || "",
      pkg.name || "",
      pkg.sellable ? "Sellable" : "Hidden",
      pkg.usersCount || "",
      pkg.activeCount || "",
      pkg.regularPrice ?? "",
    ]);

    doc.setFontSize(14);
    doc.text("Packages List (Current Page)", 40, 40);

    autoTable(doc, {
      startY: 60,
      head: headers,
      body,
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

    doc.save(`packages_page_${page}.pdf`);
  };

  const visibilityBadgeClass = (sellable) =>
    sellable
      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
      : "bg-amber-500/10 text-amber-400 border border-amber-500/30";

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-2 bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 screen-only">
        <Package className="text-sky-400" size={20} />
        <h1 className="text-lg font-semibold text-white">All Packages</h1>
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
                className="bg-gray-900 border border-gray-700 rounded px-2 py-1 text-sm text-white"
              >
                <option value="15">15</option>
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
                className="flex items-center gap-1.5 px-2 py-1.5 text-sm rounded border border-gray-700 bg-gray-900 text-gray-300 hover:bg-gray-700 hover:text-white transition"
              >
                <Copy size={16} /> Copy
              </button>
              <button
                onClick={downloadPDF}
                className="flex items-center gap-1.5 px-2 py-1.5 text-sm rounded border border-gray-700 bg-gray-900 text-gray-300 hover:bg-gray-700 hover:text-white transition"
              >
                <FileText size={16} /> PDF
              </button>
              <button
                onClick={downloadExcel}
                className="flex items-center gap-1.5 px-2 py-1.5 text-sm rounded border border-gray-700 bg-gray-900 text-gray-300 hover:bg-gray-700 hover:text-white transition"
              >
                <FileSpreadsheet size={16} /> Excel
              </button>
              <button
                onClick={downloadCSV}
                className="flex items-center gap-1.5 px-2 py-1.5 text-sm rounded border border-gray-700 bg-gray-900 text-gray-300 hover:bg-gray-700 hover:text-white transition"
              >
                <FileDown size={16} /> CSV
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-300">Search:</span>
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setPage(1);
                setSearch(e.target.value);
              }}
              className="bg-gray-900 border border-gray-700 rounded px-3 py-1.5 text-sm text-white"
            />
          </div>
        </div>
      </div>

      <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-900 text-gray-300">
            <tr>
              <th className="px-4 py-3 text-left">#</th>

              <th
                className="px-4 py-3 cursor-pointer text-left select-none"
                onClick={() => handleSort("displayName")}
              >
                Name
                {sort === "displayName" && (order === "asc" ? " ▲" : " ▼")}
              </th>

              <th
                className="px-4 py-3 cursor-pointer text-left"
                onClick={() => handleSort("name")}
              >
                Volume
                {sort === "name" && (order === "asc" ? " ▲" : " ▼")}
              </th>

              <th
                className="px-4 py-3 cursor-pointer text-left"
                onClick={() => handleSort("sellable")}
              >
                Visibility
                {sort === "sellable" && (order === "asc" ? " ▲" : " ▼")}
              </th>

              <th className="px-4 py-3 text-left">Users</th>

              <th className="px-4 py-3 text-left">Active</th>

              <th
                className="px-4 py-3 cursor-pointer text-left"
                onClick={() => handleSort("regularPrice")}
              >
                Regular Price
                {sort === "regularPrice" && (order === "asc" ? " ▲" : " ▼")}
              </th>

              <th className="px-4 py-3 text-center screen-only">Action</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-center text-gray-400">
                  Loading packages...
                </td>
              </tr>
            ) : packages.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-center text-gray-400">
                  No packages found
                </td>
              </tr>
            ) : (
              packages.map((pkg, index) => (
                <tr key={pkg.id || index} className="border-b border-gray-700">
                  <td className="px-4 py-2">{start + index}</td>
                  <td className="px-4 py-2">{pkg.displayName || "-"}</td>
                  <td className="px-4 py-2">{pkg.name || "-"}</td>
                  <td className="px-4 py-2">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${visibilityBadgeClass(
                        pkg.sellable
                      )}`}
                    >
                      {pkg.sellable ? "Sellable" : "Hidden"}
                    </span>
                  </td>
                  <td className="px-4 py-2">{pkg.usersCount || "0"}</td>
                  <td className="px-4 py-2">
                    <span
                      className={
                        pkg.activeCount > 0
                          ? "text-green-400 font-medium"
                          : "text-gray-400"
                      }
                    >
                      {pkg.activeCount}
                    </span>
                  </td>
                  <td className="px-4 py-2">{pkg.regularPrice ?? "-"}</td>
                  <td className="px-4 py-2 text-center screen-only">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => navigate(`/packages/${pkg.id}`)}
                        className="p-2 rounded hover:bg-gray-700 text-blue-400"
                        title="Edit package"
                      >
                        <Pencil size={16} />
                      </button>

                      {userRole === "SUPER_ADMIN" && (
                        <button
                          onClick={() => handleToggleSellable(pkg)}
                          disabled={togglingPackageId === pkg.id}
                          className={`rounded px-3 py-1.5 text-xs font-medium transition ${
                            pkg.sellable
                              ? "bg-amber-500/15 text-amber-300 hover:bg-amber-500/25"
                              : "bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25"
                          } disabled:opacity-60`}
                        >
                          {togglingPackageId === pkg.id
                            ? "Saving..."
                            : pkg.sellable
                            ? "Hide"
                            : "Make Sellable"}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 text-sm text-gray-400 screen-only px-4 pb-4">
          <div>
            Showing <span className="text-white">{start}</span> to{" "}
            <span className="text-white">{end}</span> of{" "}
            <span className="text-white">{total}</span> entries
          </div>

          <div className="flex items-center gap-1">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1 rounded border border-gray-600 disabled:opacity-50"
            >
              Previous
            </button>
            <button className="px-3 py-1 rounded bg-sky-600 text-white">
              {page}
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="px-3 py-1 rounded border border-gray-600 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {copySuccess && (
        <div className="fixed bottom-5 right-5 z-50 px-4 py-2 rounded-md bg-green-600 text-white text-sm shadow-lg">
          Copied to clipboard
        </div>
      )}
    </div>
  );
}
