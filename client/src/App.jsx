// src/App.jsx
import React, { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { AuthProvider, useAuth } from "./auth/AuthProvider";
import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";

import DashboardPage from "./pages/DashboardPage";
import RoomsPage from "./pages/RoomsPage";
import ResidentsPage from "./pages/ResidentsPage";
import MaintenancePage from "./pages/MaintenancePage";
import BillingPage from "./pages/BillingPage";
import ReportsPage from "./pages/ReportsPage";
import UserManagementPage from "./pages/UserManagementPage";

import LoginPage from "./components/LoginPage";
import RegisterPage from "./components/RegisterPage";

const PAGES = {
  dashboard: { title: "Dashboard", component: DashboardPage },
  rooms: { title: "Room Management", component: RoomsPage },
  residents: { title: "Residents", component: ResidentsPage },
  maintenance: { title: "Maintenance", component: MaintenancePage },
  billing: { title: "Billing & Payments", component: BillingPage },
  reports: { title: "Financial Reports", component: ReportsPage },
  users: { title: "User Management", component: UserManagementPage },
};

function ProtectedLayout() {
  const { user, ready } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [activePage, setActivePage] = useState("dashboard");

  if (!ready) return <div className="p-6">Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;

  const pageConfig = PAGES[activePage] || PAGES.dashboard;
  const CurrentPage = pageConfig.component;

  return (
    <div className="flex h-screen bg-gray-50 text-slate-800 overflow-hidden">
      <Sidebar
        collapsed={collapsed}
        active={activePage}
        onToggle={() => setCollapsed((v) => !v)}
        onSelect={(k) => setActivePage(k)}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar
          title={pageConfig.title}
          onToggle={() => setCollapsed((v) => !v)}
          user={user}
          onLogout={() => {
            // call logout from hook
            window.location.reload(); // simple; or better call logout method via context
          }}
        />
        <div className="flex-1 overflow-auto">
          <CurrentPage />
        </div>
      </div>
    </div>
  );
}

export default function AppWrapper() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/*" element={<ProtectedLayout />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
