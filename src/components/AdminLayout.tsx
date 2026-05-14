import { useState } from "react";
import { Outlet } from "react-router-dom";
import AdminSidebar from "./AdminSidebar";
import AdminTopbar from "./AdminTopbar";
import "../styles/AdminLayout.css";

export default function AdminLayout() {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="admin-layout">
      <AdminSidebar
        open={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
      />

      {mobileSidebarOpen && (
        <div
          className="admin-mobile-overlay"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      <main className="admin-main">
        <AdminTopbar onMenuClick={() => setMobileSidebarOpen(true)} />

        <div className="admin-page">
          <Outlet />
        </div>
      </main>
    </div>
  );
}