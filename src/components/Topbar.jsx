import React, { useState } from "react";
import { useAuth } from "../auth/authprovider";
import { useNavigate } from "react-router-dom";

export default function Topbar({ title, onToggle }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true); 
    await new Promise((res) => setTimeout(res, 400)); 
    logout(); 
    navigate("/login"); 
  }

  const initial = user?.name?.[0]?.toUpperCase() || "A";

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-6 shadow-sm">    
      <div className="flex items-center gap-3">
       
        <button
          type="button"
          onClick={() => onToggle && onToggle()}
          className="h-9 w-9 flex items-center justify-center rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100"
        >
          ☰
        </button>

        
        <div className="hidden sm:block">
          <div className="text-[10px] uppercase tracking-wide text-slate-400">
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

        
      </div>
    </header>
  );
}
