import React from "react";
import { useAuth } from "../auth/Authprovider";
import { useNavigate } from "react-router-dom";

export default function Sidebar({ active, onSelect, collapsed = false }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const initial = user?.name?.[0]?.toUpperCase() || "A";

  const menu = [
    { key: "dashboard", icon: "🏠", label: "Dashboard" },
    { key: "rooms", icon: "🛏️", label: "Room Management" },
    { key: "residents", icon: "👥", label: "Residents" },
    { key: "maintenance", icon: "🛠️", label: "Maintenance" },
    { key: "billing", icon: "💰", label: "Billing" },
    { key: "reports", icon: "📊", label: "Reports" },
    { key: "users", icon: "🧑‍💼", label: "User Management" },
  ];

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <aside className={`w-64 bg-[#0d1b2a] text-white h-screen flex flex-col`}>
     
      <div className="px-4 py-3 border-b border-[#122033]">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-indigo-500 flex items-center justify-center text-sm font-semibold">
            {initial}
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold">{user?.name || "Admin User"}</div>
            <div className="text-xs text-slate-300">{user?.role || "Administrator"}</div>
          </div>
        </div>
      </div>


      <nav className="flex-1 px-2">
        <ul className="h-full flex flex-col justify-center gap-2">
          {menu.map((it) => {
            const isActive = active === it.key;
            return (
              <li key={it.key}>
                <button
                  onClick={() => onSelect(it.key)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-colors
                    ${isActive ? "bg-slate-700/60 text-white" : "text-slate-200 hover:bg-slate-800/40"}`}
                >
                  <span className="text-lg">{it.icon}</span>
                  <span>{it.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

    
      <div className="p-3 border-t border-[#122033]">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 text-red-400 hover:text-red-300 text-sm px-2 py-2 rounded-md transition"
        >
          <span className="text-lg">⎋</span>
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
