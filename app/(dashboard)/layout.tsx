"use client";

import { useState } from "react";
import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: "#f1f5f9" }}>
      <style>{`
        .main-content { flex: 1; overflow-y: auto; padding: 20px 24px; }
        @media (max-width: 767px) { .main-content { padding: 12px 12px; } }
      `}</style>
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden", minWidth: 0 }}>
        <Topbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="main-content">{children}</main>
      </div>
    </div>
  );
}
