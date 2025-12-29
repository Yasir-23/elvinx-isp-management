import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "react-hot-toast";
import api from "../services/api";
import {
  Activity,
  Cpu,
  HardDrive,
  Server,
  Wifi,
  Clock,
  Info,
  RefreshCw,
  Power,
} from "lucide-react";

export default function NetworkPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await api.get("/network/router-status");
      // The API returns { success: true, online: true, router: {...}, info: {...} }
      if (res.data?.success) {
        setStats(res.data);
      }
    } catch (err) {
      console.error("❌ Failed to load network stats:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleReboot = async () => {
    if (
      !confirm(
        "⚠️ WARNING: This will disconnect ALL active users immediately.\n\nAre you sure you want to reboot the router?"
      )
    ) {
      return;
    }

    try {
      const toastId = toast.loading("Sending reboot command...");
      const res = await api.post("/network/reboot");

      if (res.data?.success) {
        toast.success("Reboot command sent!", { id: toastId });
        setStats(null); // Clear stats to indicate offline
      } else {
        toast.error(
          "Failed to reboot: " + (res.data?.error || "Unknown error"),
          { id: toastId }
        );
      }
    } catch (err) {
      console.error("Reboot error:", err);
      toast.error("Error sending command");
    }
  };

  // Helper to calculate percentage for progress bars (optional visual)
  const getPercent = (free, total) => {
    if (!free || !total) return 0;
    const used = parseFloat(total) - parseFloat(free);
    return Math.round((used / parseFloat(total)) * 100);
  };

  return (
    <div className="p-6 bg-background min-h-screen text-foreground space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Activity className="text-teal-500" /> Network Dashboard
          </h1>
        </div>
        <div><Button onClick={fetchStats} disabled={loading} variant="outline">
          <RefreshCw
            className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`}
          />
          Refresh Stats
        </Button>
        <Button
          onClick={handleReboot}
          disabled={loading || !stats?.online}
          className="bg-red-600 hover:bg-red-700 text-white ml-2"
        >
          <Power className="mr-2 h-4 w-4" />
          Reboot System
        </Button></div>
        
      </div>

      {/* CONNECTION STATUS BANNER */}
      <Card className="border-l-4 border-l-teal-500 bg-gray-900/50">
        <CardContent className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div
              className={`p-3 rounded-full ${
                stats?.online
                  ? "bg-green-500/20 text-green-400"
                  : "bg-red-500/20 text-red-400"
              }`}
            >
              <Wifi size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-400">Router Connection</p>
              <h3 className="text-lg font-bold text-white">
                {stats?.online ? "Online & Connected" : "Offline / Unreachable"}
              </h3>
            </div>
          </div>
          <div className="text-right hidden sm:block">
            <p className="text-xs text-gray-500">IP Address</p>
            <p className="font-mono text-teal-400">
              {stats?.router?.ip || "—"}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* STATS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. UPTIME */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">
              System Uptime
            </CardTitle>
            <Clock className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {stats?.info?.uptime || "—"}
            </div>
            <p className="text-xs text-gray-500 mt-1">Continuous operation</p>
          </CardContent>
        </Card>

        {/* 2. CPU LOAD */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">
              CPU Load
            </CardTitle>
            <Cpu className="h-4 w-4 text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {stats?.info?.cpuLoad || 0}%
            </div>
            {/* Simple Progress Bar */}
            <div className="w-full bg-gray-700 h-2 rounded-full mt-2">
              <div
                className="bg-purple-500 h-2 rounded-full transition-all"
                style={{ width: `${stats?.info?.cpuLoad || 0}%` }}
              ></div>
            </div>
          </CardContent>
        </Card>

        {/* 3. RAM USAGE */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">
              RAM Usage
            </CardTitle>
            <Server className="h-4 w-4 text-yellow-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {stats?.info?.memory?.free}{" "}
              <span className="text-sm text-gray-500">
                / {stats?.info?.memory?.total} MB Free
              </span>
            </div>
            <div className="w-full bg-gray-700 h-2 rounded-full mt-2">
              <div
                className="bg-yellow-500 h-2 rounded-full transition-all"
                style={{
                  width: `${getPercent(
                    stats?.info?.memory?.free,
                    stats?.info?.memory?.total
                  )}%`,
                }}
              ></div>
            </div>
          </CardContent>
        </Card>

        {/* 4. ACTIVE SESSIONS */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">
              Active Sessions
            </CardTitle>
            <Activity className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {stats?.info?.activeUsers || 0}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Current PPPoE/Hotspot users
            </p>
          </CardContent>
        </Card>
      </div>

      {/* DEVICE DETAILS FOOTER */}
      <Card className="bg-gray-800/50 border-gray-700">
        <CardContent className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="block text-gray-500">Board Name</span>
            <span className="font-semibold text-white">
              {stats?.info?.board || "N/A"}
            </span>
          </div>
          <div>
            <span className="block text-gray-500">RouterOS Version</span>
            <span className="font-semibold text-white">
              {stats?.info?.version || "N/A"}
            </span>
          </div>
          <div>
            <span className="block text-gray-500">Disk Space (Free)</span>
            <span className="font-semibold text-white">
              {stats?.info?.disk?.free} MB
            </span>
          </div>
          <div>
            <span className="block text-gray-500">Admin User</span>
            <span className="font-semibold text-white">
              {stats?.router?.user || "admin"}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
