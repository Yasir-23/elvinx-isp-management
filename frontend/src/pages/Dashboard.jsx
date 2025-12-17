import { useNavigate } from "react-router-dom";
import {
  Users,
  CheckCircle,
  Wifi,
  UserX
} from "lucide-react";
import UserTable from "../components/UserTable";

import React, { useEffect, useState } from "react";
import api from "../services/api";

export default function Dashboard() {
  const navigate = useNavigate();
  const [userStats, setUserStats] = useState({
  totalUsers: null,
  activeUsers: null,
  onlineUsers: null,
  disabledUsers: null,
});

  useEffect(() => {
  const fetchUserStats = async () => {
    try {
      const res = await api.get("/dashboard/user-stats");
      setUserStats(res.data);
    } catch (err) {
      console.error("Failed to fetch user stats", err);
    }
  };

  fetchUserStats();
}, []);


  return (
    <div className="space-y-6">
      <UserTable title="Recent Users" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* LEFT: Payment & Income / Expense */}
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="text-white font-semibold mb-3">
            Payment & Income / Expense
          </div>

          {/* Chart placeholder */}
          <div className="h-64 flex items-center justify-center rounded-md border border-dashed border-gray-600 text-gray-400">
            Chart will be here
          </div>
        </div>

        {/* RIGHT: User Statistics */}
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="text-white font-semibold mb-4">User Statistics</div>

          <div className="space-y-2">
            {/* Total Users */}
            <div className="flex items-center gap-3 py-2 border-b border-gray-700 last:border-b-0">
              <div className="w-10 h-10 flex items-center justify-center rounded-md bg-gray-700/60">
                <Users size={18} />
              </div>
              <div>
                <div className="text-sm text-gray-400">Total Users</div>
                <div className="text-xl font-semibold text-white">{userStats.totalUsers ?? "--"}</div>
              </div>
            </div>

            {/* Active Users */}
            <div className="flex items-center gap-3 py-2 border-b border-gray-700 last:border-b-0">
              <div className="w-10 h-10 flex items-center justify-center rounded-md bg-gray-700/60">
                <CheckCircle size={18} />
              </div>
              <div>
                <div className="text-sm text-gray-400">Active Users</div>
                <div className="text-xl font-semibold text-white">{userStats.activeUsers ?? "--"}</div>
              </div>
            </div>

            {/* Online Users */}
            <div className="flex items-center gap-3 py-2 border-b border-gray-700 last:border-b-0">
              <div className="w-10 h-10 flex items-center justify-center rounded-md bg-gray-700/60">
                <Wifi size={18} />
              </div>
              <div>
                <div className="text-sm text-gray-400">Online Users</div>
                <div className="text-xl font-semibold text-white">{userStats.onlineUsers ?? "--"}</div>
              </div>
            </div>

            {/* Disabled Users */}
            <div className="flex items-center gap-3 py-2 border-b border-gray-700 last:border-b-0">
              <div className="w-10 h-10 flex items-center justify-center rounded-md bg-gray-700/60">
                <UserX size={18} />
              </div>
              <div>
                <div className="text-sm text-gray-400">Disabled Users</div>
                <div className="text-xl font-semibold text-white">{userStats.disabledUsers ?? "--"}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
