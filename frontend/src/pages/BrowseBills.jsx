import React, { useEffect, useState } from "react";
import api from "../services/api";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import {
  Copy,
  FileText,
  FileSpreadsheet,
  FileDown,
  Printer,
} from "lucide-react";

/**
 * Browse Bills (Invoices)
 */
export default function BrowseBills() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [copySuccess, setCopySuccess] = useState(false);

  const fetchInvoices = async () => {
    try {
      setLoading(true);

      const res = await api.get("/invoices", {
        params: {
          page,
          limit,
          search,
        },
      });

      if (res.data?.success) {
        setInvoices(res.data.data || []);
        setTotal(res.data.total || 0);
      }
    } catch (err) {
      console.error("❌ Failed to load invoices:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [page, limit, search]);

  const cleanCell = (val) => {
    if (val === null || val === undefined) return "";
    return String(val).replace(/\s+/g, " ").trim();
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

  // ----------------------------
  // EXPORT BUTTON HANDLERS
  // ----------------------------
  const buildCopyTSV = () => {
    const headers = [
      "#",
      "User",
      "Username",
      "Package",
      "Amount",
      "Status",
      "Invoice Date",
    ];

    const lines = [headers.join("\t")];

    invoices.forEach((inv, index) => {
      const row = [
        start + index,
        inv.user?.name || "",
        inv.user?.username || "",
        inv.user?.package || "",
        inv.amount ?? "",
        inv.status || "",
        new Date(inv.invoiceDate).toLocaleDateString(),
      ].map(cleanCell);

      lines.push(row.join("\t"));
    });

    return lines.join("\n");
  };

  const handleCopy = async () => {
    const text = buildCopyTSV();
    await copyToClipboard(text);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const downloadCSV = () => {
    const headers = [
      "#",
      "User",
      "Username",
      "Package",
      "Amount",
      "Status",
      "Invoice Date",
    ];

    const rows = invoices.map((inv, index) => [
      start + index,
      inv.user?.name || "",
      inv.user?.username || "",
      inv.user?.package || "",
      inv.amount ?? "",
      inv.status || "",
      new Date(inv.invoiceDate).toLocaleDateString(),
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
    link.download = `invoices_page_${page}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const downloadExcel = () => {
    const data = invoices.map((inv, index) => ({
      "#": start + index,
      User: inv.user?.name || "",
      Username: inv.user?.username || "",
      Package: inv.user?.package || "",
      Amount: inv.amount ?? "",
      Status: inv.status || "",
      "Invoice Date": new Date(inv.invoiceDate).toLocaleDateString(),
    }));

    const worksheet = XLSX.utils.json_to_sheet(data, {
      header: [
        "#",
        "User",
        "Username",
        "Package",
        "Amount",
        "Status",
        "Invoice Date",
      ],
    });

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Invoices");

    XLSX.writeFile(workbook, `invoices_page_${page}.xlsx`);
  };

  const handlePrint = () => {
    const doc = new jsPDF({
      orientation: "landscape",
      unit: "pt",
      format: "A4",
    });

    const headers = [
      ["#", "User", "Username", "Package", "Amount", "Status", "Invoice Date"],
    ];

    const body = invoices.map((inv, index) => [
      start + index,
      inv.user?.name || "",
      inv.user?.username || "",
      inv.user?.package || "",
      inv.amount ?? "",
      inv.status || "",
      new Date(inv.invoiceDate).toLocaleDateString(),
    ]);

    doc.setFontSize(14);
    doc.text("Invoices (Current Page)", 40, 40);

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

  const downloadPDF = () => {
    const doc = new jsPDF({
      orientation: "landscape",
      unit: "pt",
      format: "A4",
    });

    const headers = [
      ["#", "User", "Username", "Package", "Amount", "Status", "Invoice Date"],
    ];

    const body = invoices.map((inv, index) => [
      start + index,
      inv.user?.name || "",
      inv.user?.username || "",
      inv.user?.package || "",
      inv.amount ?? "",
      inv.status || "",
      new Date(inv.invoiceDate).toLocaleDateString(),
    ]);

    doc.setFontSize(14);
    doc.text("Invoices (Current Page)", 40, 40);

    autoTable(doc, {
      startY: 60,
      head: headers,
      body,
      styles: { fontSize: 9, cellPadding: 6 },
      headStyles: { fillColor: [30, 30, 30], textColor: 255 },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      margin: { left: 40, right: 40 },
    });

    doc.save(`invoices_page_${page}.pdf`);
  };

  // ----------------------------
  // PAGINATION CALC
  // ----------------------------
  const start = total === 0 ? 0 : (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);
  const totalPages = Math.ceil(total / limit);

  return (
    <div className="p-4 space-y-4">
      {/* HEADER */}
      <div className="flex items-center gap-2 bg-gray-800 border border-gray-700 rounded-lg px-4 py-3">
        <FileText className="text-teal-400" size={20} />
        <h1 className="text-lg font-semibold text-white">Browse Bills</h1>
      </div>

      {/* CONTROLS */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* LEFT: Show entries + Export buttons */}
          <div className="flex flex-wrap items-center gap-2 text-sm text-gray-300">
            <span>Show</span>

            <select
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              className="bg-gray-900 border border-gray-700 rounded px-2 py-1 text-sm text-white"
            >
              <option value={10}>10</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>

            <span>entries</span>

            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-2 py-1.5 text-sm rounded border border-gray-700 bg-gray-900 text-gray-300 hover:bg-gray-700 hover:text-white transition"
            >
              <Copy size={14} /> Copy
            </button>

            <button
              onClick={downloadCSV}
              className="flex items-center gap-1.5 px-2 py-1.5 text-sm rounded border border-gray-700 bg-gray-900 text-gray-300 hover:bg-gray-700 hover:text-white transition"
            >
              <FileText size={14} /> CSV
            </button>

            <button
              onClick={downloadExcel}
              className="flex items-center gap-1.5 px-2 py-1.5 text-sm rounded border border-gray-700 bg-gray-900 text-gray-300 hover:bg-gray-700 hover:text-white transition"
            >
              <FileSpreadsheet size={14} /> Excel
            </button>

            <button
              onClick={downloadPDF}
              className="flex items-center gap-1.5 px-2 py-1.5 text-sm rounded border border-gray-700 bg-gray-900 text-gray-300 hover:bg-gray-700 hover:text-white transition"
            >
              <FileDown size={14} /> PDF
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-2 py-1.5 text-sm rounded border border-gray-700 bg-gray-900 text-gray-300 hover:bg-gray-700 hover:text-white transition"
            >
              <Printer size={14} /> Print
            </button>
          </div>

          {/* RIGHT: Search */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-300">Search:</span>
            <input
              value={search}
              onChange={(e) => {
                setPage(1); // reset page on search
                setSearch(e.target.value);
              }}
              placeholder="Search bills..."
              className="bg-gray-900 border border-gray-700 rounded px-3 py-1.5 text-sm text-white focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-900 text-gray-300">
            <tr>
              <th className="px-4 py-3 text-left">#</th>
              <th className="px-4 py-3 text-left">User</th>
              <th className="px-4 py-3 text-left">User ID</th>
              <th className="px-4 py-3 text-left">Package</th>
              <th className="px-4 py-3 text-left">Amount</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Invoice Date</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-gray-400">
                  Loading bills...
                </td>
              </tr>
            ) : invoices.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-gray-400">
                  No bills found
                </td>
              </tr>
            ) : (
              invoices.map((inv, idx) => (
                <tr key={inv.id} className="border-t border-gray-700">
                  <td className="px-4 py-3">{(page - 1) * limit + idx + 1}</td>
                  <td className="px-4 py-3">{inv.user?.name}</td>
                  <td className="px-4 py-3">{inv.user?.username}</td>
                  <td className="px-4 py-3">{inv.user?.package}</td>
                  <td className="px-4 py-3">{inv.amount}</td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        inv.status === "paid"
                          ? "text-green-400"
                          : "text-yellow-400"
                      }
                    >
                      {inv.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {new Date(inv.invoiceDate).toLocaleDateString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* FOOTER / PAGINATION */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 text-sm text-gray-400 px-4 py-3">
          <div>
            Showing <span className="text-white">{start}</span> to{" "}
            <span className="text-white">{end}</span> of{" "}
            <span className="text-white">{total}</span> entries
          </div>

          <div className="flex items-center gap-1">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className="px-3 py-1 rounded border border-gray-600 hover:bg-gray-700 disabled:opacity-50"
            >
              Previous
            </button>

            <button className="px-3 py-1 rounded bg-sky-600 text-white cursor-default">
              {page}
            </button>

            <button
              disabled={page === totalPages || totalPages === 0}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1 rounded border border-gray-600 hover:bg-gray-700 disabled:opacity-50"
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
    </div>
  );
}
