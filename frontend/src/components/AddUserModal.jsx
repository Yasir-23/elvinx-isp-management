import React, { useState, useEffect } from "react";
import axios from "axios";
import api from "../services/api";

const AddUserModal = ({ onClose, onUserAdded }) => {
  const [profiles, setProfiles] = useState([]);
  const [loadingProfiles, setLoadingProfiles] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    username: "",
    password: "",
    package: "",
    connectionType: "pppoe",
    salesperson: "admin",
    nas: "",
    nationalId: "",
    mobile: "",
    email: "",
    address: "",
    city: "",
    latitude: "",
    longitude: ""
  });

  // ==========================
  // Fetch PPPoE profiles
  // ==========================
  useEffect(() => {
    api.get("/pppoe/profiles")   // ✅ baseURL + token included
      .then(res => {
        if (res.data.success) {
          setProfiles(res.data.data || []);
        } else {
          setProfiles([]);
        }
      })
      .catch(err => {
        console.error("Error fetching profiles:", err);
        setProfiles([]);
      })
      .finally(() => setLoadingProfiles(false));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // ==========================
  // Submit new user
  // ==========================
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const payload = {
      name: formData.name,
      username: formData.username,
      password: formData.password,
      package: formData.package,
      connection: formData.connectionType,
      salesperson: formData.salesperson,
      nas: formData.nas,
      nationalId: formData.nationalId,
      mobile: formData.mobile,
      email: formData.email,
      address: formData.address,
      city: formData.city,
      latitude: formData.latitude,
      longitude: formData.longitude
    };

    try {
      const res = await api.post("/users", payload);   // ✅ token included automatically
      if (res.data.success) {
        onUserAdded && onUserAdded(res.data.user);
        onClose();
      } else {
        setError(res.data.message || "Failed to create user");
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
          <h3 className="text-lg font-semibold">Add New User</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-200">✕</button>
        </div>

        {error && <div className="mb-3 text-sm text-red-400">{error}</div>}

        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-3">
          <input name="name" placeholder="Name" value={formData.name} onChange={handleChange}
                 className="col-span-2 p-2 rounded bg-gray-800" required />

          <input name="username" placeholder="Username" value={formData.username} onChange={handleChange}
                 className="p-2 rounded bg-gray-800" required />

          <input name="password" placeholder="Password" value={formData.password} onChange={handleChange}
                 className="p-2 rounded bg-gray-800" required />

          <select name="package" value={formData.package} onChange={handleChange}
                  className="col-span-2 p-2 rounded bg-gray-800" required>
            <option value="">{loadingProfiles ? "Loading packages..." : "Select Package"}</option>
            {profiles.map((p, i) => <option key={i} value={p.name}>{p.name}</option>)}
          </select>

          <select name="connectionType" value={formData.connectionType} onChange={handleChange} className="p-2 rounded bg-gray-800">
            <option value="pppoe">Radius PPPoE</option>
            <option value="hotspot">Hotspot</option>
          </select>

          <select name="salesperson" value={formData.salesperson} onChange={handleChange} className="p-2 rounded bg-gray-800">
            <option value="admin">Admin</option>
          </select>

          <select name="nas" value={formData.nas} onChange={handleChange} className="col-span-2 p-2 rounded bg-gray-800">
            <option value="">Select NAS</option>
            <option value="nas1">NAS 1</option>
            <option value="nas2">NAS 2</option>
          </select>

          <input name="nationalId" placeholder="National ID" value={formData.nationalId} onChange={handleChange} className="col-span-2 p-2 rounded bg-gray-800" />
          <input name="mobile" placeholder="Mobile Number" value={formData.mobile} onChange={handleChange} className="p-2 rounded bg-gray-800" />
          <input name="email" placeholder="Email" value={formData.email} onChange={handleChange} className="p-2 rounded bg-gray-800" />
          <input name="address" placeholder="Address" value={formData.address} onChange={handleChange} className="col-span-2 p-2 rounded bg-gray-800" />
          <select name="city" value={formData.city} onChange={handleChange} className="p-2 rounded bg-gray-800">
            <option value="">Select City/District</option>
            <option value="karachi">Karachi</option>
            <option value="lahore">Lahore</option>
            <option value="islamabad">Islamabad</option>
          </select>

          <input name="latitude" placeholder="Latitude" value={formData.latitude} onChange={handleChange} className="p-2 rounded bg-gray-800" />
          <input name="longitude" placeholder="Longitude" value={formData.longitude} onChange={handleChange} className="p-2 rounded bg-gray-800" />

          <div className="col-span-2 flex justify-end gap-2 mt-3">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded bg-gray-700">Cancel</button>
            <button type="submit" className="px-4 py-2 rounded bg-teal-600" disabled={saving}>
              {saving ? "Saving..." : "Create User"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddUserModal;
