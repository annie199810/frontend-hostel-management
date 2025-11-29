import React from "react";
import { useAuth } from "../auth/AuthProvider";
import { useNavigate } from "react-router-dom";

export default function Topbar({ title, onToggle }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();           
    navigate("/login"); 
  }

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onToggle && onToggle()}
          className="h-9 w-9 flex items-center justify-center rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100"
        >
          <span className="sr-only">Toggle sidebar</span>
          ☰
        </button>

        <div className="hidden sm:block">
          <div className="text-[11px] uppercase tracking-wide text-slate-400">
            Hostel Management System
          </div>
          <div className="text-base md:text-lg font-semibold text-slate-800">
            {title}
          </div>
        </div>

        <div className="sm:hidden text-base font-semibold text-slate-800">
          {title}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button className="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100 hover:bg-blue-100">
          ⚡ Quick Action
        </button>

        <div className="flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1 bg-slate-50">
          <div className="h-8 w-8 rounded-full bg-indigo-500 text-white flex items-center justify-center text-sm font-semibold">
            {user?.name ? user.name.charAt(0).toUpperCase() : "A"}
          </div>

          <div className="hidden sm:block leading-tight">
            <div className="text-[11px] text-slate-500">{user?.role || "Staff"}</div>
            <div className="text-sm font-medium text-slate-800">{user?.name || "Admin"}</div>
          </div>

          <button
            onClick={handleLogout}
            className="ml-3 text-sm text-red-600 hover:underline"
            title="Logout"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
