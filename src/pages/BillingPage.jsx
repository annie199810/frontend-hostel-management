
import React, { useEffect, useMemo, useState } from "react";
import Card from "../components/Card";

var API_URL = import.meta.env.VITE_API_BASE_URL + "/api/billing";


function formatCurrency(amount) {
  if (!amount) return "₹0";
  return "₹" + Number(amount).toLocaleString("en-IN");
}

function StatusBadge(props) {
  var v = props.value || "";
  var cls =
    v === "Paid"
      ? "bg-green-50 text-green-700"
      : v === "Pending"
      ? "bg-amber-50 text-amber-700"
      : "bg-red-50 text-red-700";

  return (
    <span className={"px-2 py-0.5 rounded-full text-xs font-medium " + cls}>
      {v}
    </span>
  );
}

export default function BillingPage() {
  var [payments, setPayments] = useState([]);
  var [loading, setLoading] = useState(true);
  var [error, setError] = useState("");

  var [search, setSearch] = useState("");
  var [statusFilter, setStatusFilter] = useState("all");

  var [showForm, setShowForm] = useState(false);
  var [formData, setFormData] = useState({
    residentName: "",
    roomNumber: "",
    amount: "",
    month: "",
    status: "Paid",
    method: "Cash",
  });

 
  useEffect(function () {
    var isMounted = true;

    async function load() {
      setLoading(true);
      setError("");
      try {
        var res = await fetch(API_URL);
        if (!res.ok) throw new Error(res.status + " " + res.statusText);
        var data = await res.json();
        if (!isMounted) return;
        var list = data.payments || [];
        setPayments(list);
      } catch (err) {
       // console.error("Error loading billing", err);
        if (!isMounted) return;
        setError("Failed to load billing records.");
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    load();
    return function () {
      isMounted = false;
    };
  }, []);

  var stats = useMemo(
    function () {
      var total = payments.length;
      var totalAmount = 0;
      var totalPaid = 0;
      var totalPending = 0;

      payments.forEach(function (p) {
        totalAmount += Number(p.amount || 0);
        if (p.status === "Paid") totalPaid += Number(p.amount || 0);
        if (p.status === "Pending") totalPending += Number(p.amount || 0);
      });

      return {
        total: total,
        totalAmount: totalAmount,
        totalPaid: totalPaid,
        totalPending: totalPending,
      };
    },
    [payments]
  );


  var filteredPayments = useMemo(
    function () {
      var text = search.toLowerCase();

      return payments.filter(function (p) {
        var matchSearch =
          !text ||
          (p.residentName || "").toLowerCase().indexOf(text) !== -1 ||
          (p.roomNumber || "").toLowerCase().indexOf(text) !== -1 ||
          (p.month || "").toLowerCase().indexOf(text) !== -1;

        var matchStatus =
          statusFilter === "all" || p.status === statusFilter;

        return matchSearch && matchStatus;
      });
    },
    [payments, search, statusFilter]
  );

  
  function openForm() {
    setFormData({
      residentName: "",
      roomNumber: "",
      amount: "",
      month: "",
      status: "Paid",
      method: "Cash",
    });
    setShowForm(true);
  }

  function handleFormChange(field, value) {
    setFormData(function (prev) {
      return { ...prev, [field]: value };
    });
  }

  async function handleFormSubmit(e) {
    e.preventDefault();

    if (!formData.residentName || !formData.roomNumber || !formData.amount || !formData.month) {
      alert("Please enter resident, room, amount and month.");
      return;
    }

    var payload = {
      residentName: formData.residentName,
      roomNumber: formData.roomNumber,
      amount: Number(formData.amount),
      month: formData.month,
      status: formData.status,
      method: formData.method,
    };

    try {
      var res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      var data = await res.json();

      if (!res.ok || !data.ok) {
       // console.error("Billing save failed:", data);
        alert("Failed to save payment.");
        return;
      }

      setPayments(function (prev) {
        return [data.payment].concat(prev);
      });

      setShowForm(false);
    } catch (err) {
      //console.error("Error saving payment", err);
      alert("Error saving payment.");
    }
  }

  return (
    <main className="p-6 space-y-6">

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-3xl font-bold">Billing & Payments</h2>
          <p className="text-sm text-gray-600 mt-1">
            Track room fees, payment status, and monthly revenue.
          </p>
        </div>

        <button
          onClick={openForm}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 text-sm"
        >
          + Add Payment
        </button>
      </div>

    
      <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <div className="text-xs font-semibold text-gray-500 uppercase mb-1">
            Total Payments
          </div>
          <div className="text-3xl font-bold">{stats.total}</div>
        </Card>

        <Card>
          <div className="text-xs font-semibold text-gray-500 uppercase mb-1">
            Total Amount
          </div>
          <div className="text-2xl font-bold text-purple-600">
            {formatCurrency(stats.totalAmount)}
          </div>
        </Card>

        <Card>
          <div className="text-xs font-semibold text-gray-500 uppercase mb-1">
            Paid
          </div>
          <div className="text-2xl font-bold text-green-600">
            {formatCurrency(stats.totalPaid)}
          </div>
        </Card>

        <Card>
          <div className="text-xs font-semibold text-gray-500 uppercase mb-1">
            Pending
          </div>
          <div className="text-2xl font-bold text-amber-600">
            {formatCurrency(stats.totalPending)}
          </div>
        </Card>
      </section>


      <Card title="Payment History">
    
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <input
            type="text"
            placeholder="Search by resident, room or month..."
            className="border px-3 py-2 rounded text-sm flex-1 min-w-[220px]"
            value={search}
            onChange={function (e) {
              setSearch(e.target.value);
            }}
          />

          <select
            className="border px-3 py-2 rounded text-sm"
            value={statusFilter}
            onChange={function (e) {
              setStatusFilter(e.target.value);
            }}
          >
            <option value="all">All Status</option>
            <option value="Paid">Paid</option>
            <option value="Pending">Pending</option>
            <option value="Overdue">Overdue</option>
          </select>
        </div>

       
        {loading && (
          <div className="py-8 text-center text-gray-500 text-sm">
            Loading billing records…
          </div>
        )}

        {!loading && error && (
          <div className="py-8 text-center text-red-500 text-sm">{error}</div>
        )}

        {!loading && !error && (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm border-t border-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-3 py-2 font-semibold">Resident</th>
                  <th className="text-left px-3 py-2 font-semibold">Room</th>
                  <th className="text-left px-3 py-2 font-semibold">Month</th>
                  <th className="text-left px-3 py-2 font-semibold">Method</th>
                  <th className="text-left px-3 py-2 font-semibold">Status</th>
                  <th className="text-right px-3 py-2 font-semibold">Amount</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.length === 0 && (
                  <tr>
                    <td
                      colSpan="6"
                      className="px-3 py-4 text-center text-gray-500"
                    >
                      No payments found.
                    </td>
                  </tr>
                )}

                {filteredPayments.map(function (p) {
                  return (
                    <tr key={p._id} className="border-t">
                      <td className="px-3 py-2">{p.residentName}</td>
                      <td className="px-3 py-2">{p.roomNumber}</td>
                      <td className="px-3 py-2">{p.month}</td>
                      <td className="px-3 py-2 text-gray-700">{p.method}</td>
                      <td className="px-3 py-2">
                        <StatusBadge value={p.status} />
                      </td>
                      <td className="px-3 py-2 text-right font-medium">
                        {formatCurrency(p.amount)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {showForm && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-20">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold">Add Payment</h3>
              <button
                onClick={function () {
                  setShowForm(false);
                }}
                className="text-gray-500 hover:text-gray-700 text-lg"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Resident Name
                </label>
                <input
                  type="text"
                  className="border px-3 py-2 rounded w-full text-sm"
                  value={formData.residentName}
                  onChange={function (e) {
                    handleFormChange("residentName", e.target.value);
                  }}
                  placeholder="e.g. Alice"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Room Number
                  </label>
                  <input
                    type="text"
                    className="border px-3 py-2 rounded w-full text-sm"
                    value={formData.roomNumber}
                    onChange={function (e) {
                      handleFormChange("roomNumber", e.target.value);
                    }}
                    placeholder="e.g. 101"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Month
                  </label>
                  <input
                    type="text"
                    className="border px-3 py-2 rounded w-full text-sm"
                    value={formData.month}
                    onChange={function (e) {
                      handleFormChange("month", e.target.value);
                    }}
                    placeholder="e.g. Jan 2025"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Amount (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    className="border px-3 py-2 rounded w-full text-sm"
                    value={formData.amount}
                    onChange={function (e) {
                      handleFormChange("amount", e.target.value);
                    }}
                    placeholder="6000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Method
                  </label>
                  <select
                    className="border px-3 py-2 rounded w-full text-sm"
                    value={formData.method}
                    onChange={function (e) {
                      handleFormChange("method", e.target.value);
                    }}
                  >
                    <option value="Cash">Cash</option>
                    <option value="UPI">UPI</option>
                    <option value="Card">Card</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Status
                  </label>
                  <select
                    className="border px-3 py-2 rounded w-full text-sm"
                    value={formData.status}
                    onChange={function (e) {
                      handleFormChange("status", e.target.value);
                    }}
                  >
                    <option value="Paid">Paid</option>
                    <option value="Pending">Pending</option>
                    <option value="Overdue">Overdue</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={function () {
                    setShowForm(false);
                  }}
                  className="px-4 py-2 border rounded text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded text-sm"
                >
                  Save Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
