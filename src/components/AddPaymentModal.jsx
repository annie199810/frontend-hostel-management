import React, { useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

export default function AddPaymentModal({ resident, onClose, onSaved }) {
  const [amount, setAmount] = useState("");
  const [roomNo, setRoomNo] = useState(resident?.roomNo || resident?.roomNumber || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!resident) return null;

  async function handleGenerateInvoice(e) {
    e.preventDefault();
    setError("");

    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      setError("Please enter a valid amount.");
      return;
    }

    if (!roomNo) {
      setError("Room number is required.");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(API_BASE + "/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          residentId: resident._id,
          residentName: resident.name,
          roomNo: roomNo,
          amount: Number(amount),
          dueDate: null,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Failed to create invoice.");
      }

      if (onSaved) onSaved(data.invoice);
      onClose && onClose();
    } catch (err) {
      console.error("AddPaymentModal error:", err);
      setError(err.message || "Unable to create invoice. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 border border-slate-100">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">
              Add Payment / Invoice
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Generate a new invoice for this resident.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-lg"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleGenerateInvoice} className="space-y-4 text-sm">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">
              Resident
            </label>
            <div className="px-3 py-2 rounded border bg-slate-50 text-slate-800">
              {resident.name || "—"}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">
                Room Number
              </label>
              <input
                type="text"
                className="border px-3 py-2 rounded w-full text-sm"
                value={roomNo}
                onChange={function (e) {
                  setRoomNo(e.target.value);
                }}
                placeholder="e.g. 203"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">
                Amount (₹)
              </label>
              <input
                type="text"
                className="border px-3 py-2 rounded w-full text-sm"
                value={amount}
                onChange={function (e) {
                  setAmount(e.target.value);
                }}
                placeholder="e.g. 4500"
              />
            </div>
          </div>

          {error && (
            <div className="text-xs text-rose-600 bg-rose-50 border border-rose-100 rounded px-3 py-2">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded text-sm text-slate-700 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`px-4 py-2 rounded text-sm text-white ${
                loading
                  ? "bg-blue-300 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {loading ? "Generating…" : "Generate Invoice"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
