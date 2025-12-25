import React, { useState } from "react";

export default function EditInvoiceStatusModal({ invoice, onClose, onSave }) {
  const [status, setStatus] = useState("paid");
  const [paidAt, setPaidAt] = useState(new Date().toISOString().split("T")[0]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!paidAt) {
      setError("Paid date is required");
      return;
    }

    setError("");
    setSaving(true);

    try {
      const ok = await onSave({
        id: invoice.id,
        status,
        paidAt,
      });

      if (ok) {
        onClose(); // ✅ CLOSE MODAL ON SUCCESS
      } else {
        setError("Failed to update invoice");
      }
    } catch (err) {
      // ✅ CATCH ANY PARENT ERROR
      setError("Failed to update invoice");
    } finally {
      // ✅ ALWAYS RELEASE BUTTON
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-gray-900 text-white rounded-lg w-full max-w-md p-6 max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Mark Invoice as Paid</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-200"
          >
            ✕
          </button>
        </div>

        {error && <div className="mb-3 text-sm text-red-400">{error}</div>}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          {/* User */}
          <div>
            <label className="text-sm text-gray-400">User</label>
            <div className="p-2 rounded bg-gray-800">
              {invoice.user?.name} ({invoice.user?.username})
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="text-sm text-gray-400">Amount</label>
            <div className="p-2 rounded bg-gray-800">Rs {invoice.amount}</div>
          </div>

          {/* Status */}
          <div>
            <label className="text-sm text-gray-400">Status</label>
            <select
              value={status}
              disabled
              className="w-full p-2 rounded bg-gray-800"
            >
              <option value="paid">Paid</option>
            </select>
          </div>

          {/* Paid At */}
          <div>
            <label className="text-sm text-gray-400">Paid Date</label>
            <input
              type="date"
              value={paidAt}
              onChange={(e) => setPaidAt(e.target.value)}
              className="w-full p-2 rounded bg-gray-800"
              required
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 rounded bg-teal-600"
            >
              {saving ? "Saving..." : "Mark as Paid"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
