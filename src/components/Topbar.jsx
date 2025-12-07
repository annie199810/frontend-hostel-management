import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function Topbar({ title = "", onToggle, user, onLogout, onQuickAction }) {
  const navigate = useNavigate();
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef();

  useEffect(() => {
    function onDocClick(e) {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  return (
    <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-6 shadow-sm select-none">
      
   
      <div className="flex items-center gap-4">
        <button
          onClick={() => onToggle && onToggle()}
          className="h-12 w-12 flex items-center justify-center rounded-xl 
                     bg-slate-100 hover:bg-slate-200 text-xl font-bold transition"
        >
          ☰
        </button>

        <div className="text-2xl font-bold text-slate-800 tracking-wide">
          {title}
        </div>
      </div>

    
      <div className="flex items-center gap-5">

       
        <div ref={notifRef} className="relative">
          <button
            onClick={() => setNotifOpen((v) => !v)}
            className="relative h-12 w-12 flex items-center justify-center rounded-xl 
                       bg-blue-50 hover:bg-blue-100 text-xl transition shadow-sm"
          >
            🔔
            <span className="absolute top-2 right-2 h-2.5 w-2.5 rounded-full bg-red-500"></span>
          </button>

          {notifOpen && (
            <div className="absolute right-0 mt-3 w-72 bg-white border rounded-xl shadow-lg z-50">
              <div className="p-3 border-b text-sm font-semibold">Notifications</div>
              <div className="p-4 text-sm text-slate-600">No new notifications</div>
            </div>
          )}
        </div>

      
        <button
          onClick={() => (onQuickAction ? onQuickAction() : null)}
          className="flex items-center gap-2 px-5 py-3 rounded-xl 
                     bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md transition"
        >
          ⚡ Quick Action
        </button>

        
      </div>
    </header>
  );
}
