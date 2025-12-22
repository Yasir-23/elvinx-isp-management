import React, { useState } from "react";
import api from "../services/api.js";
import { Plus, Package } from "lucide-react";

export default function AddPackagePage() {
  const [form, setForm] = useState({
    displayName: "",
    volume: "",
    regularPrice: "",
    ispCost: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    for (const key in form) {
      if (!form[key]) {
        setError("All fields are required");
        return;
      }
    }

    try {
      setLoading(true);

      await api.post("/packages", {
        displayName: form.displayName,
        volume: form.volume,
        regularPrice: Number(form.regularPrice),
        ispCost: Number(form.ispCost),
      });

      setSuccess("Package created successfully");

      setForm({
        displayName: "",
        volume: "",
        regularPrice: "",
        ispCost: "",
      });
    } catch (err) {
      console.log("Create package error:", err);
      console.log("Response:", err?.response?.data);

      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        (typeof err?.response?.data === "string" ? err.response.data : "") ||
        err?.message ||
        "Failed to create package";

      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      <div className="bg-gray-800 rounded-lg p-6">
        {/* HEADER */}
        <div className="flex items-center gap-3 mb-6">
          <Package className="text-gray-300" size={22} />
          <h2 className="text-lg font-semibold text-white">Add Package</h2>
        </div>

        {/* ALERTS */}
        {error && (
          <div className="mb-4 px-4 py-2 rounded bg-red-900/40 text-red-300 text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 px-4 py-2 rounded bg-green-900/40 text-green-300 text-sm">
            {success}
          </div>
        )}

        {/* FORM */}
        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 sm:grid-cols-2 gap-4"
        >
          <div>
            <label className="text-sm text-gray-400">Package Name</label>
            <input
              name="displayName"
              value={form.displayName}
              onChange={handleChange}
              className="mt-1 w-full rounded bg-gray-700 border border-gray-600 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="15 Mbps Home"
            />
          </div>

          <div>
            <label className="text-sm text-gray-400">Bandwidth / Volume</label>
            <input
              name="volume"
              value={form.volume}
              onChange={handleChange}
              className="mt-1 w-full rounded bg-gray-700 border border-gray-600 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="15M/15M"
            />
          </div>

          <div>
            <label className="text-sm text-gray-400">Regular Price</label>
            <input
              type="number"
              name="regularPrice"
              value={form.regularPrice}
              onChange={handleChange}
              className="mt-1 w-full rounded bg-gray-700 border border-gray-600 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="1500"
            />
          </div>

          <div>
            <label className="text-sm text-gray-400">ISP Cost</label>
            <input
              type="number"
              name="ispCost"
              value={form.ispCost}
              onChange={handleChange}
              className="mt-1 w-full rounded bg-gray-700 border border-gray-600 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="900"
            />
          </div>

          {/* SUBMIT */}
          <div className="sm:col-span-2 flex justify-end mt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-500 text-white transition disabled:opacity-50"
            >
              <Plus size={16} />
              {loading ? "Creating..." : "Create Package"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
