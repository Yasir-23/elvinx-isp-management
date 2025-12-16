import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import api from "../services/api";

export default function NetworkPage() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  const [interfaces, setInterfaces] = useState([]);
  const [loadingInterfaces, setLoadingInterfaces] = useState(false);

  const [addressLists, setAddressLists] = useState([]);
  const [loadingLists, setLoadingLists] = useState(false);

  // ==========================
  // Router Status
  // ==========================
  const fetchStatus = async () => {
    try {
      setLoading(true);
      const res = await api.get("/network/router-status"); 
      setStatus(res.data || null);
    } catch (err) {
      console.error("❌ Failed to load router status:", err);
    } finally {
      setLoading(false);
    }
  };

  // ==========================
  // Network Interfaces
  // ==========================
  const fetchInterfaces = async () => {
    try {
      setLoadingInterfaces(true);
      const res = await api.get("/network/interfaces");
      if (res.data.success) setInterfaces(res.data.interfaces);
    } catch (err) {
      console.error("❌ Failed to load interfaces:", err);
    } finally {
      setLoadingInterfaces(false);
    }
  };

  // ==========================
  // Address Lists
  // ==========================
  const fetchAddressLists = async () => {
    try {
      setLoadingLists(true);
      const res = await api.get("/network/address-lists");
      if (res.data.success) setAddressLists(res.data.lists);
    } catch (err) {
      console.error("❌ Failed to load address lists:", err);
    } finally {
      setLoadingLists(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    fetchInterfaces();
    fetchAddressLists();
  }, []);

  return (
    <div className="p-6 bg-background min-h-screen text-foreground">
      <h1 className="text-2xl font-bold mb-6">Network</h1>

      {/* Actions Row */}
      <div className="flex gap-3 mb-6">
        <Button
          onClick={() => {
            fetchStatus();
            fetchInterfaces();
          }}
          variant="default"
        >
          🔄 Refresh All
        </Button>
        <Button
          onClick={() => alert("Add Router flow coming soon!")}
          variant="success"
        >
          ➕ Add Router
        </Button>
      </div>

      {/* Router Status */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Router Status</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-muted-foreground">
              Loading router status...
            </div>
          ) : !status ? (
            <div className="text-destructive">
              Failed to load router status.
            </div>
          ) : (
            <div className="space-y-2">
              <div>
                <span className="font-semibold">Router IP:</span>{" "}
                {status.router?.ip || "N/A"}
              </div>
              <div>
                <span className="font-semibold">Router User:</span>{" "}
                {status.router?.user || "N/A"}
              </div>
              <div>
                <span className="font-semibold">Status:</span>{" "}
                {status.online ? (
                  <span className="text-green-500 font-bold">Online ✅</span>
                ) : (
                  <span className="text-red-500 font-bold">Offline ❌</span>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Interfaces */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Interfaces</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingInterfaces ? (
            <div className="text-muted-foreground">Loading interfaces...</div>
          ) : interfaces.length === 0 ? (
            <div className="text-red-400">Router offline. Cannot load any Interface.</div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="p-2">Name</th>
                  <th className="p-2">Type</th>
                  <th className="p-2">MAC</th>
                  <th className="p-2">Running</th>
                  <th className="p-2">Disabled</th>
                </tr>
              </thead>
              <tbody>
                {interfaces.map((iface, idx) => (
                  <tr key={idx} className="border-b hover:bg-muted/50">
                    <td className="p-2">{iface.name}</td>
                    <td className="p-2">{iface.type}</td>
                    <td className="p-2">{iface.mac || "—"}</td>
                    <td className="p-2">
                      {iface.running ? (
                        <span className="text-green-500">Yes</span>
                      ) : (
                        <span className="text-red-500">No</span>
                      )}
                    </td>
                    <td className="p-2">
                      {iface.disabled ? (
                        <span className="text-red-500">Yes</span>
                      ) : (
                        <span className="text-green-500">No</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* Subnets / Address Lists */}
      <div className="bg-gray-900 rounded-xl shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Subnets / Address Lists</h2>
        {loadingInterfaces ? ( // we can reuse or create separate loader later
          <div className="text-gray-400">Loading address lists...</div>
        ) : status?.online ? (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="p-2">List</th>
                <th className="p-2">Address</th>
                <th className="p-2">Comment</th>
                <th className="p-2">Disabled</th>
              </tr>
            </thead>
            <tbody>
              {status.lists && status.lists.length > 0 ? (
                status.lists.map((item, idx) => (
                  <tr
                    key={idx}
                    className="border-b border-gray-800 hover:bg-gray-800"
                  >
                    <td className="p-2">{item.list}</td>
                    <td className="p-2">{item.address}</td>
                    <td className="p-2">{item.comment || "—"}</td>
                    <td className="p-2">
                      {item.disabled ? (
                        <span className="text-red-400">Yes</span>
                      ) : (
                        <span className="text-green-400">No</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="p-2 text-gray-400">
                    No address lists found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        ) : (
          <div className="text-red-400">
            Router offline. Cannot load address lists.
          </div>
        )}
      </div>
    </div>
  );
}
