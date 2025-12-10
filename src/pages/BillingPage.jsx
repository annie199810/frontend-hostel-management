import React, { useEffect, useMemo, useState } from "react";
import Card from "../components/Card";
import StatusModal from "../components/StatusModal";

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
  return "INV-" + y + m + d + "-" + hh + mm + ss + "-" + rand;
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

function formatDateForInput(iso) {
  if (!iso) return "";
  try {
    return new Date(iso).toISOString().slice(0, 10);
  } catch (e) {
    return iso;
  }
}

function getAuthToken() {
  try {
    return (
      localStorage.getItem("authToken") ||
      localStorage.getItem("token") ||
      ""
    );
  } catch (e) {
    return "";
  }
}

function withAuth(headers) {
  const t = getAuthToken();
  if (!t) return headers || {};
  return Object.assign({}, headers || {}, {
    Authorization: "Bearer " + t,
  });
}


function StatusChip(props) {
  const status = props.status;
  const base =
    "inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold";

  if (status === "Paid") {
    return (
      <span className={base + " bg-emerald-50 text-emerald-700"}>
        ✔ Paid
      </span>
    );
  }
  if (status === "Pending") {
    return (
      <span className={base + " bg-amber-50 text-amber-700"}>
        ⏳ Pending
      </span>
    );
  }
  return (
    <span className={base + " bg-rose-50 text-rose-700"}>
      ⚠ Overdue
    </span>
  );
}


function ConfirmDeleteModal({ open, item, loading, onCancel, onConfirm }) {
  if (!open || !item) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" />
      <div className="relative z-10 bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-md p-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="text-3xl text-amber-500">⚠</div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Delete payment?
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Room {item.roomNumber} • {item.residentName}
            </p>
          </div>
        </div>

        <p className="text-sm text-slate-700 mb-4">
          Are you sure you want to delete this payment record for room{" "}
          <span className="font-semibold">{item.roomNumber}</span>?{" "}
          <br />
          
        </p>

        <div className="flex justify-end gap-2 mt-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 text-sm border rounded-lg text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="px-4 py-2 text-sm rounded-lg bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-60"
          >
            {loading ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </div>
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
  const [showEdit, setShowEdit] = useState(false);

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

  const [editForm, setEditForm] = useState({
    _id: "",
    residentName: "",
    roomNumber: "",
    amount: "",
    month: "",
    dueDate: "",
    status: "Pending",
    method: "Cash",
    notes: "",
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

 
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteProcessing, setDeleteProcessing] = useState(false);

 
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState("success");
  const [modalMessage, setModalMessage] = useState("");

  function showSuccess(msg) {
    setModalType("success");
    setModalMessage(msg);
    setModalOpen(true);
  }

  function showError(msg) {
    setModalType("error");
    setModalMessage(
      msg || "Something went wrong. Please try again in a moment."
    );
    setModalOpen(true);
  }

 
  useEffect(function () {
    let mounted = true;

    async function load() {
      setLoading(true);
      setError("");

      try {
        const res = await fetch(API_BASE + "/api/billing", {
          headers: withAuth(),
        });

        if (!res.ok) {
          throw new Error("Failed to load (" + res.status + ")");
        }

        const data = await res.json();

        const list = (data.payments || []).map(function (p) {
          return Object.assign({}, p, {
            invoiceNo: p.invoiceNo || invoiceFallback(),
          });
        });

        if (mounted) setPayments(list);
      } catch (err) {
        console.error("load billing err", err);
        if (mounted)
          setError(
            "Unable to load billing records at the moment. Please try again shortly."
          );
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return function () {
      mounted = false;
    };
  }, []);

  
  const stats = useMemo(
    function () {
      var total = payments.length;
      var totalAmount = 0;
      var paid = 0;
      var pending = 0;

      payments.forEach(function (p) {
        var amt = Number(p.amount || 0);
        totalAmount += amt;
        if (p.status === "Paid") paid += amt;
        if (p.status === "Pending") pending += amt;
      });

      return {
        total: total,
        totalAmount: totalAmount,
        paid: paid,
        pending: pending,
      };
    },
    [payments]
  );

  const filtered = useMemo(
    function () {
      const q = (search || "").toLowerCase();
      return payments.filter(function (p) {
        const matchText =
          !q ||
          (p.residentName || "")
            .toLowerCase()
            .indexOf(q) !== -1 ||
          String(p.roomNumber || "")
            .toLowerCase()
            .indexOf(q) !== -1 ||
          (p.month || "").toLowerCase().indexOf(q) !== -1;

        const matchStatus =
          statusFilter === "all" || p.status === statusFilter;

        return matchText && matchStatus;
      });
    },
    [payments, search, statusFilter]
  );

  
  async function markAsPaid(id) {
    if (!id) throw new Error("Invoice id missing");
    const url = API_BASE + "/api/billing/" + id + "/pay";

    const res = await fetch(url, {
      method: "PATCH",
      headers: withAuth({ "Content-Type": "application/json" }),
      body: JSON.stringify({ method: "Manual" }),
    });

    const text = await res.text().catch(function () {
      return "";
    });

    var data = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch (e2) {
      data = null;
    }

    if (!res.ok || (data && data.ok === false)) {
      const msg =
        (data && data.error) ||
        "PATCH " +
          url +
          " -> " +
          res.status +
          " " +
          res.statusText +
          " " +
          text;
      throw new Error(msg);
    }

    return (data && data.payment) || null;
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
        showError(
          "Please authorise this payment by selecting the confirmation checkbox."
        );
        return;
      }
      if (!cardNumber || !expiry || !cvv || !cardName) {
        showError("Please complete all card details before proceeding.");
        return;
      }
    }

    setPayNowProcessing(true);

    const payload = {
      invoiceId: payNowTarget._id,
      residentId: payNowTarget.residentId || "",
      amount: Number(payNowTarget.amount || 0),
      method: method,
      providerPaymentId: "mock_pay_" + Date.now(),
      providerOrderId: "mock_order_" + Date.now(),
      status: "Success",
      meta: { mock: true },
    };

    try {
      
      try {
        const r1 = await fetch(API_BASE + "/api/payments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (r1.ok) {
          try {
            const j = await r1.json();
            if (j && j.ok === false) {
              console.log("payments not ok", j);
            }
          } catch (e) {}
        }
      } catch (e1) {
        console.info(
          "POST /api/payments failed (dev fallback):",
          e1 && e1.message
        );
      }

      const updated = await markAsPaid(payNowTarget._id);

      setPayments(function (prev) {
        return prev.map(function (p) {
          if (p._id !== payNowTarget._id) return p;
          return Object.assign({}, p, {
            status: "Paid",
            paidOn:
              (updated && updated.paidOn) ||
              new Date().toISOString().slice(0, 10),
          });
        });
      });

      showSuccess("The payment has been processed successfully.");

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
      showError(
        "The payment could not be processed at the moment. Please try again."
      );
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
      showError("Please complete all required fields before saving.");
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
      const res = await fetch(API_BASE + "/api/billing", {
        method: "POST",
        headers: withAuth({ "Content-Type": "application/json" }),
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok || !data.ok) {
        console.error("submitAdd backend err:", data);
        showError(
          "We were unable to save this payment record. Please try again."
        );
        return;
      }

      const saved = data.payment || payload;
      saved.invoiceNo = saved.invoiceNo || invoiceFallback();

      setPayments(function (prev) {
        return [saved].concat(prev);
      });
      setShowAdd(false);
      showSuccess("Payment record has been added successfully.");
    } catch (err) {
      console.error("submitAdd err", err);
      showError(
        "A network error occurred while saving. Please try again in a moment."
      );
    }
  }

  function openEdit(p) {
    setEditForm({
      _id: p._id,
      residentName: p.residentName || "",
      roomNumber: p.roomNumber || "",
      amount: p.amount != null ? String(p.amount) : "",
      month: p.month || "",
      dueDate: formatDateForInput(p.dueDate),
      status: p.status || "Pending",
      method: p.method || "Cash",
      notes: p.notes || "",
    });
    setShowEdit(true);
  }

  async function submitEdit(e) {
    e.preventDefault();

    if (!editForm._id) {
      showError("Payment reference is missing.");
      return;
    }

    if (
      !editForm.residentName ||
      !editForm.roomNumber ||
      !editForm.amount ||
      !editForm.month
    ) {
      showError("Please complete all required fields before saving.");
      return;
    }

    const payload = {
      residentName: editForm.residentName,
      roomNumber: editForm.roomNumber,
      amount: Number(editForm.amount),
      month: editForm.month,
      dueDate: editForm.dueDate || "",
      status: editForm.status,
      method: editForm.method,
      notes: editForm.notes || "",
    };

    try {
      const res = await fetch(API_BASE + "/api/billing/" + editForm._id, {
        method: "PUT",
        headers: withAuth({ "Content-Type": "application/json" }),
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(function () {
        return {};
      });

      if (!res.ok || data.ok === false) {
        console.error("submitEdit backend err:", data);
        showError(
          "Unable to update the payment at the moment. Please try again."
        );
        return;
      }

      const updated = data.payment || data.updated || data;

      setPayments(function (prev) {
        return prev.map(function (p) {
          if (p._id !== editForm._id) return p;
          return Object.assign({}, p, updated);
        });
      });

      setShowEdit(false);
      showSuccess("Payment record has been updated successfully.");
    } catch (err) {
      console.error("submitEdit err", err);
      showError(
        "A network error occurred while updating. Please try again."
      );
    }
  }


  function handleDeleteClick(p) {
    if (!p || !p._id) return;
    setDeleteTarget(p);
    setDeleteOpen(true);
  }

  async function confirmDelete() {
    if (!deleteTarget || !deleteTarget._id) return;

    setDeleteProcessing(true);
    try {
      const res = await fetch(API_BASE + "/api/billing/" + deleteTarget._id, {
        method: "DELETE",
        headers: withAuth(),
      });

      const data = await res.json().catch(function () {
        return {};
      });

      if (!res.ok || data.ok === false) {
        console.error("delete billing backend err:", data);
        showError(
          "Unable to delete this payment record at the moment. Please try again."
        );
        return;
      }

      setPayments(function (prev) {
        return prev.filter(function (x) {
          return x._id !== deleteTarget._id;
        });
      });

      showSuccess("Payment record has been deleted.");
      setDeleteOpen(false);
      setDeleteTarget(null);
    } catch (err) {
      console.error("confirmDelete err", err);
      showError(
        "A network error occurred while deleting. Please try again."
      );
    } finally {
      setDeleteProcessing(false);
    }
  }

  
  function openView(p) {
    setViewPayment(p);
    setShowView(true);
  }

  function sendReminder() {
    showSuccess("A payment reminder has been noted for this resident.");
  }


  return (
    <main className="p-4 sm:p-6 bg-gray-50 min-h-screen space-y-6">
    
      <div className="flex justify-between items-start flex-wrap gap-3">
        <div>
          <p className="text-sm text-gray-500">
            Track room fees &amp; invoices
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={function () {
              setAddForm({
                residentName: "",
                roomNumber: "",
                amount: "",
                month: "",
                dueDate: "",
                status: "Pending",
                method: "Cash",
                notes: "",
              });
              setShowAdd(true);
            }}
            className="px-4 py-2 bg-emerald-600 text-white rounded shadow text-sm hover:bg-emerald-700"
          >
            + Add Payment
          </button>

          <button
            onClick={function () {
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
            className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded shadow text-sm"
          >
            Generate Invoice
          </button>
        </div>
      </div>

     
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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

      
      <Card title="Payment History">
        <div className="flex flex-wrap gap-3 mb-4 items-center">
          <input
            value={search}
            onChange={function (e) {
              setSearch(e.target.value);
            }}
            placeholder="Search by resident, room or month..."
            className="flex-1 min-w-[220px] border px-3 py-2 rounded text-sm"
            aria-label="Search payments"
          />

          <select
            value={statusFilter}
            onChange={function (e) {
              setStatusFilter(e.target.value);
            }}
            className="border px-3 py-2 rounded text-sm"
            aria-label="Filter status"
          >
            <option value="all">All Status</option>
            <option>Paid</option>
            <option>Pending</option>
            <option>Overdue</option>
          </select>
        </div>

        {loading && (
          <p className="text-center py-6 text-gray-500 text-sm">
            Loading payments…
          </p>
        )}
        {error && (
          <p className="text-center py-6 text-red-500 text-sm">
            {error}
          </p>
        )}

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
                {filtered.map(function (p) {
                  const isPaid = p.status === "Paid";
                  const isPending = p.status === "Pending";

                  return (
                    <tr key={p._id} className="border-b">
                      <td className="px-3 py-3 max-w-[220px]">
                        {p.invoiceNo}
                      </td>
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

                      <td className="px-3 py-3">
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={function () {
                              openView(p);
                            }}
                            className="px-2 py-1 text-xs bg-indigo-50 text-indigo-600 rounded"
                          >
                            View
                          </button>

                         
                          {isPending && (
                            <button
                              onClick={function () {
                                openPayNow(p);
                              }}
                              className="px-2 py-1 text-xs bg-green-600 text-white rounded"
                            >
                              Pay Now
                            </button>
                          )}

                       
                          {isPaid && (
                            <button
                              disabled
                              className="px-2 py-1 text-xs bg-emerald-700 text-white rounded opacity-70 cursor-default"
                            >
                              Mark Paid
                            </button>
                          )}

                          <button
                            onClick={function () {
                              if (!isPaid) openEdit(p);
                            }}
                            disabled={isPaid}
                            className={
                              "px-2 py-1 text-xs rounded " +
                              (isPaid
                                ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                                : "bg-sky-50 text-sky-700")
                            }
                          >
                            Edit
                          </button>

                          <button
                            onClick={function () {
                              if (!isPaid) handleDeleteClick(p);
                            }}
                            disabled={isPaid}
                            className={
                              "px-2 py-1 text-xs rounded " +
                              (isPaid
                                ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                                : "bg-rose-50 text-rose-700")
                            }
                          >
                            Delete
                          </button>

                          <button
                            onClick={function () {
                              sendReminder();
                            }}
                            className="px-2 py-1 text-xs bg-amber-50 text-amber-700 rounded"
                          >
                            Remind
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filtered.length === 0 && (
                  <tr>
                    <td
                      colSpan="7"
                      className="py-6 text-center text-gray-500 text-sm"
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

  
      {payNowOpen && payNowTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative z-10 bg-white rounded-2xl shadow-[0_30px_60px_rgba(2,6,23,0.35)] w-full max-w-3xl mx-auto border border-slate-100 overflow-hidden">
            <div
              className="flex items-start justify-between p-5 border-b"
              style={{
                background:
                  "linear-gradient(90deg, #F8FAFF 0%, #F2FBFF 100%)",
              }}
            >
              <div>
                <h3 className="text-lg font-semibold text-slate-800">
                  Process Payment
                </h3>
                <p className="text-sm text-slate-500">
                  Review payment details and complete the transaction.
                </p>
              </div>
              <button
                onClick={function () {
                  if (!payNowProcessing) {
                    setPayNowOpen(false);
                    setPayNowTarget(null);
                  }
                }}
                className="text-slate-400 hover:text-slate-600"
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
                  <div className="font-semibold text-slate-800">
                    {payNowTarget.invoiceNo}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">Resident</div>
                  <div className="font-semibold text-slate-800">
                    {payNowTarget.residentName}
                  </div>
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
                    className={
                      "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition " +
                      (paymentMethod === "Card"
                        ? "border-2 border-teal-200 bg-teal-50 shadow-sm"
                        : "border border-slate-200 bg-white")
                    }
                  >
                    <input
                      type="radio"
                      name="pm"
                      className="ml-1"
                      checked={paymentMethod === "Card"}
                      onChange={function () {
                        setPaymentMethod("Card");
                      }}
                    />
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-6 flex items-center justify-center">
                        <span className="text-xl">💳</span>
                      </div>
                      <div>
                        <div className="text-slate-800">
                          Credit / Debit Card
                        </div>
                        <div className="text-xs text-slate-500">
                          Visa, MasterCard, Rupay
                        </div>
                      </div>
                    </div>
                  </label>

                  <label
                    className={
                      "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition " +
                      (paymentMethod === "PayPal"
                        ? "border-2 border-indigo-200 bg-indigo-50 shadow-sm"
                        : "border border-slate-200 bg-white")
                    }
                  >
                    <input
                      type="radio"
                      name="pm"
                      className="ml-1"
                      checked={paymentMethod === "PayPal"}
                      onChange={function () {
                        setPaymentMethod("PayPal");
                      }}
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
                    className={
                      "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition " +
                      (paymentMethod === "Cash"
                        ? "border-2 border-amber-200 bg-amber-50 shadow-sm"
                        : "border border-slate-200 bg-white")
                    }
                  >
                    <input
                      type="radio"
                      name="pm"
                      className="ml-1"
                      checked={paymentMethod === "Cash"}
                      onChange={function () {
                        setPaymentMethod("Cash");
                      }}
                    />
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-6 flex items-center justify-center">
                        <span className="text-xl">💵</span>
                      </div>
                      <div className="text-slate-800">Cash</div>
                    </div>
                  </label>

                  <label
                    className={
                      "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition " +
                      (paymentMethod === "UPI"
                        ? "border-2 border-sky-300 bg-sky-50 shadow-sm"
                        : "border border-slate-200 bg-white")
                    }
                  >
                    <input
                      type="radio"
                      name="pm"
                      className="ml-1"
                      checked={paymentMethod === "UPI"}
                      onChange={function () {
                        setPaymentMethod("UPI");
                      }}
                    />
                    <div className="text-slate-800">UPI</div>
                  </label>
                </div>

                <div className="mt-4">
                  {paymentMethod === "Card" && (
                    <div className="space-y-3">
                      <input
                        value={cardNumber}
                        onChange={function (e) {
                          setCardNumber(e.target.value);
                        }}
                        placeholder="Card Number"
                        className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-100"
                      />
                      <div className="flex gap-3">
                        <input
                          value={expiry}
                          onChange={function (e) {
                            setExpiry(e.target.value);
                          }}
                          placeholder="MM/YY"
                          className="flex-1 border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-100"
                        />
                        <input
                          value={cvv}
                          onChange={function (e) {
                            setCvv(e.target.value);
                          }}
                          placeholder="CVV"
                          className="w-32 border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-100"
                        />
                      </div>
                      <input
                        value={cardName}
                        onChange={function (e) {
                          setCardName(e.target.value);
                        }}
                        placeholder="Cardholder Name"
                        className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-100"
                      />

                      <label className="flex items-start gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={authorize}
                          onChange={function (e) {
                            setAuthorize(e.target.checked);
                          }}
                          className="mt-1"
                        />
                        <div className="text-slate-600">
                          I authorise this payment and agree to the{" "}
                          <span className="underline">
                            terms and conditions
                          </span>
                          .
                        </div>
                      </label>
                    </div>
                  )}

                  {paymentMethod === "UPI" && (
                    <div className="space-y-3">
                      <div className="p-3 border rounded text-sm text-slate-700 bg-white">
                        <div className="text-xs text-slate-500">
                          UPI ID
                        </div>
                        <div className="font-medium">
                          your-upi-id@upi
                        </div>
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
                          <div className="font-medium mb-1">
                            Scan &amp; Pay
                          </div>
                          <div className="text-xs">
                            Scan the QR using any UPI app (Google
                            Pay, PhonePe, Paytm).
                          </div>
                          <div className="mt-2 font-medium text-slate-800">
                            your-upi-id@upi
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {paymentMethod === "PayPal" && (
                    <div className="p-3 border rounded text-sm text-slate-700 bg-white">
                      The resident will be redirected to PayPal
                      (simulated) to complete this payment.
                    </div>
                  )}

                  {paymentMethod === "Cash" && (
                    <div className="p-3 border rounded text-sm text-slate-700 bg-white">
                      Collect cash at the office and then mark this
                      invoice as paid.
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
                  <div className="font-medium mb-3">
                    {payNowTarget.residentName}
                  </div>

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
                    Once processed, the invoice status will be updated
                    to <span className="font-semibold">Paid</span>.
                  </div>
                </div>
              </aside>
            </div>

            <div className="flex items-center justify-end gap-3 p-4 border-t">
              <button
                onClick={function () {
                  if (!payNowProcessing) {
                    setPayNowOpen(false);
                    setPayNowTarget(null);
                  }
                }}
                className="px-4 py-2 border rounded text-slate-700 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={function () {
                  if (payNowProcessing) return;
                  confirmPayNow(paymentMethod);
                }}
                className={
                  "px-4 py-2 rounded text-white text-sm " +
                  (payNowProcessing
                    ? "bg-emerald-300"
                    : "bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700")
                }
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
                  onClick={function () {
                    setShowView(false);
                  }}
                  className="ml-1 text-slate-400 hover:text-slate-600 rounded-full p-1 hover:bg-slate-100 transition"
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
                      ? new Date(
                          viewPayment.dueDate
                        ).toLocaleDateString()
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
                  {viewPayment.notes &&
                  viewPayment.notes.trim() !== ""
                    ? viewPayment.notes
                    : "No special notes for this payment."}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between px-5 py-3 border-t bg-slate-50/80">
              <p className="text-[11px] text-slate-500">
                Created on{" "}
                {viewPayment.createdAt
                  ? new Date(
                      viewPayment.createdAt
                    ).toLocaleDateString()
                  : "-"}
              </p>

              <button
                onClick={function () {
                  setShowView(false);
                }}
                className="px-4 py-1.5 text-sm rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

     
      {showAdd && (
        <div className="fixed inset-0 z-40 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-slate-900/40" />
          <div className="relative z-10 w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900">
                Add Payment
              </h3>
              <button
                onClick={function () {
                  setShowAdd(false);
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form
              className="space-y-3 text-sm"
              onSubmit={submitAdd}
              autoComplete="off"
            >
              <div>
                <label className="block text-xs text-slate-500 mb-1">
                  Resident Name
                </label>
                <input
                  value={addForm.residentName}
                  onChange={function (e) {
                    setAddForm(
                      Object.assign({}, addForm, {
                        residentName: e.target.value,
                      })
                    );
                  }}
                  className="w-full border rounded px-3 py-2"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-500 mb-1">
                    Room Number
                  </label>
                  <input
                    value={addForm.roomNumber}
                    onChange={function (e) {
                      setAddForm(
                        Object.assign({}, addForm, {
                          roomNumber: e.target.value,
                        })
                      );
                    }}
                    className="w-full border rounded px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">
                    Amount
                  </label>
                  <input
                    value={addForm.amount}
                    onChange={function (e) {
                      setAddForm(
                        Object.assign({}, addForm, {
                          amount: e.target.value,
                        })
                      );
                    }}
                    className="w-full border rounded px-3 py-2"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-500 mb-1">
                    Month
                  </label>
                  <input
                    value={addForm.month}
                    onChange={function (e) {
                      setAddForm(
                        Object.assign({}, addForm, {
                          month: e.target.value,
                        })
                      );
                    }}
                    className="w-full border rounded px-3 py-2"
                    placeholder="Dec 2025"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={formatDateForInput(addForm.dueDate)}
                    onChange={function (e) {
                      setAddForm(
                        Object.assign({}, addForm, {
                          dueDate: e.target.value,
                        })
                      );
                    }}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-500 mb-1">
                  Notes
                </label>
                <textarea
                  value={addForm.notes}
                  onChange={function (e) {
                    setAddForm(
                      Object.assign({}, addForm, {
                        notes: e.target.value,
                      })
                    );
                  }}
                  className="w-full border rounded px-3 py-2"
                  rows={2}
                />
              </div>

              <div className="flex justify-end gap-2 mt-4">
                <button
                  type="button"
                  onClick={function () {
                    setShowAdd(false);
                  }}
                  className="px-3 py-1.5 text-sm border rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 text-sm rounded bg-emerald-600 text-white"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

     
      {showEdit && (
        <div className="fixed inset-0 z-40 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-slate-900/40" />
          <div className="relative z-10 w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900">
                Edit Payment
              </h3>
              <button
                onClick={function () {
                  setShowEdit(false);
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form
              className="space-y-3 text-sm"
              onSubmit={submitEdit}
              autoComplete="off"
            >
              <div>
                <label className="block text-xs text-slate-500 mb-1">
                  Resident Name
                </label>
                <input
                  value={editForm.residentName}
                  onChange={function (e) {
                    setEditForm(
                      Object.assign({}, editForm, {
                        residentName: e.target.value,
                      })
                    );
                  }}
                  className="w-full border rounded px-3 py-2"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-500 mb-1">
                    Room Number
                  </label>
                  <input
                    value={editForm.roomNumber}
                    onChange={function (e) {
                      setEditForm(
                        Object.assign({}, editForm, {
                          roomNumber: e.target.value,
                        })
                      );
                    }}
                    className="w-full border rounded px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">
                    Amount
                  </label>
                  <input
                    value={editForm.amount}
                    onChange={function (e) {
                      setEditForm(
                        Object.assign({}, editForm, {
                          amount: e.target.value,
                        })
                      );
                    }}
                    className="w-full border rounded px-3 py-2"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-500 mb-1">
                    Month
                  </label>
                  <input
                    value={editForm.month}
                    onChange={function (e) {
                      setEditForm(
                        Object.assign({}, editForm, {
                          month: e.target.value,
                        })
                      );
                    }}
                    className="w-full border rounded px-3 py-2"
                    placeholder="Dec 2025"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={formatDateForInput(editForm.dueDate)}
                    onChange={function (e) {
                      setEditForm(
                        Object.assign({}, editForm, {
                          dueDate: e.target.value,
                        })
                      );
                    }}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-500 mb-1">
                  Notes
                </label>
                <textarea
                  value={editForm.notes}
                  onChange={function (e) {
                    setEditForm(
                      Object.assign({}, editForm, {
                        notes: e.target.value,
                      })
                    );
                  }}
                  className="w-full border rounded px-3 py-2"
                  rows={2}
                />
              </div>

              <div className="flex justify-end gap-2 mt-4">
                <button
                  type="button"
                  onClick={function () {
                    setShowEdit(false);
                  }}
                  className="px-3 py-1.5 text-sm border rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 text-sm rounded bg-emerald-600 text-white"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

     
      {showInvoice && (
        <div className="fixed inset-0 z-40 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-slate-900/40" />
          <div className="relative z-10 w-full max-w-2xl bg-white rounded-2xl shadow-xl border border-slate-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">
                  Generate Invoice
                </h3>
                <p className="text-xs text-slate-500">
                  Create a formal invoice for a resident.
                </p>
              </div>
              <button
                onClick={function () {
                  setShowInvoice(false);
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form
              className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm"
              onSubmit={function (e) {
                e.preventDefault();

                if (
                  !invoiceData.residentName ||
                  !invoiceData.roomNumber ||
                  !invoiceData.amount ||
                  !invoiceData.month
                ) {
                  showError(
                    "Please complete all required fields before generating the invoice."
                  );
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
                  invoiceNo:
                    invoiceData.invoiceNo || invoiceFallback(),
                };

                (async function () {
                  try {
                    const res = await fetch(API_BASE + "/api/billing", {
                      method: "POST",
                      headers: withAuth({
                        "Content-Type": "application/json",
                      }),
                      body: JSON.stringify(payload),
                    });
                    const data = await res.json();

                    if (!res.ok || !data.ok) {
                      console.error(
                        "handleGenerateInvoice backend err:",
                        data
                      );
                      showError(
                        "Unable to generate the invoice at the moment. Please try again."
                      );
                      return;
                    }

                    const saved = data.payment || payload;
                    saved.invoiceNo =
                      saved.invoiceNo || invoiceFallback();

                    setPayments(function (prev) {
                      return [saved].concat(prev);
                    });
                    setShowInvoice(false);
                    showSuccess(
                      "Invoice has been generated successfully."
                    );
                  } catch (err) {
                    console.error("handleGenerateInvoice err", err);
                    showError(
                      "A network error occurred while generating the invoice. Please try again."
                    );
                  }
                })();
              }}
            >
              <div className="md:col-span-2">
                <label className="block text-xs text-slate-500 mb-1">
                  Invoice Number
                </label>
                <input
                  value={invoiceData.invoiceNo}
                  onChange={function (e) {
                    setInvoiceData(
                      Object.assign({}, invoiceData, {
                        invoiceNo: e.target.value,
                      })
                    );
                  }}
                  className="w-full border rounded px-3 py-2"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs text-slate-500 mb-1">
                  Resident Name
                </label>
                <input
                  value={invoiceData.residentName}
                  onChange={function (e) {
                    setInvoiceData(
                      Object.assign({}, invoiceData, {
                        residentName: e.target.value,
                      })
                    );
                  }}
                  className="w-full border rounded px-3 py-2"
                  required
                />
              </div>

              <div>
                <label className="block text-xs text-slate-500 mb-1">
                  Room Number
                </label>
                <input
                  value={invoiceData.roomNumber}
                  onChange={function (e) {
                    setInvoiceData(
                      Object.assign({}, invoiceData, {
                        roomNumber: e.target.value,
                      })
                    );
                  }}
                  className="w-full border rounded px-3 py-2"
                  required
                />
              </div>

              <div>
                <label className="block text-xs text-slate-500 mb-1">
                  Amount
                </label>
                <input
                  value={invoiceData.amount}
                  onChange={function (e) {
                    setInvoiceData(
                      Object.assign({}, invoiceData, {
                        amount: e.target.value,
                      })
                    );
                  }}
                  className="w-full border rounded px-3 py-2"
                  required
                />
              </div>

              <div>
                <label className="block text-xs text-slate-500 mb-1">
                  Month
                </label>
                <input
                  value={invoiceData.month}
                  onChange={function (e) {
                    setInvoiceData(
                      Object.assign({}, invoiceData, {
                        month: e.target.value,
                      })
                    );
                  }}
                  className="w-full border rounded px-3 py-2"
                  placeholder="Dec 2025"
                  required
                />
              </div>

              <div>
                <label className="block text-xs text-slate-500 mb-1">
                  Due Date
                </label>
                <input
                  type="date"
                  value={formatDateForInput(invoiceData.dueDate)}
                  onChange={function (e) {
                    setInvoiceData(
                      Object.assign({}, invoiceData, {
                        dueDate: e.target.value,
                      })
                    );
                  }}
                  className="w-full border rounded px-3 py-2"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs text-slate-500 mb-1">
                  Notes on Invoice
                </label>
                <textarea
                  value={invoiceData.notes}
                  onChange={function (e) {
                    setInvoiceData(
                      Object.assign({}, invoiceData, {
                        notes: e.target.value,
                      })
                    );
                  }}
                  className="w-full border rounded px-3 py-2"
                  rows={2}
                />
              </div>

              <div className="md:col-span-2 flex items-center justify-between mt-2">
                <div className="text-xs text-slate-500">
                  Preview total:{" "}
                  <span className="font-semibold text-slate-800">
                    {formatCurrency(invoiceData.amount || 0)}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={function () {
                      setInvoiceData({
                        invoiceNo: invoiceFallback(),
                        residentName: "",
                        roomNumber: "",
                        month: "",
                        amount: "",
                        dueDate: addDaysISO(30),
                        notes: "Thank you for your payment.",
                      });
                    }}
                    className="px-3 py-1.5 text-sm border rounded"
                  >
                    Reset
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1.5 text-sm rounded bg-indigo-600 text-white"
                  >
                    Generate
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

     
      <ConfirmDeleteModal
        open={deleteOpen}
        item={deleteTarget}
        loading={deleteProcessing}
        onCancel={function () {
          if (deleteProcessing) return;
          setDeleteOpen(false);
          setDeleteTarget(null);
        }}
        onConfirm={confirmDelete}
      />

     
      <StatusModal
        open={modalOpen}
        type={modalType}
        message={modalMessage}
        onClose={function () {
          setModalOpen(false);
        }}
      />
    </main>
  );
}
