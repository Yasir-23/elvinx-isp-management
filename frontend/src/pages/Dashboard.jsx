import { useNavigate } from "react-router-dom";
import { Plus, User, CreditCard, Users, Download, Upload, RefreshCw, FileText, MessageSquare } from "lucide-react";
import AddUserModal from "../components/AddUserModal";
import UserStatistics from "../components/UserStatistics";
import UserReports from "../components/UserReports";
import DbTest from "../components/dbtest";
import UserTable from "../components/UserTable";

import React, { useEffect, useState } from "react";
import api from "../services/api";

export default function Dashboard() {
  const [users, setUsers] = useState([]);
  const [activeCount, setActiveCount] = useState(0);
  const [showAddUser, setShowAddUser] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    async function load() {
      try {
        const u = await api.get("/pppoe/users");
        if (u.data.success) setUsers(u.data.data || []);
        const a = await api.get("/pppoe/active");
        if (a.data.success) setActiveCount(a.data.data.length);
      } catch (e) {
        console.error("API error:", e);
      }
    }
    load();
  }, []);

  return (
    <div className="space-y-6">
      <UserTable title="Recent Users" />
      {/* Admin action buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <button onClick={() => navigate("/profile")} className="flex items-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded text-gray-100 text-sm">
          <User size={16} /> My Profile
        </button>
        <button className="flex items-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded text-gray-100 text-sm">
          <CreditCard size={16} /> User Balance
        </button>
        <button className="flex items-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded text-gray-100 text-sm">
          <Users size={16} /> Reseller Balance
        </button>
        <button onClick={() => setShowAddUser(true)} className="flex items-center gap-2 px-3 py-2 bg-teal-600 hover:bg-teal-500 rounded text-white text-sm">
          <Plus size={16} /> Add New User
        </button>
        <button className="flex items-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded text-gray-100 text-sm">
          <Upload size={16} /> Import Users
        </button>
        <button className="flex items-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded text-gray-100 text-sm">
          <Download size={16} /> Export Users
        </button>
        <button className="flex items-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded text-gray-100 text-sm">
          <RefreshCw size={16} /> Active / Renew
        </button>
        <button className="flex items-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded text-gray-100 text-sm">
          <FileText size={16} /> Add Invoice
        </button>
        <button className="flex items-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded text-gray-100 text-sm">
          <MessageSquare size={16} /> Send SMS
        </button>
      </div>

      {/* User Statistics Section */}
      <UserStatistics totalUsers={users.length} activeUsers={activeCount} />

      {/* User Reports Section */}
      <UserReports />

      {/* Add User Modal */}
      {showAddUser && <AddUserModal onClose={() => setShowAddUser(false)} onCreated={() => window.location.reload()} />}

      {/* Recent Users Table */}
      <div className="bg-gray-800 rounded shadow">
        <div className="bg-gradient-to-r from-teal-400 to-blue-500 px-4 py-2 rounded-t text-white font-semibold">Recent Users</div>
        <div className="p-4 overflow-auto">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm text-gray-300">Showing recent users</div>
            <input placeholder="Search..." className="px-2 py-1 rounded bg-gray-900 text-sm" />
          </div>

          <table className="w-full text-sm">
            <thead className="text-gray-300">
              <tr>
                <th className="p-2 text-left">#</th>
                <th className="p-2 text-left">Name</th>
                <th className="p-2 text-left">Phone</th>
                <th className="p-2 text-left">Package</th>
                <th className="p-2 text-left">ID</th>
                <th className="p-2 text-left">Password</th>
                <th className="p-2 text-left">Location</th>
                <th className="p-2 text-left">Status</th>
                <th className="p-2 text-left">Action</th>
              </tr>
            </thead>
            <tbody>
              {users.slice(0, 10).map((u, idx) => (
                <tr key={u['.id'] || u.name} className="border-t border-gray-800">
                  <td className="p-2">{idx + 1}</td>
                  <td className="p-2">{u.name}</td>
                  <td className="p-2">{u["phone"] || u.comment || "-"}</td>
                  <td className="p-2"><span className="text-xs bg-blue-600 px-2 py-1 rounded">{u.profile || "default"}</span></td>
                  <td className="p-2">{u.user || u.name || "-"}</td>
                  <td className="p-2">{u.password || "-"}</td>
                  <td className="p-2">{u.comment || "-"}</td>
                  <td className="p-2">
                    {String(u.disabled) === "yes" || u.disabled === true
                      ? <span className="text-xs bg-red-600 px-2 py-1 rounded">Disabled</span>
                      : <span className="text-xs bg-green-600 px-2 py-1 rounded">Active</span>}
                  </td>
                  <td className="p-2 space-x-2">
                    <button className="px-2 py-1 bg-green-600 rounded text-xs">Edit</button>
                    <button className="px-2 py-1 bg-yellow-600 rounded text-xs">Disable</button>
                    <button className="px-2 py-1 bg-red-600 rounded text-xs">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {users.length === 0 && <div className="text-sm text-gray-400 mt-4">No users found.</div>}
        </div>
      </div>
      {/* DB Test Section */}
      <DbTest />
    </div>
  );
}
