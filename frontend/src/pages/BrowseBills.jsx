import React, { useEffect, useState } from "react";
import api from "../services/api";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import EditInvoiceStatusModal from "../components/EditInvoiceStatusModal";
import { toast } from "react-hot-toast";
import {
  Copy,
  FileText,
  FileSpreadsheet,
  FileDown,
  Printer,
  Pencil,
  Trash2, 
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
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

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
      console.log("DB Response:", res.data); // Check this in Console to see new field names

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

  const handleUpdateInvoiceStatus = async ({ id, status, paidAt }) => {
    try {
      const res = await api.put(`/invoices/${id}/status`, {
        status,
        paidAt,
      });

      if (!res.data?.success) {
        toast.error("Failed to update invoice");
        return false;
      }

      // 🔁 update invoice in table (NO refetch)
      setInvoices((prev) =>
        prev.map((inv) =>
          inv.id === id ? { ...inv, status: "paid", paidAt } : inv
        )
      );

      toast.success("Invoice marked as paid");
      setShowEditModal(false);
      setSelectedInvoice(null);

      return true; // ✅ VERY IMPORTANT
    } catch (err) {
      console.error("Failed to update invoice:", err);
      toast.error(err.response?.data?.error || "Failed to update invoice");
      return false; // ✅ VERY IMPORTANT
    }
  };

  // ----------------------------
  // PAGINATION CALC
  // ----------------------------
  const start = total === 0 ? 0 : (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);
  const totalPages = Math.ceil(total / limit);

  // ----------------------------
  // DELETE INVOICE
  // ----------------------------
  const handleDeleteInvoice = async (invoice) => {
    if (!confirm(`Are you sure you want to delete the invoice for "${invoice.user?.name}"?`)) {
      return;
    }

    try {
      const res = await api.delete(`/invoices/${invoice.id}`);
      if (res.data?.success) {
        toast.success("Invoice deleted successfully");
        // Remove from local list immediately
        setInvoices((prev) => prev.filter((inv) => inv.id !== invoice.id));
        fetchInvoices();
      } else {
        toast.error("Failed to delete invoice");
      }
    } catch (err) {
      console.error("Delete invoice error:", err);
      toast.error(err.response?.data?.error || "Failed to delete invoice");
    }
  };

  // ----------------------------
  // GENERATE PDF RECEIPT (Tailwind Styled)
  // ----------------------------
  const generateReceipt = (invoice) => {
    const doc = new jsPDF();

    // --- Tailwind Colors (RGB) ---
    const colors = {
      gray900: [17, 24, 39],   // #111827 (Headers)
      gray700: [55, 65, 81],   // #374151 (Subtext)
      gray200: [229, 231, 235],// #e5e7eb (Table BG)
      gray100: [243, 244, 246],// #f3f4f6 (Light BG)
      teal600: [13, 148, 136], // #0d9488 (Branding)
      green600: [22, 163, 74], // #16a34a (Paid)
      red600: [220, 38, 38],   // #dc2626 (Unpaid)
      white: [255, 255, 255],
    };

    // 1. HEADER BANNER
    doc.setFillColor(...colors.gray900); 
    doc.rect(0, 0, 210, 40, "F"); 

    // Header Text
    doc.setTextColor(...colors.white);
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text("INVOICE / RECEIPT", 105, 20, null, "center");

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...colors.teal600); // Accent color text
    doc.text("ElvinX ISP Management System", 105, 30, null, "center");

    // 2. BILL TO SECTION
    const labelX = 15;
    const valueX = 42; // Aligns all values nicely

    doc.setTextColor(...colors.gray900);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("BILL TO:", 15, 60);

    doc.setFontSize(10);

    // -- Row 1: Customer --
    doc.setFont("helvetica", "bold");
    doc.text("Customer:", labelX, 70);
    
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...colors.gray700);
    doc.text(invoice.user?.name || "N/A", valueX, 70);

    // -- Row 2: User ID --
    doc.setTextColor(...colors.gray900); // Reset to dark for label
    doc.setFont("helvetica", "bold");
    doc.text("User ID:", labelX, 76);

    doc.setTextColor(...colors.gray700); // Reset to gray for value
    doc.setFont("helvetica", "normal");
    doc.text(invoice.user?.username || "N/A", valueX, 76);

    // -- Row 3: Mobile --
    doc.setTextColor(...colors.gray900);
    doc.setFont("helvetica", "bold");
    doc.text("Mobile:", labelX, 82);

    doc.setTextColor(...colors.gray700);
    doc.setFont("helvetica", "normal");
    doc.text(invoice.user?.mobile || "N/A", valueX, 82);

    // -- Row 4: Address --
    doc.setTextColor(...colors.gray900);
    doc.setFont("helvetica", "bold");
    doc.text("Address:", labelX, 88);

    doc.setTextColor(...colors.gray700);
    doc.setFont("helvetica", "normal");
    // Split address to fit within column (width ~70)
    const splitAddress = doc.splitTextToSize(invoice.user?.address || "N/A", 70);
    doc.text(splitAddress, valueX, 88);

   // 3. INVOICE DETAILS (Right Side)
    const labelRightX = 120;
    const valueRightX = 142; 

    doc.setTextColor(...colors.gray900);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("INVOICE DETAILS:", labelRightX, 60);

    doc.setFontSize(10);

    // -- Row 1: Invoice # --
    doc.setTextColor(...colors.gray900);
    doc.setFont("helvetica", "bold");
    doc.text("Invoice #:", labelRightX, 70);

    doc.setTextColor(...colors.gray700);
    doc.setFont("helvetica", "normal");
    doc.text(String(invoice.id), valueRightX, 70);

    // -- Row 2: Date --
    doc.setTextColor(...colors.gray900);
    doc.setFont("helvetica", "bold");
    doc.text("Date:", labelRightX, 76);

    doc.setTextColor(...colors.gray700);
    doc.setFont("helvetica", "normal");
    doc.text(new Date(invoice.invoiceDate).toLocaleDateString(), valueRightX, 76);

    // -- Row 3: Status --
    const isPaid = invoice.status === "paid";
    
    doc.setTextColor(...colors.gray900);
    doc.setFont("helvetica", "bold");
    doc.text("Status:", labelRightX, 82);

    // Status Value (Bold + Color)
    doc.setFont("helvetica", "bold");
    if (isPaid) {
      doc.setTextColor(...colors.green600); 
      doc.text("PAID", valueRightX, 82);
    } else {
      doc.setTextColor(...colors.red600); 
      doc.text("UNPAID", valueRightX, 82);
    }

    // -- Row 4: Paid On (Restored & Styled) --
    if (isPaid && invoice.paidAt) {
      doc.setTextColor(...colors.gray900);
      doc.setFont("helvetica", "bold");
      doc.text("Paid On:", labelRightX, 88);

      doc.setTextColor(...colors.gray700);
      doc.setFont("helvetica", "normal");
      doc.text(new Date(invoice.paidAt).toLocaleDateString(), valueRightX, 88);
    }

    // 4. LINE ITEMS TABLE
    const startY = 110;
    
    // Table Header Background
    doc.setFillColor(...colors.gray200);
    doc.rect(15, startY, 180, 10, "F");
    
    // Table Header Text
    doc.setTextColor(...colors.gray900);
    doc.setFont("helvetica", "bold");
    doc.text("Description (Package)", 20, startY + 7);
    doc.text("Amount (PKR)", 160, startY + 7);

    // Table Content
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...colors.gray700);
    doc.text(invoice.user?.package || "Internet Service", 20, startY + 20);
    doc.text(String(invoice.amount), 165, startY + 20);

    // Divider Line
    doc.setDrawColor(...colors.gray200);
    doc.line(15, startY + 25, 195, startY + 25); 

    // 5. TOTAL
    doc.setTextColor(...colors.gray900);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text(`Total:  ${invoice.amount}`, 150, startY + 40);

    // 6. FOOTER
    doc.setFontSize(10);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(...colors.gray700);
    doc.text("Thank you for your business!", 105, 280, null, "center");

    // Save
    doc.save(`Receipt_${invoice.user?.username || "user"}_${invoice.id}.pdf`);
  };

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
              <th className="px-4 py-3 text-left screen-only">Action</th>
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
                  <td className="px-4 py-3">{inv.user?.username || "N/A"}</td>
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
                  <td className="px-4 py-2 screen-only">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setSelectedInvoice(inv);
                          setShowEditModal(true);
                        }}
                        className="p-2 rounded bg-teal-600/20 hover:bg-gray-700 text-blue-400"
                        disabled={inv.status === "paid"}
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                      onClick={() => handleDeleteInvoice(inv)}
                      className="p-2 rounded bg-red-600/20 hover:bg-red-600/30 text-red-400"
                    >
                      <Trash2 size={16} />
                    </button>
                      <button
                        onClick={() => generateReceipt(inv)}
                        className="p-2 rounded bg-teal-600/20 hover:bg-teal-600/30 text-teal-400"
                        title="Download Receipt"
                      >
                        <FileDown size={16} />
                      </button>
                    
                    </div>
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
      {showEditModal && selectedInvoice && (
        <EditInvoiceStatusModal
          invoice={selectedInvoice}
          onClose={() => {
            setShowEditModal(false);
            setSelectedInvoice(null);
          }}
          onSave={handleUpdateInvoiceStatus}
        />
      )}
    </div>
  );
}
