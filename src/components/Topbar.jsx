import React, { useState, useRef, useEffect } from "react";

export default function Topbar({
  title = "",
  onToggle,
  user,
  onLogout,
  onQuickAction,
}) {
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef(null);

  useEffect(function () {
    function onDocClick(e) {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  const userInitial =
    (user && user.name && user.name.charAt(0).toUpperCase()) || "A";
  const userRole = (user && user.role) || "Administrator";

  return (
    <header
      className="
        sticky top-0 z-30
        bg-white/90 backdrop-blur
        border-b border-slate-200
        flex items-center justify-between
        px-4 sm:px-6
        h-16 sm:h-20
        shadow-sm
        select-none
      "
    >
     
      <div className="flex items-center gap-3 sm:gap-4">
        <button
          type="button"
          onClick={function () {
            if (onToggle) onToggle();
          }}
          className="
            h-10 w-10 sm:h-12 sm:w-12
            flex items-center justify-center
            rounded-xl
            bg-slate-100 hover:bg-slate-200
            text-lg sm:text-xl font-bold
            transition
          "
          aria-label="Toggle sidebar"
        >
          ☰
        </button>

        <div className="flex flex-col">
          <h1 className="responsive-title font-bold text-slate-800">
            {title}
          </h1>
          <span className="text-[11px] sm:text-xs text-slate-500 hide-mobile">
            Hostel Management Console
          </span>
        </div>
      </div>

     
      <div className="flex items-center gap-3 sm:gap-5">
     
        <button
          type="button"
          onClick={function () {
            if (onQuickAction) onQuickAction();
          }}
          className="
            show-mobile
            h-10 w-10
            rounded-xl
            bg-blue-600 hover:bg-blue-700
            text-white text-lg
            flex items-center justify-center
            shadow-md
            transition
          "
          aria-label="Quick action"
        >
          ⚡
        </button>

        <button
          type="button"
          onClick={function () {
            if (onQuickAction) onQuickAction();
          }}
          className="
            hide-mobile
            flex items-center gap-2
            px-4 py-2.5
            rounded-xl
            bg-blue-600 hover:bg-blue-700
            text-white font-semibold text-xs sm:text-sm
            shadow-md
            transition
          "
        >
          ⚡ Quick Action
        </button>

        
        <div ref={notifRef} className="relative">
          <button
            type="button"
            onClick={function () {
              setNotifOpen(function (v) {
                return !v;
              });
            }}
            className="
              relative
              h-10 w-10 sm:h-12 sm:w-12
              flex items-center justify-center
              rounded-xl
              bg-blue-50 hover:bg-blue-100
              text-lg sm:text-xl
              transition
              shadow-sm
            "
            aria-label="Notifications"
          >
            🔔
            <span className="absolute top-2 right-2 h-2.5 w-2.5 rounded-full bg-red-500" />
          </button>

          {notifOpen && (
            <div className="absolute right-0 mt-3 w-72 bg-white border rounded-xl shadow-lg z-50 anim-slide-up">
              <div className="p-3 border-b text-sm font-semibold">
                Notifications
              </div>
              <div className="p-4 text-sm text-slate-600">
                No new notifications
              </div>
            </div>
          )}
        </div>

          <div className="show-mobile responsive-avatar">
            {userInitial}
          </div>

         
        </div>
     
    </header>
  );
}
