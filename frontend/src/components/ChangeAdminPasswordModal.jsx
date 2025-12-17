import React from "react";
import { X, Lock } from "lucide-react";

export default function ChangeAdminPasswordModal({ onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      
      {/* Modal */}
      <div className="bg-gray-800 rounded-lg w-full max-w-md mx-4">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-700">
          <h3 className="text-white font-semibold">
            Change Password
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">

          {/* Info */}
          <div className="text-sm text-gray-400">
            After changing your password, you will be logged out and need to log in again.
          </div>

          {/* Current Password */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">
              Current Password
            </label>
            <input
              type="password"
              placeholder="Enter current password"
              className="w-full px-3 py-2 rounded-md bg-gray-700 text-white outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* New Password */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">
              New Password
            </label>
            <input
              type="password"
              placeholder="Enter new password"
              className="w-full px-3 py-2 rounded-md bg-gray-700 text-white outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">
              Confirm New Password
            </label>
            <input
              type="password"
              placeholder="Confirm new password"
              className="w-full px-3 py-2 rounded-md bg-gray-700 text-white outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-5 py-3 border-t border-gray-700">
          <button onClick={onClose} className="px-4 py-1.5 text-sm rounded-md bg-gray-700 hover:bg-gray-600 text-white transition">
            Cancel
          </button>
          <button className="flex items-center gap-2 px-4 py-1.5 text-sm rounded-md bg-blue-600 hover:bg-blue-700 text-white transition">
            <Lock size={16} />
            Update Password
          </button>
        </div>

      </div>
    </div>
  );
}
