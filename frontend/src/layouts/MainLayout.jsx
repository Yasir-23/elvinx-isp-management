import React, { useState } from "react";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";

export default function MainLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-950 text-white">
      <Sidebar open={sidebarOpen} />

      <div className="flex-1 flex flex-col">
        <Topbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

        <main className="p-6 overflow-auto flex-1 min-h-0">
          {children}
        </main>
      </div>
    </div>
  );
}
