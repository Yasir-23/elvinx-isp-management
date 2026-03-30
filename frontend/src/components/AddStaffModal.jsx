import React, { useState, useEffect } from "react";
import api from "../services/api";
import { toast } from "react-hot-toast";

const AddStaffModal = ({ onClose, onStaffAdded }) => {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [userRole, setUserRole] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    username: "",
    password: "",
    email: "",
    phone: "",
    area: "",
    role: "SUB_DEALER",
  });

  useEffect(() => {
    // Attempt to parse JWT role
    try {
      const token = localStorage.getItem("token");
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUserRole(payload.role);
      }
    } catch (e) {
      console.error("Failed to parse token:", e);
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const getAvailableRoles = () => {
    if (userRole === "SUPER_ADMIN") return ["FRANCHISE", "DEALER", "SUB_DEALER"];
    if (userRole === "FRANCHISE") return ["DEALER", "SUB_DEALER"];
    if (userRole === "DEALER") return ["SUB_DEALER"];
    return [];
  };

  const availableRoles = getAvailableRoles();

  useEffect(() => {
    if (availableRoles.length > 0 && !availableRoles.includes(formData.role)) {
      setFormData(prev => ({ ...prev, role: availableRoles[0] }));
    }
  }, [availableRoles, formData.role]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const res = await api.post("/staff", formData);
      if (res.data.success) {
        toast.success("Staff member created successfully");
        onStaffAdded && onStaffAdded(res.data.staff);
        onClose();
      } else {
        setError(res.data.error || "Failed to create staff");
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || err.message || "Server error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-gray-900 text-white rounded-lg w-full max-w-2xl p-6 max-h-[90vh] overflow-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Add New Staff</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-200">✕</button>
        </div>

        {error && <div className="mb-3 text-sm text-red-400">{error}</div>}
        {userRole && availableRoles.length === 0 && (
          <div className="mb-3 text-sm text-yellow-500">
            Your role ({userRole.replace("_", " ")}) is not permitted to create new staff members.
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-3">
          <input
            name="name" placeholder="Name" value={formData.name} onChange={handleChange}
            className="col-span-2 p-2 rounded bg-gray-800" required disabled={availableRoles.length === 0}
          />
          <input
            name="username" placeholder="Username" value={formData.username} onChange={handleChange}
            className="col-span-2 p-2 rounded bg-gray-800" required disabled={availableRoles.length === 0}
          />
          <input
            name="password" placeholder="Password" type="password" value={formData.password} onChange={handleChange}
            className="col-span-2 p-2 rounded bg-gray-800" required disabled={availableRoles.length === 0}
          />
          <input
            name="email" placeholder="Email (Optional)" type="email" value={formData.email} onChange={handleChange}
            className="col-span-2 p-2 rounded bg-gray-800" disabled={availableRoles.length === 0}
          />
          <input
            name="phone" placeholder="Phone (Optional)" value={formData.phone} onChange={handleChange}
            className="col-span-2 p-2 rounded bg-gray-800" disabled={availableRoles.length === 0}
          />
          <input
            name="area" placeholder="Area (Optional)" value={formData.area} onChange={handleChange}
            className="col-span-2 p-2 rounded bg-gray-800" disabled={availableRoles.length === 0}
          />

          <select
            name="role" value={formData.role} onChange={handleChange}
            className="col-span-2 p-2 rounded bg-gray-800" required disabled={availableRoles.length === 0}
          >
            <option value="" disabled>Select Role</option>
            {availableRoles.map((role) => (
              <option key={role} value={role}>{role.replace("_", " ")}</option>
            ))}
          </select>

          <div className="col-span-2 flex justify-end gap-2 mt-3">
             <button type="button" onClick={onClose} className="px-4 py-2 rounded bg-gray-700">Cancel</button>
             <button type="submit" className="px-4 py-2 rounded bg-teal-600" disabled={saving || availableRoles.length === 0}>
               {saving ? "Saving..." : "Create Staff"}
             </button>
          </div>
        </form>
      </div>
    </div>
  );
};
export default AddStaffModal;
