import React, { useState } from "react";
import api from "../services/api";
import { toast } from "react-hot-toast";

const TransferCreditsModal = ({ onClose, onSuccess, receiver }) => {
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
      const res = await api.post("/wallet/transfer", {
        receiverId: receiver.id,
        amount: numericAmount,
      });

      if (res.data.success) {
        toast.success(`Successfully transferred ${numericAmount} credits to ${receiver.name}`);
        onSuccess && onSuccess();
        onClose();
      } else {
        setError(res.data.error || "Transfer failed");
        toast.error(res.data.error || "Transfer failed");
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

  if (!receiver) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-gray-900 text-white rounded-lg w-full max-w-md p-6 max-h-[90vh] overflow-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Transfer Credits</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-200">✕</button>
        </div>

        <div className="mb-4 bg-gray-800 p-3 rounded text-sm text-gray-300">
          <span className="block text-gray-400 mb-1">Transferring to:</span>
          <span className="font-semibold text-white">{receiver.name} (@{receiver.username})</span>
        </div>

        {error && <div className="mb-3 text-sm text-red-400">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Amount</label>
            <input
              type="number"
              placeholder="Enter credit amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full p-2 text-white rounded bg-gray-800 focus:outline-none focus:ring-1 focus:ring-sky-500"
              required
              min="1"
            />
          </div>

          <div className="flex justify-end gap-2 mt-4 pt-2">
             <button type="button" onClick={onClose} className="px-4 py-2 rounded bg-gray-700 hover:bg-gray-600 transition">Cancel</button>
             <button type="submit" className="px-4 py-2 rounded bg-teal-600 hover:bg-teal-500 transition" disabled={saving}>
               {saving ? "Transferring..." : "Transfer"}
             </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TransferCreditsModal;
