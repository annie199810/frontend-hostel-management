import React, { useEffect, useMemo, useState } from "react";
import Card from "../components/Card";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

function pad(n) {
  return String(n).padStart(2, "0");
}
function invoiceFallback() {
  const now = new Date();
  const y = String(now.getFullYear()).slice(-2);
  const m = pad(now.getMonth() + 1);
  const d = pad(now.getDate());
  const hh = pad(now.getHours());
  const mm = pad(now.getMinutes());
  const ss = pad(now.getSeconds());
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `INV-${y}${m}${d}-${hh}${mm}${ss}-${rand}`;
}
function addDaysISO(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}
function formatCurrency(amount) {
  if (amount == null || amount === "") return "₹0";
  return "₹" + Number(amount).toLocaleString("en-IN");
}

function StatusChip({ status }) {
  const base =
    "inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold";
  if (status === "Paid")
    return (
      <span className={base + " bg-emerald-50 text-emerald-700"}>✔ Paid</span>
    );
  if (status === "Pending")
    return (
      <span className={base + " bg-amber-50 text-amber-700"}>⏳ Pending</span>
    );
  return (
    <span className={base + " bg-rose-50 text-rose-700"}>⚠ Overdue</span>
  );
}

export default function BillingPage() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [showAdd, setShowAdd] = useState(false);
  const [showInvoice, setShowInvoice] = useState(false);
  const [showView, setShowView] = useState(false);

  const [addForm, setAddForm] = useState({
    residentName: "",
    roomNumber: "",
    amount: "",
    month: "",
    dueDate: "",
    status: "Pending",
    method: "Cash",
    notes: "",
  });

  const [invoiceData, setInvoiceData] = useState({
    invoiceNo: "",
    residentName: "",
    roomNumber: "",
    month: "",
    amount: "",
    dueDate: "",
    notes: "Thank you for your payment.",
  });

  const [viewPayment, setViewPayment] = useState(null);

  const [payNowOpen, setPayNowOpen] = useState(false);
  const [payNowTarget, setPayNowTarget] = useState(null);
  const [payNowProcessing, setPayNowProcessing] = useState(false);

  const [paymentMethod, setPaymentMethod] = useState("Card");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [cardName, setCardName] = useState("");
  const [authorize, setAuthorize] = useState(false);

 
  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError("");

      try {
        const res = await fetch(`${API_BASE}/api/billing`);
        if (!res.ok) throw new Error(`Failed to load (${res.status})`);
        const data = await res.json();

        const list = (data.payments || []).map((p) => ({
          ...p,
          invoiceNo: p.invoiceNo || invoiceFallback(),
        }));

        if (mounted) setPayments(list);
      } catch (err) {
        console.error("load billing err", err);
        if (mounted) setError("Failed to load billing records.");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => (mounted = false);
  }, []);

  
  const stats = useMemo(() => {
    let total = payments.length;
    let totalAmount = 0;
    let paid = 0;
    let pending = 0;

    payments.forEach((p) => {
      const amt = Number(p.amount || 0);
      totalAmount += amt;
      if (p.status === "Paid") paid += amt;
      if (p.status === "Pending") pending += amt;
    });

    return { total, totalAmount, paid, pending };
  }, [payments]);

  
  const filtered = useMemo(() => {
    const q = (search || "").toLowerCase();
    return payments.filter((p) => {
      const matchText =
        !q ||
        (p.residentName || "").toLowerCase().includes(q) ||
        String(p.roomNumber || "").toLowerCase().includes(q) ||
        (p.month || "").toLowerCase().includes(q);

      const matchStatus = statusFilter === "all" || p.status === statusFilter;
      return matchText && matchStatus;
    });
  }, [payments, search, statusFilter]);

  
  async function markAsPaid(id) {
    if (!id) throw new Error("Invoice id missing");
    const url = `${API_BASE}/api/billing/${id}/pay`;
    console.log("PATCH ->", url);

    const res = await fetch(url, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ method: "Manual" }),
    });

    const text = await res.text().catch(() => "");
    let data = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = null;
    }

    if (!res.ok || (data && data.ok === false)) {
      const msg =
        (data && data.error) ||
        `PATCH ${url} -> ${res.status} ${res.statusText} ${text}`;
      throw new Error(msg);
    }

    return data?.payment ?? null;
  }

 
  function openPayNow(p) {
    setPayNowTarget(p);
    setPayNowOpen(true);
    setPaymentMethod("Card");
    setCardNumber("");
    setExpiry("");
    setCvv("");
    setCardName("");
    setAuthorize(false);
  }

  async function confirmPayNow(methodOverride) {
    if (!payNowTarget) return;
    const method = methodOverride || paymentMethod || "Mock";

    if (method === "Card") {
      if (!authorize) {
        alert("Please authorize this payment (check the box).");
        return;
      }
      if (!cardNumber || !expiry || !cvv || !cardName) {
        alert("Please fill card details.");
        return;
      }
    }

    setPayNowProcessing(true);

    const payload = {
      invoiceId: payNowTarget._id,
      residentId: payNowTarget.residentId || "",
      amount: Number(payNowTarget.amount || 0),
      method,
      providerPaymentId: `mock_pay_${Date.now()}`,
      providerOrderId: `mock_order_${Date.now()}`,
      status: "Success",
      meta: { mock: true },
    };

    try {
      
      try {
        const r1 = await fetch(`${API_BASE}/api/payments`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (r1.ok) {
          try {
            const j = await r1.json();
            if (!j.ok) console.log("payments not ok", j);
          } catch {}
        }
      } catch (e) {
        console.info("POST /api/payments failed (dev fallback):", e?.message);
      }

      const updated = await markAsPaid(payNowTarget._id);

      setPayments((prev) =>
        prev.map((p) =>
          p._id === payNowTarget._id
            ? {
                ...p,
                status: "Paid",
                paidOn:
                  (updated && updated.paidOn) ||
                  new Date().toISOString().slice(0, 10),
              }
            : p
        )
      );

      alert("Payment successful (mock)");
      setPaymentMethod("Card");
      setCardNumber("");
      setExpiry("");
      setCvv("");
      setCardName("");
      setAuthorize(false);
      setPayNowOpen(false);
      setPayNowTarget(null);
    } catch (err) {
      console.error("confirmPayNow err", err);
      alert("Payment failed: " + (err.message || "Unknown error"));
    } finally {
      setPayNowProcessing(false);
    }
  }

  
  async function submitAdd(e) {
    e.preventDefault();

    if (
      !addForm.residentName ||
      !addForm.roomNumber ||
      !addForm.amount ||
      !addForm.month
    ) {
      alert("Fill required fields");
      return;
    }

    const payload = {
      residentName: addForm.residentName,
      roomNumber: addForm.roomNumber,
      amount: Number(addForm.amount),
      month: addForm.month,
      status: addForm.status || "Pending",
      method: addForm.method || "Cash",
      dueDate: addForm.dueDate || addDaysISO(30),
      paidOn: "",
      notes: addForm.notes || "",
      invoiceNo: invoiceFallback(),
    };

    try {
      const res = await fetch(`${API_BASE}/api/billing`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        console.error("submitAdd backend err:", data);
        alert("Error saving invoice");
        return;
      }

      const saved = data.payment || payload;
      saved.invoiceNo = saved.invoiceNo || invoiceFallback();

      setPayments((prev) => [saved, ...prev]);
      setShowAdd(false);
    } catch (err) {
      console.error("submitAdd err", err);
      alert("Network error");
    }
  }

 
  function openView(p) {
    setViewPayment(p);
    setShowView(true);
  }

  function sendReminder() {
    alert("Reminder sent to resident.");
  }

  function printInvoice() {
    window.print();
  }

  function formatDateForInput(iso) {
    if (!iso) return "";
    try {
      return new Date(iso).toISOString().slice(0, 10);
    } catch {
      return iso;
    }
  }

  async function handleGenerateInvoice(e) {
    e.preventDefault();

    if (
      !invoiceData.residentName ||
      !invoiceData.roomNumber ||
      !invoiceData.amount ||
      !invoiceData.month
    ) {
      alert("Fill required fields");
      return;
    }

    const payload = {
      residentName: invoiceData.residentName,
      roomNumber: invoiceData.roomNumber,
      amount: Number(invoiceData.amount),
      month: invoiceData.month,
      status: "Pending",
      method: "UPI",
      dueDate: invoiceData.dueDate || addDaysISO(30),
      paidOn: "",
      notes: invoiceData.notes || "",
      invoiceNo: invoiceData.invoiceNo || invoiceFallback(),
    };

    try {
      const res = await fetch(`${API_BASE}/api/billing`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        console.error("handleGenerateInvoice backend err:", data);
        alert("Error generating invoice");
        return;
      }

      const saved = data.payment || payload;
      saved.invoiceNo = saved.invoiceNo || invoiceFallback();

      setPayments((prev) => [saved, ...prev]);
      setShowInvoice(false);
    } catch (err) {
      console.error("handleGenerateInvoice err", err);
      alert("Network error");
    }
  }

  
  return (
    <main className="p-6 bg-gray-50 min-h-screen">
    
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-semibold">Billing & Payments</h1>
          <p className="text-sm text-gray-500">
            Track room fees &amp; invoices
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setInvoiceData({
                invoiceNo: invoiceFallback(),
                residentName: "",
                roomNumber: "",
                month: "",
                amount: "",
                dueDate: addDaysISO(30),
                notes: "Thank you for your payment.",
              });
              setShowInvoice(true);
            }}
            className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded shadow"
          >
            Generate Invoice
          </button>
          <button
            onClick={() => setShowAdd(true)}
            className="px-4 py-2 border rounded"
          >
            Add
          </button>
        </div>
      </div>

      
      <section className="grid grid-cols-1 sm:grid-cols-4 gap-4 mt-6">
        <Card>
          <div className="text-xs text-gray-500">Total Payments</div>
          <div className="text-3xl font-bold">{stats.total}</div>
        </Card>

        <Card>
          <div className="text-xs text-gray-500">Total Amount</div>
          <div className="text-2xl font-bold text-purple-600">
            {formatCurrency(stats.totalAmount)}
          </div>
        </Card>

        <Card>
          <div className="text-xs text-gray-500">Paid</div>
          <div className="text-2xl font-bold text-green-600">
            {formatCurrency(stats.paid)}
          </div>
        </Card>

        <Card>
          <div className="text-xs text-gray-500">Pending</div>
          <div className="text-2xl font-bold text-amber-600">
            {formatCurrency(stats.pending)}
          </div>
        </Card>
      </section>

      
      <Card title="Payment History" className="mt-6">
        <div className="flex gap-3 mb-4">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by resident, room or month..."
            className="flex-1 border px-3 py-2 rounded"
            aria-label="Search payments"
          />

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border px-3 py-2 rounded"
            aria-label="Filter status"
          >
            <option value="all">All Status</option>
            <option>Paid</option>
            <option>Pending</option>
            <option>Overdue</option>
          </select>
        </div>

        {loading && (
          <p className="text-center py-6 text-gray-500">Loading…</p>
        )}
        {error && <p className="text-center py-6 text-red-500">{error}</p>}

        {!loading && !error && (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-xs text-gray-500 border-b">
                  <th className="px-3 py-2">Invoice</th>
                  <th className="px-3 py-2">Resident</th>
                  <th className="px-3 py-2">Room</th>
                  <th className="px-3 py-2">Amount</th>
                  <th className="px-3 py-2">Due</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Actions</th>
                </tr>
              </thead>

              <tbody>
                {filtered.map((p) => (
                  <tr key={p._id} className="border-b">
                    <td className="px-3 py-3 max-w-[220px]">{p.invoiceNo}</td>
                    <td className="px-3 py-3">{p.residentName}</td>
                    <td className="px-3 py-3">{p.roomNumber}</td>
                    <td className="px-3 py-3">
                      {formatCurrency(p.amount)}
                    </td>
                    <td className="px-3 py-3">
                      {p.dueDate
                        ? new Date(p.dueDate).toLocaleDateString()
                        : "-"}
                    </td>
                    <td className="px-3 py-3">
                      <StatusChip status={p.status} />
                    </td>

                    <td className="px-3 py-3 flex gap-2">
                      <button
                        onClick={() => openView(p)}
                        className="px-2 py-1 text-xs bg-indigo-50 text-indigo-600 rounded"
                      >
                        View
                      </button>

                      {p.status !== "Paid" && (
                        <>
                          <button
                            onClick={() => openPayNow(p)}
                            className="px-2 py-1 text-xs bg-green-600 text-white rounded"
                          >
                            Pay Now
                          </button>
                          <button
                            onClick={async () => {
                              try {
                                const upd = await markAsPaid(p._id);
                                setPayments((prev) =>
                                  prev.map((x) =>
                                    x._id === p._id
                                      ? {
                                          ...x,
                                          status: "Paid",
                                          paidOn:
                                            (upd && upd.paidOn) ||
                                            new Date()
                                              .toISOString()
                                              .slice(0, 10),
                                        }
                                      : x
                                  )
                                );
                                alert("Marked as Paid");
                              } catch (err) {
                                alert(
                                  "Error updating payment: " +
                                    (err.message || "")
                                );
                              }
                            }}
                            className="px-2 py-1 text-xs bg-emerald-700 text-white rounded"
                          >
                            Mark Paid
                          </button>
                        </>
                      )}

                      <button
                        onClick={() => sendReminder(p._id)}
                        className="px-2 py-1 text-xs bg-amber-50 text-amber-700 rounded"
                      >
                        Remind
                      </button>
                    </td>
                  </tr>
                ))}

                {filtered.length === 0 && (
                  <tr>
                    <td
                      colSpan="7"
                      className="py-6 text-center text-gray-500"
                    >
                      No records found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      
    </main>
  );
}
