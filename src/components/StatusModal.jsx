import React from "react";

export default function StatusModal({
  open,
  type = "info",
  message = "",
  onClose,
  onConfirm,
  confirmLabel = "OK",
  cancelLabel = "Cancel",
}) {
  if (!open) return null;

  const isConfirm = typeof onConfirm === "function";

  const color =
    type === "error"
      ? "text-red-600"
      : type === "warning"
      ? "text-yellow-600"
      : "text-green-600";

  const icon =
    type === "error"
      ? "⚠"
      : type === "warning"
      ? "⚠"
      : "✔";

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="absolute inset-0 bg-black/40"></div>

      <div className="relative bg-white w-full max-w-sm p-6 rounded-xl shadow-xl text-center">
        <div className={`${color} text-5xl mb-3`}>{icon}</div>

        <h2 className={`text-xl font-bold mb-2 ${color}`}>
          {type === "error"
            ? "ERROR"
            : type === "warning"
            ? "CONFIRM"
            : "SUCCESS"}
        </h2>

        <p className="text-gray-600 mb-5">{message}</p>

        <div className="flex justify-center gap-3">
          {isConfirm && (
            <button
              className="px-4 py-2 border rounded-lg"
              onClick={onClose}
            >
              {cancelLabel}
            </button>
          )}

          <button
            className={`px-4 py-2 rounded-lg text-white ${
              type === "error"
                ? "bg-red-600"
                : type === "warning"
                ? "bg-yellow-600"
                : "bg-green-600"
            }`}
            onClick={isConfirm ? onConfirm : onClose}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
