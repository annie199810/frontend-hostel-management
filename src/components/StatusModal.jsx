import React, { useEffect } from "react";

export default function StatusModal({
  open,
  type = "info",
  message = "",
  onClose,
  onConfirm,
  confirmLabel = "OK",
  cancelLabel = "Cancel",
}) {
  useEffect(() => {
    if (!open) return;
    function onKey(e) {
      if (e.key === "Escape") {
        onClose && onClose();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const isConfirm = typeof onConfirm === "function";

  const colorClass =
    type === "error" ? "text-red-600" : type === "warning" ? "text-yellow-600" : "text-green-600";

  const bgButtonClass =
    type === "error" ? "bg-red-600 hover:bg-red-700" : type === "warning" ? "bg-yellow-500 hover:bg-yellow-600" : "bg-green-600 hover:bg-green-700";

  const icon = type === "error" ? "⚠" : type === "warning" ? "⚠" : "✔";

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50"
      aria-modal="true"
      role="dialog"
      aria-labelledby="status-modal-title"
    >
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div className="relative bg-white w-full max-w-sm p-6 rounded-xl shadow-xl text-center z-10">
        <div className={`${colorClass} text-5xl mb-3`}>{icon}</div>

        <h2 id="status-modal-title" className={`text-xl font-bold mb-2 ${colorClass}`}>
          {type === "error" ? "ERROR" : type === "warning" ? "CONFIRM" : "SUCCESS"}
        </h2>

        <p className="text-gray-700 mb-5">{message}</p>

        <div className="flex justify-center gap-3">
          {isConfirm && (
            <button
              className="px-4 py-2 border rounded-lg"
              onClick={onClose}
              type="button"
            >
              {cancelLabel}
            </button>
          )}

          <button
            type="button"
            className={`px-4 py-2 rounded-lg text-white ${bgButtonClass}`}
            onClick={isConfirm ? onConfirm : onClose}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
