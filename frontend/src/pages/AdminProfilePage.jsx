import React, { useState } from "react";
import { User, Mail, Shield, Edit2, Lock } from "lucide-react";
import EditAdminProfileModal from "../components/EditAdminProfileModal";
import ChangeAdminPasswordModal from "../components/ChangeAdminPasswordModal";

export default function AdminProfilePage() {
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);

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
            <div className="flex-shrink-0">
              <div className="w-28 h-28 rounded-full bg-gray-700 flex items-center justify-center text-gray-400">
                Avatar
              </div>
            </div>

            {/* Profile Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1">
              <div>
                <div className="text-sm text-gray-400">Name</div>
                <div className="text-white font-medium">--</div>
              </div>

              <div>
                <div className="text-sm text-gray-400">Username</div>
                <div className="text-white font-medium">--</div>
              </div>

              <div>
                <div className="text-sm text-gray-400">Email</div>
                <div className="text-white font-medium">--</div>
              </div>

              <div>
                <div className="text-sm text-gray-400">Role</div>
                <div className="inline-block px-2 py-0.5 rounded bg-gray-700 text-sm text-white">
                  Admin
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
        <EditAdminProfileModal onClose={() => setShowEditProfile(false)} />
      )}

      {showChangePassword && (
        <ChangeAdminPasswordModal
          onClose={() => setShowChangePassword(false)}
        />
      )}
    </div>
  );
}
