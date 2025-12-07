import React, { useEffect, useMemo, useState } from "react";
import Card from "../components/Card";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";


function pad(n) { return String(n).padStart(2, "0"); }
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
  const base = "inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold";
  if (status === "Paid") return <span className={base + " bg-emerald-50 text-emerald-700"}>✔ Paid</span>;
  if (status === "Pending") return <span className={base + " bg-amber-50 text-amber-700"}>⏳ Pending</span>;
  return <span className={base + " bg-rose-50 text-rose-700"}>⚠ Overdue</span>;
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

  
  async function markAsPaid(invoiceId) {
    if (!invoiceId) {
      throw new Error("Invoice id missing");
    }

    const url = `${API_BASE}/api/billing/${invoiceId}/pay`;
    console.log("PATCH ->", url);

    try {
      const res = await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ method: "Manual" })
      });

      const text = await res.text().catch(() => "");
      let data = null;
      try {
        data = text ? JSON.parse(text) : null;
      } catch (e) {
        data = null;
      }

      if (!res.ok || (data && data.ok === false)) {
        const errMsg = (data && data.error) || `PATCH ${url} -> ${res.status} ${res.statusText} ${text}`;
        throw new Error(errMsg);
      }

      return data?.payment ?? null;
    } catch (err) {
      console.error("markAsPaid err", err);
      throw err;
    }
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
      method: method,
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
            const json1 = await r1.json();
            if (json1 && json1.ok) {
              // ok
            }
          } catch (_) {}
        }
      } catch (err) {
        console.info("POST /api/payments failed (dev fallback):", err?.message || err);
      }

      const updated = await markAsPaid(payNowTarget._id);

     
      setPayments((prev) =>
        prev.map((p) =>
          p._id === payNowTarget._id
            ? {
                ...p,
                status: "Paid",
                paidOn: (updated && updated.paidOn) || new Date().toISOString().slice(0, 10),
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

    if (!addForm.residentName || !addForm.roomNumber || !addForm.amount || !addForm.month) {
      alert("Fill required fields");
      return;
    }

    const payload = {
      ...addForm,
      amount: Number(addForm.amount),
      dueDate: addForm.dueDate || addDaysISO(30),
    };

    try {
      const res = await fetch(`${API_BASE}/api/invoices`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        alert("Error saving invoice");
        return;
      }

      const saved = data.invoice || payload;
      saved.invoiceNo = saved.invoiceNo || invoiceFallback();
      saved._id = saved._id || Date.now();

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

  
  function sendReminder(id) {
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

  return (
    <main className="p-6 bg-gray-50 min-h-screen">
      
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-semibold">Billing & Payments</h1>
          <p className="text-sm text-gray-500">Track room fees & invoices</p>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={() => setShowInvoice(true)} className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded shadow">
            Generate Invoice
          </button>
          <button onClick={() => setShowAdd(true)} className="px-4 py-2 border rounded">
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
          <div className="text-2xl font-bold text-purple-600">{formatCurrency(stats.totalAmount)}</div>
        </Card>

        <Card>
          <div className="text-xs text-gray-500">Paid</div>
          <div className="text-2xl font-bold text-green-600">{formatCurrency(stats.paid)}</div>
        </Card>

        <Card>
          <div className="text-xs text-gray-500">Pending</div>
          <div className="text-2xl font-bold text-amber-600">{formatCurrency(stats.pending)}</div>
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

        {loading && <p className="text-center py-6 text-gray-500">Loading…</p>}
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
                    <td className="px-3 py-3">{formatCurrency(p.amount)}</td>
                    <td className="px-3 py-3">{p.dueDate ? new Date(p.dueDate).toLocaleDateString() : "-"}</td>
                    <td className="px-3 py-3"><StatusChip status={p.status} /></td>

                    <td className="px-3 py-3 flex gap-2">
                      <button onClick={() => openView(p)} className="px-2 py-1 text-xs bg-indigo-50 text-indigo-600 rounded">
                        View
                      </button>

                      {p.status !== "Paid" && (
                        <>
                          <button onClick={() => openPayNow(p)} className="px-2 py-1 text-xs bg-green-600 text-white rounded">
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
                                            new Date().toISOString().slice(0, 10),
                                        }
                                      : x
                                  )
                                );
                                alert("Marked as Paid");
                              } catch (err) {
                                alert("Error updating payment: " + (err.message || ""));
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
                    <td colSpan="7" className="py-6 text-center text-gray-500">
                      No records found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>

   
      {payNowOpen && payNowTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

          <div className="relative z-10 bg-white rounded-2xl shadow-[0_30px_60px_rgba(2,6,23,0.35)] w-full max-w-3xl mx-auto border border-slate-100 overflow-hidden">
           
            <div
              className="flex items-start justify-between p-5 border-b"
              style={{ background: "linear-gradient(90deg, #F8FAFF 0%, #F2FBFF 100%)" }}
            >
              <div>
                <h3 className="text-lg font-semibold text-slate-800">Process Payment</h3>
                <p className="text-sm text-slate-500">
                  Review payment details and complete the transaction.
                </p>
              </div>
              <button
                onClick={() => {
                  if (!payNowProcessing) {
                    setPayNowOpen(false);
                    setPayNowTarget(null);
                  }
                }}
                className="text-slate-400 hover:text-slate-600"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            
            <div
              className="p-4 border-b"
              style={{
                background:
                  "linear-gradient(90deg, rgba(232,249,255,0.6) 0%, rgba(243,249,255,0.4) 100%)",
              }}
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start text-sm">
                <div>
                  <div className="text-xs text-slate-500">Invoice</div>
                  <div className="font-semibold text-slate-800">{payNowTarget.invoiceNo}</div>
                </div>

                <div>
                  <div className="text-xs text-slate-500">Resident</div>
                  <div className="font-semibold text-slate-800">{payNowTarget.residentName}</div>
                </div>

                <div className="text-right">
                  <div className="text-xs text-slate-500">Amount</div>
                  <div className="font-semibold text-sky-900 text-lg">
                    {formatCurrency(payNowTarget.amount)}
                  </div>
                </div>
              </div>
            </div>

            
            <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              <div className="lg:col-span-2">
                <div className="mb-3 text-sm font-semibold text-slate-700">
                  Payment Method
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  
                  <label
                    className={`flex items-center gap-3 p-3 rounded-lg ${
                      paymentMethod === "Card"
                        ? "border-2 border-teal-200 bg-teal-50 shadow-sm"
                        : "border border-slate-200 bg-white"
                    } cursor-pointer transition`}
                    role="radio"
                    aria-checked={paymentMethod === "Card"}
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") setPaymentMethod("Card");
                    }}
                  >
                    <input
                      type="radio"
                      name="pm"
                      className="form-radio ml-1"
                      checked={paymentMethod === "Card"}
                      onChange={() => setPaymentMethod("Card")}
                      aria-label="Credit or Debit Card"
                    />
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-6 flex items-center justify-center">
                        <span className="text-xl">💳</span>
                      </div>
                      <div>
                        <div className="text-slate-800">Credit / Debit Card</div>
                        <div className="text-xs text-slate-500">
                          Visa, MasterCard, Rupay
                        </div>
                      </div>
                    </div>
                  </label>

              
                  <label
                    className={`flex items-center gap-3 p-3 rounded-lg ${
                      paymentMethod === "PayPal"
                        ? "border-2 border-indigo-200 bg-indigo-50 shadow-sm"
                        : "border border-slate-200 bg-white"
                    } cursor-pointer transition`}
                    role="radio"
                    aria-checked={paymentMethod === "PayPal"}
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") setPaymentMethod("PayPal");
                    }}
                  >
                    <input
                      type="radio"
                      name="pm"
                      className="form-radio ml-1"
                      checked={paymentMethod === "PayPal"}
                      onChange={() => setPaymentMethod("PayPal")}
                      aria-label="PayPal"
                    />
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-6 flex items-center justify-center">
                        <span className="text-xl">🅿️</span>
                      </div>
                      <div>
                        <div className="text-slate-800">PayPal</div>
                        <div className="text-xs text-slate-500">
                          Redirect to PayPal (simulated)
                        </div>
                      </div>
                    </div>
                  </label>

                 
                  <label
                    className={`flex items-center gap-3 p-3 rounded-lg ${
                      paymentMethod === "Cash"
                        ? "border-2 border-amber-200 bg-amber-50 shadow-sm"
                        : "border border-slate-200 bg-white"
                    } cursor-pointer transition`}
                    role="radio"
                    aria-checked={paymentMethod === "Cash"}
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") setPaymentMethod("Cash");
                    }}
                  >
                    <input
                      type="radio"
                      name="pm"
                      className="form-radio ml-1"
                      checked={paymentMethod === "Cash"}
                      onChange={() => setPaymentMethod("Cash")}
                      aria-label="Cash"
                    />
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-6 flex items-center justify-center">
                        <span className="text-xl">💵</span>
                      </div>
                      <div className="text-slate-800">Cash</div>
                    </div>
                  </label>

                 
                  <label
                    className={`flex items-center gap-3 p-3 rounded-lg ${
                      paymentMethod === "UPI"
                        ? "border-2 border-sky-300 bg-sky-50 shadow-sm"
                        : "border border-slate-200 bg-white"
                    } cursor-pointer transition`}
                    role="radio"
                    aria-checked={paymentMethod === "UPI"}
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") setPaymentMethod("UPI");
                    }}
                  >
                    <input
                      type="radio"
                      name="pm"
                      className="form-radio ml-1"
                      checked={paymentMethod === "UPI"}
                      onChange={() => setPaymentMethod("UPI")}
                      aria-label="UPI"
                    />
                    <div className="text-slate-800">UPI</div>
                  </label>
                </div>

               
                <div className="mt-4">
                  {paymentMethod === "Card" && (
                    <div className="space-y-3">
                      <input
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        placeholder="Card Number"
                        className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-100"
                      />

                      <div className="flex gap-3">
                        <input
                          value={expiry}
                          onChange={(e) => setExpiry(e.target.value)}
                          placeholder="MM/YY"
                          className="flex-1 border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-100"
                        />
                        <input
                          value={cvv}
                          onChange={(e) => setCvv(e.target.value)}
                          placeholder="CVV"
                          className="w-32 border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-100"
                        />
                      </div>

                      <input
                        value={cardName}
                        onChange={(e) => setCardName(e.target.value)}
                        placeholder="Cardholder Name"
                        className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-100"
                      />

                      <label className="flex items-start gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={authorize}
                          onChange={(e) => setAuthorize(e.target.checked)}
                          className="mt-1"
                        />
                        <div className="text-slate-600">
                          I authorize this payment and agree to the{" "}
                          <span className="underline">terms and conditions</span>.
                        </div>
                      </label>
                    </div>
                  )}

                  {paymentMethod === "UPI" && (
                    <div className="space-y-3">
                      <div className="p-3 border rounded text-sm text-slate-700 bg-white">
                        <div className="text-xs text-slate-500">UPI ID</div>
                        <div className="font-medium">your-upi-id@upi</div>
                      </div>

                      <div className="flex items-center gap-4 mt-2">
                        <div
                          className="w-36 h-36 border-2 border-dashed rounded-md bg-white flex items-center justify-center shadow-inner"
                          style={{ borderColor: "#E6F5FF" }}
                        >
                          <div
                            style={{
                              width: 80,
                              height: 80,
                              background:
                                "repeating-linear-gradient(45deg,#E6F5FF 0 6px,#FFFFFF 6px 12px)",
                            }}
                          />
                        </div>

                        <div className="text-sm text-slate-600">
                          <div className="font-medium mb-1">Scan & Pay</div>
                          <div className="text-xs">
                            Scan the QR using any UPI app (Google Pay, PhonePe, Paytm)
                          </div>
                          <div className="mt-2 font-medium text-slate-800">
                            your-upi-id@upi
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {paymentMethod === "PayPal" && (
                    <div className="p-3 border rounded text-sm text-slate-700">
                      Resident will be redirected to PayPal (simulated).
                    </div>
                  )}

                  {paymentMethod === "Cash" && (
                    <div className="p-3 border rounded text-sm text-slate-700">
                      Collect cash at the office and mark as Paid.
                    </div>
                  )}
                </div>
              </div>

              
              <aside className="order-first lg:order-last">
                <div className="border rounded-lg p-4 shadow-sm bg-white w-full">
                  <div className="text-xs text-slate-500">Invoice</div>
                  <div className="font-semibold mb-3 text-slate-800">
                    {payNowTarget.invoiceNo}
                  </div>

                  <div className="text-xs text-slate-500">Resident</div>
                  <div className="font-medium mb-3">{payNowTarget.residentName}</div>

                  <div className="text-xs text-slate-500">Amount</div>
                  <div className="text-2xl font-bold text-sky-800 mb-4">
                    {formatCurrency(payNowTarget.amount)}
                  </div>

                  <table className="w-full text-sm">
                    <tbody>
                      <tr className="text-slate-600">
                        <td className="py-2">Room</td>
                        <td className="py-2 text-right">
                          {payNowTarget.roomNumber || "-"}
                        </td>
                      </tr>
                      <tr className="border-t font-semibold">
                        <td className="py-2">Total</td>
                        <td className="py-2 text-right">
                          {formatCurrency(payNowTarget.amount)}
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  <div className="mt-4 text-xs text-slate-500">
                    Paid via selected method will update the invoice status.
                  </div>
                </div>
              </aside>
            </div>

           
            <div className="flex items-center justify-end gap-3 p-4 border-t">
              <button
                onClick={() => {
                  if (!payNowProcessing) {
                    setPayNowOpen(false);
                    setPayNowTarget(null);
                  }
                }}
                className="px-4 py-2 border rounded text-slate-700"
              >
                Cancel
              </button>

              <button
                onClick={() => {
                  if (payNowProcessing) return;
                  confirmPayNow(paymentMethod);
                }}
                className={`px-4 py-2 rounded text-white ${
                  payNowProcessing
                    ? "bg-emerald-300"
                    : "bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700"
                }`}
                aria-busy={payNowProcessing}
              >
                {payNowProcessing ? "Processing..." : "Process Payment"}
              </button>
            </div>
          </div>
        </div>
      )}

      
      {showView && viewPayment && (
        <div className="fixed inset-0 z-40 flex items-center justify-center px-4">
         
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" />

         
          <div className="relative z-10 w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
            
            <div className="flex items-start justify-between px-5 pt-4 pb-3 border-b bg-slate-50">
              <div>
                <p className="text-[11px] font-semibold tracking-wide text-slate-500 uppercase">
                  Payment Details
                </p>
                <p className="text-sm font-semibold text-slate-900">
                  {viewPayment.residentName || "Resident"}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Invoice • {viewPayment.invoiceNo || "-"}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <StatusChip status={viewPayment.status} />
                <button
                  onClick={() => setShowView(false)}
                  className="ml-1 text-slate-400 hover:text-slate-600 rounded-full p-1 hover:bg-slate-100 transition"
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>
            </div>

            
            <div className="px-5 py-4 space-y-4 text-sm">
             
              <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-slate-500">
                    Room
                  </p>
                  <p className="font-medium text-slate-800">
                    {viewPayment.roomNumber || "-"}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-[11px] uppercase tracking-wide text-slate-500">
                    Amount
                  </p>
                  <p className="font-semibold text-emerald-700 text-base">
                    {formatCurrency(viewPayment.amount)}
                  </p>
                </div>

                <div>
                  <p className="text-[11px] uppercase tracking-wide text-slate-500">
                    Month
                  </p>
                  <p className="font-medium text-slate-800">
                    {viewPayment.month || "-"}
                  </p>
                </div>

                <div>
                  <p className="text-[11px] uppercase tracking-wide text-slate-500">
                    Due Date
                  </p>
                  <p className="font-medium text-slate-800">
                    {viewPayment.dueDate
                      ? new Date(viewPayment.dueDate).toLocaleDateString()
                      : "-"}
                  </p>
                </div>

                <div>
                  <p className="text-[11px] uppercase tracking-wide text-slate-500">
                    Paid On
                  </p>
                  <p className="font-medium text-slate-800">
                    {viewPayment.paidOn || "-"}
                  </p>
                </div>

                <div>
                  <p className="text-[11px] uppercase tracking-wide text-slate-500">
                    Method
                  </p>
                  <p className="font-medium text-slate-800">
                    {viewPayment.method || "—"}
                  </p>
                </div>
              </div>

             
              <div className="border rounded-xl px-3 py-2.5 bg-slate-50">
                <p className="text-[11px] uppercase tracking-wide text-slate-500 mb-1.5">
                  Notes
                </p>
                <p className="text-sm text-slate-700 whitespace-pre-wrap">
                  {viewPayment.notes && viewPayment.notes.trim() !== ""
                    ? viewPayment.notes
                    : "No special notes for this payment."}
                </p>
              </div>
            </div>

            
            <div className="flex items-center justify-between px-5 py-3 border-t bg-slate-50/80">
              <p className="text-[11px] text-slate-500">
                Created on{" "}
                {viewPayment.createdAt
                  ? new Date(viewPayment.createdAt).toLocaleDateString()
                  : "-"}
              </p>

              <button
                onClick={() => setShowView(false)}
                className="px-4 py-1.5 text-sm rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
