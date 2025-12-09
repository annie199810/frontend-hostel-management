import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";

export default function Sidebar({
  active = "dashboard",
  onSelect = () => {},
  collapsed = false,
}) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const rawMenu = [
    { key: "about", emoji: "ℹ️", label: "About" },
    { key: "dashboard", emoji: "🏠", label: "Dashboard" },
    { key: "rooms", emoji: "🛏️", label: "Room Management" },
    { key: "residents", emoji: "👥", label: "Residents" },
    { key: "maintenance", emoji: "🛠️", label: "Maintenance" },
    { key: "billing", emoji: "💰", label: "Billing" },
    { key: "reports", emoji: "📊", label: "Reports" },

    
    { key: "users", emoji: "🧑‍💼", label: "User Management", adminOnly: true },
  ];

 
  const isAdmin =
    user &&
    (user.role === "Admin" ||
      user.role === "Administrator" ||
      user.role === "admin");

  
  const menu = rawMenu.filter((m) => !m.adminOnly || isAdmin);

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <aside
      className={`flex flex-col h-screen bg-[#0f2230] text-white select-none
        ${collapsed ? "w-20" : "w-64"} transition-all duration-200`}
      aria-label="Sidebar navigation"
    >
      
      <div className="px-4 py-5 border-b border-[#122033] flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-indigo-500 flex items-center justify-center text-white font-semibold shadow-sm">
          {(user?.name?.[0] || "A").toUpperCase()}
        </div>

        {!collapsed && (
          <div className="overflow-hidden">
            <div className="text-sm font-semibold leading-tight truncate">
              {user?.name || "Admin User"}
            </div>
            <div className="text-[11px] text-slate-300 leading-tight mt-0.5">
              {user?.role || "Administrator"}
            </div>
          </div>
        )}
      </div>

     
      <nav className="flex-1 overflow-y-auto px-3 py-4" role="navigation">
        <ul className="flex flex-col gap-2">
          {menu.map((m) => {
            const isActive = active === m.key;

            return (
              <li key={m.key}>
                <button
                  type="button"
                  onClick={() => {
                    if (m.key === "about") navigate("/about");
                    else onSelect(m.key);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm
                    transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-sky-400/70
                    ${
                      isActive
                        ? "bg-[#173241] shadow-md text-white"
                        : "text-slate-200 hover:bg-[#0c2b3a]/70 hover:text-white"
                    }`}
                  title={m.label}
                  aria-current={isActive ? "page" : undefined}
                >
                  <span className="flex items-center justify-center h-8 w-8 rounded-md text-lg">
                    {m.emoji}
                  </span>

                  {!collapsed && (
                    <span className="flex-1 text-left truncate">{m.label}</span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      
      <div className="p-3 border-t border-[#122033]">
        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-3 rounded-md text-sm
                     text-red-400 hover:text-red-300 hover:bg-red-500/10
                     transition focus:outline-none focus:ring-2 focus:ring-red-500/70"
          title="Logout"
        >
          <span className="h-8 w-8 flex items-center justify-center rounded-md text-lg">
            ⛔
          </span>
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}
