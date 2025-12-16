import React from "react";
import UserTable from "../components/UserTable";

export default function AllUsersPage() {
  return (
    <div className="p-4">
      <h1 className="text-xl font-bold text-white mb-4">All Users</h1>
      <UserTable filter="all" />
    </div>
  );
}
