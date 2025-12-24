import React from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../services/api";

export default function AddInvoice() {
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    userId: "",
    package: "",
    amount: "",
    status: "unpaid",
    invoiceDate: "",
  });

  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();
  const [packages, setPackages] = useState([]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await api.get("/users", {
          params: { limit: 1000 },
        });

        if (res.data?.success) {
          setUsers(res.data.data || []);
        }
      } catch (err) {
        console.error(err);
        setError("Failed to load users");
      } finally {
        setLoadingUsers(false);
      }
    };

    fetchUsers();
  }, []);

  useEffect(() => {
    const fetchPackages = async () => {
      try {
        const res = await api.get("/packages", {
          params: { limit: 1000 },
        });

        if (res.data?.success) {
          setPackages(res.data.data || []);
        }
      } catch (err) {
        console.error("Failed to load packages", err);
      }
    };

    fetchPackages();
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <button
            onClick={() => navigate("/browsebills")}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-200"
          >
            <ArrowLeft size={16} />
            Back to Bills
          </button>

          <h3 className="text-lg font-semibold text-white mt-2">Add Invoice</h3>
        </div>
      </div>

      {/* FORM CONTAINER */}
      <div className="bg-gray-900 text-white rounded-lg p-6">
        {error && <div className="mb-3 text-sm text-red-400">{error}</div>}

        <form className="grid grid-cols-2 gap-3">
          {/* USER */}
          <select
            className="col-span-2 p-2 rounded bg-gray-800 text-white"
            value={form.userId}
            onChange={(e) => {
              const userId = e.target.value;
              const user = users.find((u) => String(u.id) === userId);

              const pkg = packages.find((p) => p.name === user?.package);

              setForm({
                ...form,
                userId,
                package: user?.package || "",
                amount: pkg?.regularPrice ?? "", // shown only for UI, backend calculates real amount
              });
            }}
          >
            <option value="">
              {loadingUsers ? "Loading users..." : "Select User"}
            </option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.username})
              </option>
            ))}
          </select>

          {/* PACKAGE (READ ONLY) */}
          <input
            disabled
            value={form.package}
            placeholder="Package (auto)"
            className="col-span-2 p-2 rounded bg-gray-800 text-white opacity-60 cursor-not-allowed"
          />

          {/* AMOUNT (READ ONLY) */}
          <input
            disabled
            value={form.amount !== "" ? form.amount : "Auto from package"}
            className="col-span-2 p-2 rounded bg-gray-800 text-white opacity-60 cursor-not-allowed"
          />

          {/* STATUS */}
          <select
            className="col-span-2 p-2 rounded bg-gray-800 text-white"
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
          >
            <option value="unpaid">Unpaid</option>
            <option value="paid">Paid</option>
          </select>

          {/* INVOICE DATE */}
          <input
            type="date"
            className="col-span-2 p-2 rounded bg-gray-800 text-white"
            value={form.invoiceDate}
            onChange={(e) => setForm({ ...form, invoiceDate: e.target.value })}
          />

          {/* ACTIONS */}
          <div className="col-span-2 flex justify-end gap-2 mt-3">
            <button
              type="button"
              onClick={() => navigate("/browsebills")}
              className="px-4 py-2 rounded bg-gray-700"
            >
              Cancel
            </button>
            <button
              disabled={saving}
              onClick={async () => {
                if (!form.userId || !form.invoiceDate) {
                  setError("Please select user and invoice date");
                  return;
                }

                try {
                  setSaving(true);
                  setError("");

                  const res = await api.post("/invoices", {
                    userId: Number(form.userId),
                    status: form.status,
                    invoiceDate: form.invoiceDate,
                  });

                  if (res.data.success) {
                    navigate("/browsebills");
                  }
                } catch (err) {
                  console.error(err);
                  setError("Failed to create invoice");
                } finally {
                  setSaving(false);
                }
              }}
              className="px-4 py-2 rounded bg-teal-600 disabled:opacity-60"
            >
              {saving ? "Saving..." : "Add Invoice"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
