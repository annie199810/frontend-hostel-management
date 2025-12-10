import React, { useEffect, useMemo, useState } from "react";
import Card from "../components/Card";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

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

export default function ReportsPage() {
  const [rooms, setRooms] = useState([]);
  const [bills, setBills] = useState([]);
  const [maintenance, setMaintenance] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(function () {
    async function loadData() {
      setLoading(true);
      setError("");

      try {
        const [roomsRes, billsRes, maintRes] = await Promise.all([
          fetch(API_BASE + "/api/rooms"),
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

        
        const roomsData = Array.isArray(roomsJson.rooms)
          ? roomsJson.rooms
          : Array.isArray(roomsJson)
          ? roomsJson
          : [];
        setRooms(roomsData);

        
        const billsData = Array.isArray(billsJson.payments)
          ? billsJson.payments
          : Array.isArray(billsJson.bills)
          ? billsJson.bills
          : Array.isArray(billsJson)
          ? billsJson
          : [];
        setBills(billsData);

        
        const maintData = Array.isArray(maintJson.requests)
          ? maintJson.requests
          : Array.isArray(maintJson)
          ? maintJson
          : [];
        setMaintenance(maintData);
      } catch (err) {
        console.error("Reports load err", err);
        setError(
          "Unable to load reports at the moment. Please try again shortly."
        );
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const billingStats = useMemo(
    function () {
      var total = 0;
      var paid = 0;
      var pending = 0;
      var overdue = 0;

      (Array.isArray(bills) ? bills : []).forEach(function (b) {
        var amount = Number(b.amount || b.Amount || 0);
        total += amount;

        var status = (b.status || b.Status || "").toLowerCase();
        if (status === "paid") paid += amount;
        else if (status === "overdue") overdue += amount;
        else pending += amount;
      });

      return { total: total, paid: paid, pending: pending, overdue: overdue };
    },
    [bills]
  );

  const monthlyTotals = useMemo(
    function () {
      var map = {};
      (Array.isArray(bills) ? bills : []).forEach(function (b) {
        var key = b.month || b.Month || "Unknown";
        var amt = Number(b.amount || b.Amount || 0);
        map[key] = (map[key] || 0) + amt;
      });

      var entries = Object.keys(map).map(function (k) {
        return { label: k, value: map[k] };
      });

      var max = entries.reduce(
        function (m, x) {
          return x.value > m ? x.value : m;
        },
        0
      );

      return { entries: entries, max: max };
    },
    [bills]
  );

  const roomStats = useMemo(
    function () {
      var total = rooms.length;
      var available = 0;
      var occupied = 0;
      var maintenanceCount = 0;

      (Array.isArray(rooms) ? rooms : []).forEach(function (r) {
        var status = (r.status || "").toLowerCase();
        if (status === "available") available += 1;
        else if (status === "occupied") occupied += 1;
        else if (status === "maintenance") maintenanceCount += 1;
      });

      return {
        total: total,
        available: available,
        occupied: occupied,
        maintenanceCount: maintenanceCount,
      };
    },
    [rooms]
  );

  const maintenanceStats = useMemo(
    function () {
      var open = 0;
      var inProgress = 0;
      var closed = 0;

      (Array.isArray(maintenance) ? maintenance : []).forEach(function (m) {
        var status = (m.status || "").toLowerCase();
        if (status === "open") open += 1;
        else if (status === "in-progress" || status === "inprogress")
          inProgress += 1;
        else if (status === "closed") closed += 1;
      });

      return { open: open, inProgress: inProgress, closed: closed };
    },
    [maintenance]
  );

  var paidPct =
    billingStats.total > 0
      ? Math.round((billingStats.paid / billingStats.total) * 100)
      : 0;

  var pendingPlusOverdue = billingStats.pending + billingStats.overdue;
  var pendingPct =
    billingStats.total > 0
      ? Math.round((pendingPlusOverdue / billingStats.total) * 100)
      : 0;

  var totalRoomsForPct = roomStats.total || 1;
  var occupiedPct = Math.round(
    (roomStats.occupied / totalRoomsForPct) * 100
  );
  var availablePct = Math.round(
    (roomStats.available / totalRoomsForPct) * 100
  );
  var maintRoomsPct = Math.round(
    (roomStats.maintenanceCount / totalRoomsForPct) * 100
  );

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
   
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="text-sm text-gray-600 mt-1">
            Overview of billing, occupancy and maintenance activity.
          </p>
        </div>
      </div>

      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <div className="text-xs font-semibold text-gray-500 uppercase">
            Total Billed
          </div>
          <div className="mt-3 text-2xl font-bold">
            {formatCurrency(billingStats.total)}
          </div>
        </Card>

        <Card>
          <div className="text-xs font-semibold text-gray-500 uppercase">
            Paid
          </div>
          <div className="mt-3 text-2xl font-bold text-green-600">
            {formatCurrency(billingStats.paid)}
          </div>
        </Card>

        <Card>
          <div className="text-xs font-semibold text-gray-500 uppercase">
            Pending + Overdue
          </div>
          <div className="mt-3 text-2xl font-bold text-amber-600">
            {formatCurrency(
              billingStats.pending + billingStats.overdue
            )}
          </div>
        </Card>

        <Card>
          <div className="text-xs font-semibold text-gray-500 uppercase">
            Rooms
          </div>
          <div className="mt-3 text-2xl font-bold">
            {roomStats.occupied}/{roomStats.total} occupied
          </div>
        </Card>
      </div>

     
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        <Card title="Monthly Revenue">
          {monthlyTotals.entries.length === 0 && (
            <div className="py-8 text-center text-xs text-gray-500">
              No billing data to display.
            </div>
          )}

          {monthlyTotals.entries.length > 0 && (
            <div className="h-52 flex items-end gap-3 mt-2">
              {monthlyTotals.entries.map(function (m) {
                var max = monthlyTotals.max || 1;
                var height = Math.max(
                  8,
                  Math.round((m.value / max) * 100)
                );
                return (
                  <div
                    key={m.label}
                    className="flex-1 flex flex-col items-center justify-end"
                  >
                    <div
                      className="w-8 rounded-t-lg bg-blue-500 flex items-end justify-center text-[10px] text-white pb-1"
                      style={{ height: height + "%" }}
                      title={formatCurrency(m.value)}
                    >
                      {m.value > 0
                        ? "₹" + (m.value / 1000).toFixed(1) + "k"
                        : ""}
                    </div>
                    <div className="mt-2 text-[11px] text-gray-600 text-center">
                      {m.label}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

       
        <Card title="Paid vs Pending">
          <div className="flex items-center gap-6 mt-2">
            <div
              className="w-28 h-28 rounded-full"
              style={{
                backgroundImage:
                  "conic-gradient(#16a34a 0 " +
                  paidPct +
                  "%,#f97316 " +
                  paidPct +
                  "% 100%)",
              }}
            >
              <div className="w-16 h-16 bg-white rounded-full m-6 flex items-center justify-center text-xs font-semibold">
                {paidPct}%
              </div>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-green-500" />
                <span>
                  Paid – {formatCurrency(billingStats.paid)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-amber-500" />
                <span>
                  Pending + Overdue –{" "}
                  {formatCurrency(
                    billingStats.pending + billingStats.overdue
                  )}
                </span>
              </div>
            </div>
          </div>
        </Card>

      
        <Card title="Room Availability">
          <div className="flex items-center gap-6 mt-2">
            <div
              className="w-28 h-28 rounded-full"
              style={{
                backgroundImage:
                  "conic-gradient(#0ea5e9 0 " +
                  occupiedPct +
                  "%,#22c55e " +
                  occupiedPct +
                  "% " +
                  (occupiedPct + availablePct) +
                  "%,#f97316 " +
                  (occupiedPct + availablePct) +
                  "% 100%)",
              }}
            >
              <div className="w-16 h-16 bg-white rounded-full m-6 flex items-center justify-center text-xs font-semibold">
                {occupiedPct}% occ
              </div>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-sky-500" />
                <span>Occupied – {roomStats.occupied}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-green-500" />
                <span>Available – {roomStats.available}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-amber-500" />
                <span>
                  Under Maintenance – {roomStats.maintenanceCount}
                </span>
              </div>
            </div>
          </div>
        </Card>
      </div>

     
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card title="Maintenance Status">
          <div className="mt-4 space-y-3 text-xs">
            {[
              {
                label: "Open",
                value: maintenanceStats.open,
                color: "bg-red-500",
              },
              {
                label: "In-progress",
                value: maintenanceStats.inProgress,
                color: "bg-amber-500",
              },
              {
                label: "Closed",
                value: maintenanceStats.closed,
                color: "bg-emerald-500",
              },
            ].map(function (row) {
              var total =
                maintenanceStats.open +
                  maintenanceStats.inProgress +
                  maintenanceStats.closed || 1;
              var pct = Math.round((row.value / total) * 100);

              return (
                <div key={row.label}>
                  <div className="flex justify-between mb-1">
                    <span>{row.label}</span>
                    <span>
                      {row.value} ({pct}%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className={"h-2 " + row.color}
                      style={{ width: pct + "%" }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </main>
  );
}
