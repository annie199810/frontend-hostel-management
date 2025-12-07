import React from "react";

export default function StatusModal({ open, type, message, onClose }) {
  if (!open) return null;

  const isSuccess = type === "success";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/40" />

      <div className="relative z-10 bg-white w-full max-w-sm rounded-2xl shadow-xl p-6 text-center border">
        
        
        {isSuccess ? (
          <div className="text-green-600 text-5xl mb-3">✔</div>
        ) : (
          <div className="text-red-600 text-5xl mb-3">⚠</div>
        )}

        <h2
          className={`text-xl font-semibold mb-2 ${
            isSuccess ? "text-green-700" : "text-red-700"
          }`}
        >
          {isSuccess ? "SUCCESS" : "ERROR"}
        </h2>

        <p className="text-slate-600 mb-5 leading-relaxed">{message}</p>

        <button
          onClick={onClose}
          className={`px-5 py-2 rounded text-white font-medium ${
            isSuccess ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"
          }`}
        >
          {isSuccess ? "Continue" : "Try Again"}
        </button>
      </div>
    </div>
  );
}
