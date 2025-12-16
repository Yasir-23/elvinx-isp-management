import React from "react";
import UserTable from "../components/UserTable";

export default function OfflineUsersPage() {
  return (
    <div className="p-4">
      <h1 className="text-xl font-bold text-white mb-4">Offline Users</h1>
      <UserTable filter="offline" />
    </div>
  );
}
