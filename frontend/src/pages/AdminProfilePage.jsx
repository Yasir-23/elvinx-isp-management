import React, { useState, useEffect } from "react";
import { User, Mail, Shield, Edit2, Lock } from "lucide-react";
import EditAdminProfileModal from "../components/EditAdminProfileModal";
import ChangeAdminPasswordModal from "../components/ChangeAdminPasswordModal";
import api from "../services/api.js";

export default function AdminProfilePage() {
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdminProfile = async () => {
      try {
        const res = await api.get("/admin/me");
        setAdmin(res.data.admin);
      } catch (err) {
        console.error("Failed to load admin profile", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminProfile();
  }, []);

  if (loading) {
    return <div className="text-gray-400 px-4 py-6">Loading profile...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* PROFILE OVERVIEW */}
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">
              Profile Overview
            </h2>

            <button
              onClick={() => setShowEditProfile(true)}
              className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-md bg-gray-700 hover:bg-gray-600 text-white transition"
            >
              <Edit2 size={16} />
              Edit Profile
            </button>
          </div>

          <div className="mt-6 flex flex-col sm:flex-row gap-6">
            {/* Avatar */}
            <div className="w-28 h-28 rounded-full bg-gray-700 overflow-hidden flex items-center justify-center">
              {admin?.photoUrl ? (
                <img
                  src={admin.photoUrl}
                  alt="Admin Avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-gray-400">Avatar</span>
              )}
            </div>

            {/* Profile Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1">
              <div>
                <div className="text-sm text-gray-400">Name</div>
                <div className="text-white font-medium">
                  {admin?.name || "--"}
                </div>
              </div>

              <div>
                <div className="text-sm text-gray-400">Username</div>
                <div className="text-white font-medium">
                  {admin?.username || "--"}
                </div>
              </div>

              <div>
                <div className="text-sm text-gray-400">Email</div>
                <div className="text-white font-medium">
                  {admin?.email || "--"}
                </div>
              </div>

              <div>
                <div className="text-sm text-gray-400">Role</div>
                <div className="inline-block px-2 py-0.5 rounded bg-gray-700 text-sm text-white">
                  {admin?.role || "--"}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SECURITY */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-white">Security</h2>

          <div className="mt-4 flex items-center justify-between">
            <div>
              <div className="text-white font-medium">Change Password</div>
              <div className="text-sm text-gray-400">
                Update your account password. You will be logged out after
                changing it.
              </div>
            </div>

            <button
              onClick={() => setShowChangePassword(true)}
              className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-md bg-gray-700 hover:bg-gray-600 text-white transition"
            >
              <Lock size={16} />
              Change Password
            </button>
          </div>
        </div>
      </div>
      {showEditProfile && (
        <EditAdminProfileModal
          admin={admin}
          onClose={() => setShowEditProfile(false)}
          onUpdated={(updated) => {
            setAdmin((prev) => ({ ...prev, ...updated }));
          }}
        />
      )}
      {showChangePassword && (
        <ChangeAdminPasswordModal
          onClose={() => setShowChangePassword(false)}
        />
      )}
    </div>
  );
}
