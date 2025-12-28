import React, { useEffect, useState } from "react";
import { ArrowLeft, Search, ChevronDown } from "lucide-react"; // Added Icons
import { useNavigate } from "react-router-dom";
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
    invoiceDate: new Date().toISOString().split('T')[0],
  });

  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();
  const [packages, setPackages] = useState([]);

  // 🆕 STATE: For Custom Searchable Dropdown
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // 1️⃣ Fetch Users
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

  // 2️⃣ Fetch Packages
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

  // 🆕 LOGIC: Filter users based on search
  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 🆕 LOGIC: Handle User Selection
  const handleSelectUser = (user) => {
    const pkg = packages.find((p) => p.name === user?.package);

    setForm({
      ...form,
      userId: String(user.id),
      package: user?.package || "",
      amount: pkg?.regularPrice ?? "",
    });

    setIsDropdownOpen(false); // Close dropdown
    setSearchTerm(""); // Clear search
  };

  // Helper to find currently selected user object for display
  const selectedUserObj = users.find((u) => String(u.id) === form.userId);

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
      <div className="bg-gray-900 text-white rounded-lg p-6 border border-gray-800">
        {error && <div className="mb-3 text-sm text-red-400">{error}</div>}

        <div className="grid grid-cols-2 gap-4">
          
          {/* 🆕 CUSTOM SEARCHABLE DROPDOWN */}
          <div className="col-span-2 relative">
            <label className="block text-sm text-gray-400 mb-1">Select User</label>
            
            {/* Backdrop to close when clicking outside */}
            {isDropdownOpen && (
              <div
                className="fixed inset-0 z-10"
                onClick={() => setIsDropdownOpen(false)}
              ></div>
            )}

            {/* The Trigger Button (Looks like a Select input) */}
            <div
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-full p-2.5 rounded bg-gray-800 border border-gray-700 text-white flex justify-between items-center cursor-pointer hover:bg-gray-700/80 transition"
            >
              <span className={!selectedUserObj ? "text-gray-400" : ""}>
                {selectedUserObj
                  ? `${selectedUserObj.name} (${selectedUserObj.username})`
                  : loadingUsers
                  ? "Loading users..."
                  : "Search & Select User..."}
              </span>
              <ChevronDown size={16} className="text-gray-400" />
            </div>

            {/* The Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute top-full left-0 w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-20 overflow-hidden">
                {/* 🔍 Search Field at Top */}
                <div className="p-2 border-b border-gray-700 flex items-center gap-2 bg-gray-900/50">
                  <Search size={16} className="text-gray-500" />
                  <input
                    autoFocus
                    type="text"
                    placeholder="Type name or user ID..."
                    className="bg-transparent border-none outline-none text-white text-sm w-full placeholder-gray-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                {/* 📜 Scrollable User List */}
                <div className="max-h-60 overflow-y-auto">
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map((u) => (
                      <div
                        key={u.id}
                        onClick={() => handleSelectUser(u)}
                        className="px-3 py-2.5 hover:bg-gray-700 cursor-pointer border-b border-gray-700/50 last:border-0 transition"
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-gray-200 text-sm">
                            {u.name}
                          </span>
                          <span className="text-xs text-teal-400 bg-teal-400/10 px-1.5 py-0.5 rounded">
                            {u.package || "No Pkg"}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          ID: {u.username}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-gray-500 text-sm text-center">
                      No users match "{searchTerm}"
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          {/* END CUSTOM DROPDOWN */}

          {/* PACKAGE (READ ONLY) */}
          <div className="col-span-2">
            <label className="block text-sm text-gray-400 mb-1">Package</label>
            <input
              disabled
              value={form.package}
              placeholder="Auto-filled from user"
              className="w-full p-2.5 rounded bg-gray-800 border border-gray-700 text-white opacity-60 cursor-not-allowed"
            />
          </div>

          {/* AMOUNT (READ ONLY) */}
          <div className="col-span-2">
            <label className="block text-sm text-gray-400 mb-1">Amount</label>
            <input
              disabled
              value={form.amount !== "" ? form.amount : ""}
              placeholder="Auto-filled from package"
              className="w-full p-2.5 rounded bg-gray-800 border border-gray-700 text-white opacity-60 cursor-not-allowed"
            />
          </div>

          {/* STATUS */}
          <div className="col-span-2">
            <label className="block text-sm text-gray-400 mb-1">Status</label>
            <select
              className="w-full p-2.5 rounded bg-gray-800 border border-gray-700 text-white focus:outline-none focus:border-teal-500"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            >
              <option value="unpaid">Unpaid</option>
              <option value="paid">Paid</option>
            </select>
          </div>

          {/* INVOICE DATE */}
          <div className="col-span-2">
            <label className="block text-sm text-gray-400 mb-1">
              Invoice Date
            </label>
            <input
              type="date"
              className="w-full p-2.5 rounded bg-gray-800 border border-gray-700 text-white focus:outline-none focus:border-teal-500"
              value={form.invoiceDate}
              onChange={(e) => setForm({ ...form, invoiceDate: e.target.value })}
            />
          </div>

          {/* ACTIONS */}
          <div className="col-span-2 flex justify-end gap-3 mt-4 pt-4 border-t border-gray-800">
            <button
              type="button"
              onClick={() => navigate("/browsebills")}
              className="px-5 py-2 rounded bg-gray-800 hover:bg-gray-700 text-gray-300 transition"
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
              className="px-6 py-2 rounded bg-teal-600 hover:bg-teal-700 text-white disabled:opacity-60 transition shadow-lg"
            >
              {saving ? "Saving..." : "Add Invoice"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}