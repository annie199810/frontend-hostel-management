
import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";


export default function Sidebar({ active = "dashboard", onSelect = () => {}, collapsed = false }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

 
  const menu = [
    { key: "about", emoji: "ℹ️", label: "About" },
    { key: "dashboard", emoji: "🏠", label: "Dashboard" },
    { key: "rooms", emoji: "🛏️", label: "Room Management" },
    { key: "residents", emoji: "👥", label: "Residents" },
    { key: "maintenance", emoji: "🛠️", label: "Maintenance" },
    { key: "billing", emoji: "💰", label: "Billing" },
    { key: "reports", emoji: "📊", label: "Reports" },
    { key: "users", emoji: "🧑‍💼", label: "User Management" },
  ];

  function handleLogout() {
    if (logout) logout();
    navigate("/login");
  }

  return (
    <aside
      className={`flex flex-col h-screen bg-[#0f2230] text-white ${collapsed ? "w-20" : "w-64"} transition-all duration-200`}
      aria-label="Sidebar"
    >
      
      <div className="px-4 py-5 border-b border-[#122033] flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-indigo-500 flex items-center justify-center text-white font-semibold">
          {(user?.name?.[0] || "A").toUpperCase()}
        </div>

        {!collapsed && (
          <div>
            <div className="text-sm font-semibold leading-none">{user?.name || "Admin User"}</div>
            <div className="text-xs text-slate-300 leading-none">{user?.role || "Administrator"}</div>
          </div>
        )}
      </div>

     
      <nav className="flex-1 overflow-auto px-3 py-4">
        <ul className="flex flex-col gap-3">
          {menu.map((m) => {
            const isActive = active === m.key;
            return (
              <li key={m.key}>
                <button
                  onClick={() => {
                  
                    if (m.key === "about") {
                      navigate("/about");
                    } else {
                      
                      onSelect(m.key);
                    }
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-150 text-sm
                    ${isActive ? "bg-[#173241] shadow-md text-white" : "text-slate-200 hover:bg-[#0c2b3a]/60 hover:text-white"}`}
                  title={m.label}
                >
                  <span className="flex items-center justify-center h-8 w-8 rounded-md text-lg">
                    {m.emoji}
                  </span>

                  {!collapsed && <span className="flex-1 text-left">{m.label}</span>}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      
      <div className="p-3 border-t border-[#122033]">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 text-red-400 hover:text-red-300 text-sm px-3 py-3 rounded-md transition"
        >
          <span className="h-8 w-8 flex items-center justify-center rounded-md">⛔</span>
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
