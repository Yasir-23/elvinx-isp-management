import React, { useState } from "react";
import api from "../services/api";
import { toast } from "react-hot-toast";

const AdjustBalanceModal = ({ onClose, onSuccess, target }) => {
  const [action, setAction] = useState("add");
  const [amount, setAmount] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const numericAmount = Number(amount);
    if (!numericAmount || numericAmount <= 0) {
      setError("Please enter a valid amount greater than 0.");
      setSaving(false);
      return;
    }

    try {
      const res = await api.post("/wallet/adjust", {
        targetStaffId: target.id,
        action,
        amount: numericAmount,
      });

      if (res.data.success) {
        toast.success(`Successfully ${action === "add" ? "added" : "deducted"} ${numericAmount} credits for ${target.name}`);
        window.dispatchEvent(new Event("walletUpdated"));
        onSuccess && onSuccess();
        onClose();
      } else {
        setError(res.data.error || "Adjustment failed");
        toast.error(res.data.error || "Adjustment failed");
      }
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.error || err.message || "Server error";
      setError(errMsg);
      toast.error(errMsg);
    } finally {
      setSaving(false);
    }
  };

  if (!target) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-gray-900 text-white rounded-lg w-full max-w-md p-6 max-h-[90vh] overflow-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-rose-400">Super Admin: Adjust Balance</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-200">✕</button>
        </div>

        <div className="mb-4 bg-gray-800 p-3 rounded text-sm text-gray-300">
          <span className="block text-gray-400 mb-1">Adjusting balance for:</span>
          <span className="font-semibold text-white">{target.name} (@{target.username})</span>
        </div>

        {error && <div className="mb-3 text-sm text-red-400">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div>
            <label className="block text-sm text-gray-400 mb-2">Action</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="action"
                  value="add"
                  checked={action === "add"}
                  onChange={() => setAction("add")}
                  className="accent-rose-500"
                />
                <span className="text-white">Add Credits</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="action"
                  value="deduct"
                  checked={action === "deduct"}
                  onChange={() => setAction("deduct")}
                  className="accent-rose-500"
                />
                <span className="text-white">Deduct Credits</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Amount</label>
            <input
              type="number"
              placeholder="Enter credit amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full p-2 text-white rounded bg-gray-800 focus:outline-none focus:ring-1 focus:ring-rose-500"
              required
              min="1"
            />
          </div>

          <div className="flex justify-end gap-2 mt-4 pt-2">
             <button type="button" onClick={onClose} className="px-4 py-2 rounded bg-gray-700 hover:bg-gray-600 transition">Cancel</button>
             <button type="submit" className="px-4 py-2 rounded bg-rose-600 hover:bg-rose-500 transition" disabled={saving}>
               {saving ? "Processing..." : "Confirm Adjustment"}
             </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdjustBalanceModal;
