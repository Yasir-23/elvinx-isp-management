import React, { useState, useEffect } from "react";
import { X, Camera } from "lucide-react";
import api from "../services/api.js";

export default function EditAdminProfileModal({ admin, onClose, onUpdated }) {
  const [form, setForm] = useState({
    name: admin?.name || "",
    username: admin?.username || "",
    email: admin?.email || "",
  });

  const [uploading, setUploading] = useState(false);
  const [fileName, setFileName] = useState("");
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const [previewUrl, setPreviewUrl] = useState(admin?.photoUrl || null);
  useEffect(() => {
    setPreviewUrl(admin?.photoUrl || null);
  }, [admin]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      {/* Modal */}
      <div className="bg-gray-800 rounded-lg w-full max-w-lg mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-700">
          <h3 className="text-white font-semibold">Edit Profile</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-5">
          {/* Profile Photo */}
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-gray-700 flex items-center justify-center text-gray-400">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-gray-400">Avatar</span>
              )}
            </div>

            <input
              type="file"
              accept="image/*"
              hidden
              id="avatarUpload"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;

                setFileName(file.name);
                setPreviewUrl(URL.createObjectURL(file));

                const fd = new FormData();
                fd.append("avatar", file);

                try {
                  setUploading(true);
                  const res = await api.post("/admin/avatar", fd, {
                    headers: {
                      "Content-Type": "multipart/form-data",
                    },
                  });
                  onUpdated(res.data.admin);
                } catch (err) {
                  console.error("Avatar upload failed", err);
                } finally {
                  setUploading(false);
                }
              }}
            />

            <label
              htmlFor="avatarUpload"
              className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-md bg-gray-700 hover:bg-gray-600 text-white transition cursor-pointer"
            >
              Change Photo
            </label>
            {fileName && (
              <span className="text-xs text-gray-400">{fileName}</span>
            )}
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">
              Full Name
            </label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              type="text"
              placeholder="Enter full name"
              className="w-full px-3 py-2 rounded-md bg-gray-700 text-white outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Username */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">Username</label>
            <input
              name="username"
              value={form.username}
              onChange={handleChange}
              type="text"
              placeholder="Enter username"
              className="w-full px-3 py-2 rounded-md bg-gray-700 text-white outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">Email</label>
            <input
              name="email"
              value={form.email}
              onChange={handleChange}
              type="email"
              placeholder="Enter email"
              className="w-full px-3 py-2 rounded-md bg-gray-700 text-white outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-5 py-3 border-t border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-sm rounded-md bg-gray-700 hover:bg-gray-600 text-white transition"
          >
            Cancel
          </button>
          <button
            onClick={async () => {
              try {
                const res = await api.put("/admin/profile", form);
                onUpdated(res.data.admin);
                onClose();
              } catch (err) {
                console.error("Profile update failed", err);
              }
            }}
            className="px-4 py-1.5 text-sm rounded-md bg-blue-600 hover:bg-blue-700 text-white transition"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
