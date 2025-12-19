import React, { useEffect, useMemo, useState } from "react";
import Card from "../components/Card";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

/* ---------------- helpers ---------------- */

function formatCurrency(v) {
  if (!v) return "₹0";
  return "₹" + Number(v).toLocaleString("en-IN");
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

/* ---------------- page ---------------- */

export default function ReportsPage() {
  const [rooms, setRooms] = useState([]);
  const [bills, setBills] = useState([]);
  const [maintenance, setMaintenance] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* ---------- load data ---------- */
  useEffect(function () {
    async function loadData() {
      setLoading(true);
      setError("");

      try {
        const [roomsRes, billsRes, maintRes] = await Promise.all([
          fetch(API_BASE + "/api/rooms", { headers: withAuth() }),
          fetch(API_BASE + "/api/billing", { headers: withAuth() }),
          fetch(API_BASE + "/api/maintenance", { headers: withAuth() }),
        ]);

        if (!roomsRes.ok || !billsRes.ok || !maintRes.ok) {
          throw new Error("API error while loading reports");
        }

        const [roomsJson, billsJson, maintJson] = await Promise.all([
          roomsRes.json(),
          billsRes.json(),
          maintRes.json(),
        ]);

        /* normalize data */
        setRooms(
          Array.isArray(roomsJson.rooms)
            ? roomsJson.rooms
            : Array.isArray(roomsJson)
            ? roomsJson
            : []
        );

        setBills(
          Array.isArray(billsJson.payments)
            ? billsJson.payments
            : Array.isArray(billsJson.bills)
            ? billsJson.bills
            : Array.isArray(billsJson)
            ? billsJson
            : []
        );

        setMaintenance(
          Array.isArray(maintJson.requests)
            ? maintJson.requests
            : Array.isArray(maintJson)
            ? maintJson
            : []
        );
      } catch (err) {
        console.error("Reports load error:", err);
        setError(
          "Unable to load reports at the moment. Please try again shortly."
        );
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  /* ---------- billing stats ---------- */
  const billingStats = useMemo(function () {
    let total = 0,
      paid = 0,
      pending = 0,
      overdue = 0;

    bills.forEach(function (b) {
      const amt = Number(b.amount || 0);
      total += amt;

      const status = (b.status || "").toLowerCase();
      if (status === "paid") paid += amt;
      else if (status === "overdue") overdue += amt;
      else pending += amt;
    });

    return { total, paid, pending, overdue };
  }, [bills]);

  /* ---------- monthly revenue ---------- */
  const monthlyTotals = useMemo(function () {
    const map = {};

    bills.forEach(function (b) {
      const key = b.month || "Unknown";
      const amt = Number(b.amount || 0);
      map[key] = (map[key] || 0) + amt;
    });

    const entries = Object.keys(map).map(function (k) {
      return { label: k, value: map[k] };
    });

    const max = entries.reduce(
      function (m, x) {
        return x.value > m ? x.value : m;
      },
      0
    );

    return { entries, max };
  }, [bills]);

  /* ---------- room stats ---------- */
  const roomStats = useMemo(function () {
    let available = 0,
      occupied = 0,
      maintenanceCount = 0;

    rooms.forEach(function (r) {
      const s = (r.status || "").toLowerCase();
      if (s === "available") available++;
      else if (s === "occupied") occupied++;
      else if (s === "maintenance") maintenanceCount++;
    });

    return {
      total: rooms.length,
      available,
      occupied,
      maintenanceCount,
    };
  }, [rooms]);

  /* ---------- maintenance stats ---------- */
  const maintenanceStats = useMemo(function () {
    let open = 0,
      inProgress = 0,
      closed = 0;

    maintenance.forEach(function (m) {
      const s = (m.status || "").toLowerCase();
      if (s === "open") open++;
      else if (s === "in-progress") inProgress++;
      else if (s === "closed") closed++;
    });

    return { open, inProgress, closed };
  }, [maintenance]);

  if (loading) {
    return (
      <main className="p-4 sm:p-6">
        <div className="text-sm text-gray-500">Loading reports…</div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="p-4 sm:p-6">
        <div className="text-sm text-red-500">{error}</div>
      </main>
    );
  }

  return (
    <main className="p-4 sm:p-6 space-y-6">
      {/* top stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <div className="text-xs text-gray-500">Total Billed</div>
          <div className="text-2xl font-bold">
            {formatCurrency(billingStats.total)}
          </div>
        </Card>

        <Card>
          <div className="text-xs text-gray-500">Paid</div>
          <div className="text-2xl font-bold text-green-600">
            {formatCurrency(billingStats.paid)}
          </div>
        </Card>

        <Card>
          <div className="text-xs text-gray-500">Pending + Overdue</div>
          <div className="text-2xl font-bold text-amber-600">
            {formatCurrency(
              billingStats.pending + billingStats.overdue
            )}
          </div>
        </Card>

        <Card>
          <div className="text-xs text-gray-500">Rooms Occupied</div>
          <div className="text-2xl font-bold">
            {roomStats.occupied}/{roomStats.total}
          </div>
        </Card>
      </div>

      {/* monthly revenue */}
      <Card title="Monthly Revenue">
        {monthlyTotals.entries.length === 0 ? (
          <div className="py-8 text-center text-xs text-gray-500">
            No billing data available
          </div>
        ) : (
          <div className="h-52 flex items-end gap-3 mt-4">
            {monthlyTotals.entries.map(function (m) {
              const h = Math.max(
                8,
                Math.round((m.value / (monthlyTotals.max || 1)) * 100)
              );
              return (
                <div key={m.label} className="flex-1 text-center">
                  <div
                    className="bg-blue-500 rounded-t-lg text-white text-[10px]"
                    style={{ height: h + "%" }}
                  >
                    ₹{(m.value / 1000).toFixed(1)}k
                  </div>
                  <div className="mt-2 text-xs">{m.label}</div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* maintenance */}
      <Card title="Maintenance Status">
        <div className="space-y-3 text-xs mt-3">
          {[
            { label: "Open", value: maintenanceStats.open, color: "bg-red-500" },
            {
              label: "In-progress",
              value: maintenanceStats.inProgress,
              color: "bg-amber-500",
            },
            {
              label: "Closed",
              value: maintenanceStats.closed,
              color: "bg-green-500",
            },
          ].map(function (r) {
            const total =
              maintenanceStats.open +
                maintenanceStats.inProgress +
                maintenanceStats.closed || 1;
            const pct = Math.round((r.value / total) * 100);

            return (
              <div key={r.label}>
                <div className="flex justify-between">
                  <span>{r.label}</span>
                  <span>
                    {r.value} ({pct}%)
                  </span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={r.color + " h-2"}
                    style={{ width: pct + "%" }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </main>
  );
}
