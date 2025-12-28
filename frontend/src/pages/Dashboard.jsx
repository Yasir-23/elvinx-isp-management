import { useNavigate } from "react-router-dom";
import { Users, CheckCircle, Wifi, UserX, CalendarX } from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
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
  const [chartData, setChartData] = useState({
    userStatus: [],
    packagePopularity: [],
  });

  useEffect(() => {
    const fetchUserStats = async () => {
      try {
        const res = await api.get("/dashboard/user-stats");
        setUserStats(res.data);
        if (res.data.charts) {
          setChartData(res.data.charts);
        }
      } catch (err) {
        console.error("Failed to fetch user stats", err);
      }
    };

    fetchUserStats();
  }, []);

  return (
    <div className="space-y-6">
      <UserTable title="Recent Users" />
      <div className="grid grid-cols-1 lg:grid-cols-[7fr_3fr] gap-6 mt-6">
        {/* LEFT: Payment & Income / Expense */}
        <div className="bg-gray-800 rounded-lg p-4">
          {/* 3. CHARTS SECTION */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart A: Network Status (Donut) */}
            <div className="bg-gray-900/40 border border-gray-800 p-6 rounded-xl">
              <h3 className="text-lg font-semibold text-white mb-6">
                Network Status
              </h3>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData.userStatus}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {chartData.userStatus.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.color}
                          stroke="rgba(0,0,0,0.1)"
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1f2937",
                        borderColor: "#374151",
                        color: "#fff",
                      }}
                      itemStyle={{ color: "#fff" }}
                    />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      iconType="circle"
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart B: Popular Packages (Bar Chart) */}
            <div className="bg-gray-900/40 border border-gray-800 p-6 rounded-xl">
              <h3 className="text-lg font-semibold text-white mb-6">
                Popular Packages
              </h3>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData.packagePopularity}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#374151"
                      opacity={0.3}
                    />
                    <XAxis
                      dataKey="name"
                      stroke="#9ca3af"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="#9ca3af"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip
                      cursor={{ fill: "#374151", opacity: 0.2 }}
                      contentStyle={{
                        backgroundColor: "#1f2937",
                        borderColor: "#374151",
                        color: "#fff",
                      }}
                    />
                    <Bar
                      dataKey="count"
                      name="Users"
                      fill="#8b5cf6"
                      radius={[4, 4, 0, 0]}
                      barSize={40}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
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
                <div className="text-xl font-semibold text-white">
                  {userStats.totalUsers ?? "--"}
                </div>
              </div>
            </div>

            {/* Active Users */}
            <div className="flex items-center gap-3 py-2 border-b border-gray-700 last:border-b-0">
              <div className="w-10 h-10 flex items-center justify-center rounded-md bg-gray-700/60">
                <CheckCircle size={18} />
              </div>
              <div>
                <div className="text-sm text-gray-400">Active Users</div>
                <div className="text-xl font-semibold text-white">
                  {userStats.activeUsers ?? "--"}
                </div>
              </div>
            </div>

            {/* Online Users */}
            <div className="flex items-center gap-3 py-2 border-b border-gray-700 last:border-b-0">
              <div className="w-10 h-10 flex items-center justify-center rounded-md bg-gray-700/60">
                <Wifi size={18} />
              </div>
              <div>
                <div className="text-sm text-gray-400">Online Users</div>
                <div className="text-xl font-semibold text-white">
                  {userStats.onlineUsers ?? "--"}
                </div>
              </div>
            </div>

            {/* Disabled Users */}
            <div className="flex items-center gap-3 py-2 border-b border-gray-700 last:border-b-0">
              <div className="w-10 h-10 flex items-center justify-center rounded-md bg-gray-700/60">
                <UserX size={18} />
              </div>
              <div>
                <div className="text-sm text-gray-400">Disabled Users</div>
                <div className="text-xl font-semibold text-white">
                  {userStats.disabledUsers ?? "--"}
                </div>
              </div>
            </div>

            {/* Expired Users (NEW) */}
            <div className="flex items-center gap-3 py-2 border-b border-gray-700 last:border-b-0">
              <div className="w-10 h-10 flex items-center justify-center rounded-md bg-gray-700/60">
                <CalendarX size={18} />
              </div>
              <div>
                <div className="text-sm text-gray-400">Expired Users</div>
                <div className="text-xl font-semibold text-white">
                  {userStats.expiredUsers ?? "--"}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
