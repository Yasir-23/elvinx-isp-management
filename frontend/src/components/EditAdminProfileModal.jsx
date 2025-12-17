import React from "react";
import { X, Camera } from "lucide-react";

export default function EditAdminProfileModal({ onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      
      {/* Modal */}
      <div className="bg-gray-800 rounded-lg w-full max-w-lg mx-4">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-700">
          <h3 className="text-white font-semibold">
            Edit Profile
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-5">
          
          {/* Profile Photo */}
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-gray-700 flex items-center justify-center text-gray-400">
              Avatar
            </div>

            <button className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-md bg-gray-700 hover:bg-gray-600 text-white transition">
              <Camera size={16} />
              Change Photo
            </button>
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">
              Full Name
            </label>
            <input
              type="text"
              placeholder="Enter full name"
              className="w-full px-3 py-2 rounded-md bg-gray-700 text-white outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Username */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">
              Username
            </label>
            <input
              type="text"
              placeholder="Enter username"
              className="w-full px-3 py-2 rounded-md bg-gray-700 text-white outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">
              Email
            </label>
            <input
              type="email"
              placeholder="Enter email"
              className="w-full px-3 py-2 rounded-md bg-gray-700 text-white outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-5 py-3 border-t border-gray-700">
          <button onClick={onClose} className="px-4 py-1.5 text-sm rounded-md bg-gray-700 hover:bg-gray-600 text-white transition">
            Cancel
          </button>
          <button className="px-4 py-1.5 text-sm rounded-md bg-blue-600 hover:bg-blue-700 text-white transition">
            Save Changes
          </button>
        </div>

      </div>
    </div>
  );
}
