
import React, { useEffect, useState, useMemo } from "react";
import Card from "../components/Card";

var API_BASE = import.meta.env.VITE_API_BASE_URL;


function formatCurrency(amount) {
  if (!amount) return "₹0";
  
  return "₹" + amount.toLocaleString("en-IN");
}

export default function DashboardPage() {
  var [rooms, setRooms] = useState([]);
  var [residents, setResidents] = useState([]);
  var [bills, setBills] = useState([]);
  var [loading, setLoading] = useState(true);
  var [error, setError] = useState("");

  useEffect(function () {
    loadData();
  }, []);

  function loadData() {
    setLoading(true);
    setError("");

    Promise.all([
      fetch(API_BASE + "/api/rooms").then(function (r) {
        return r.json();
      }),
      fetch(API_BASE + "/api/residents").then(function (r) {
        return r.json();
      }),
      
      fetch(API_BASE + "/api/billing").then(function (r) {
        return r.json();
      }),
    ])
      .then(function (results) {
        var roomsRes = results[0] || {};
        var resRes = results[1] || {};
        var billRes = results[2] || {};

        if (!roomsRes.ok) throw new Error("Rooms API error");
        if (!resRes.ok) throw new Error("Residents API error");
        if (!billRes.ok) throw new Error("Billing API error");

        setRooms(roomsRes.rooms || []);
setResidents(resRes.residents || []);
setBills(billRes.payments || []);  

      })
      .catch(function (err) {
       // console.error("Dashboard load error:", err);
        setError("Failed to load dashboard data.");
      })
      .finally(function () {
        setLoading(false);
      });
  }

  

  var totalRooms = rooms.length;

  var occupiedRooms = useMemo(
    function () {
      return rooms.filter(function (r) {
        return String(r.status || "")
          .toLowerCase()
          .indexOf("occupied") !== -1;
      }).length;
    },
    [rooms]
  );

  var availableRooms = useMemo(
    function () {
      return rooms.filter(function (r) {
        return String(r.status || "")
          .toLowerCase()
          .indexOf("available") !== -1;
      }).length;
    },
    [rooms]
  );

  var maintenanceRooms = useMemo(
    function () {
      return rooms.filter(function (r) {
        return String(r.status || "")
          .toLowerCase()
          .indexOf("maintenance") !== -1;
      }).length;
    },
    [rooms]
  );

  var occupancyRate = totalRooms
    ? Math.round((occupiedRooms * 100) / totalRooms)
    : 0;

 
  var billingStats = useMemo(
    function () {
      var paid = 0;
      var pending = 0;

      (bills || []).forEach(function (b) {
        var status = String(b.status || "").toLowerCase();
        var amount = Number(b.amount) || 0;

        if (status === "paid") {
          paid += amount;
        } else if (status === "pending" || status === "overdue") {
          pending += amount;
        }
      });

      return {
        paid: paid,
        pending: pending,
        total: paid + pending,
      };
    },
    [bills]
  );

  var totalBilled = billingStats.total;
  var totalPaid = billingStats.paid;
  var totalPending = billingStats.pending;

  
  var recentResidents = useMemo(
    function () {
      var copy = (residents || []).slice();
     
      copy.sort(function (a, b) {
        var da = a.checkIn || "";
        var db = b.checkIn || "";
        return db.localeCompare(da);
      });
      return copy.slice(0, 3);
    },
    [residents]
  );

  return (
    <main className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-sm text-gray-600 mt-1">
            Overview of rooms, residents and billing.
          </p>
        </div>

        <button
          onClick={loadData}
          className="px-3 py-2 text-sm rounded-lg border bg-white shadow-sm hover:bg-gray-50"
        >
          Refresh
        </button>
      </div>

      {loading && (
        <div className="text-sm text-gray-500">Loading dashboard data…</div>
      )}
      {error && (
        <div className="text-sm text-red-600 mb-2">
          {error}
        </div>
      )}

     
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <div className="text-xs font-medium text-gray-500">TOTAL ROOMS</div>
          <div className="mt-2 text-3xl font-bold">{totalRooms}</div>
          <div className="mt-1 text-xs text-gray-500">
            {occupiedRooms} occupied • {availableRooms} available
          </div>
        </Card>

        <Card>
          <div className="text-xs font-medium text-gray-500">OCCUPIED</div>
          <div className="mt-2 text-3xl font-bold text-emerald-600">
            {occupiedRooms}
          </div>
          <div className="mt-1 text-xs text-gray-500">
            {occupancyRate}% occupancy
          </div>
        </Card>

        <Card>
          <div className="text-xs font-medium text-gray-500">AVAILABLE</div>
          <div className="mt-2 text-3xl font-bold text-blue-600">
            {availableRooms}
          </div>
          <div className="mt-1 text-xs text-gray-500">
            {maintenanceRooms} under maintenance
          </div>
        </Card>

        <Card>
          <div className="text-xs font-medium text-gray-500">
            MONTHLY REVENUE
          </div>
          <div className="mt-2 text-3xl font-bold text-fuchsia-700">
            {formatCurrency(totalPaid)}
          </div>
          <div className="mt-1 text-xs text-gray-500">
            Pending &amp; overdue: {formatCurrency(totalPending)}
          </div>
        </Card>
      </div>

      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <div className="font-semibold mb-3 text-sm">Recent Activities</div>
          {recentResidents.length === 0 && (
            <div className="text-xs text-gray-500">
              No recent resident activity.
            </div>
          )}
          <ul className="space-y-2">
            {recentResidents.map(function (r) {
              return (
                <li key={r._id} className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">{r.name}</div>
                    <div className="text-xs text-gray-500">
                      Room {r.roomNumber || "—"} •{" "}
                      {(r.status || "").charAt(0).toUpperCase() +
                        (r.status || "").slice(1)}
                    </div>
                  </div>
                  <div className="text-xs text-gray-400">
                    {r.checkIn || "—"}
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>

        <Card>
          <div className="font-semibold mb-3 text-sm">Occupancy Rate</div>
          <div className="flex items-center justify-center h-40">
            <div className="relative">

              <div className="w-28 h-28 rounded-full bg-gray-100 flex items-center justify-center">
                <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center text-sm font-semibold">
                  {occupancyRate || 0}% occ
                </div>
              </div>
            </div>
          </div>
          <div className="flex justify-center gap-4 text-xs mt-2">
            <span className="flex items-center gap-1">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
              Occupied – {occupiedRooms}
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block w-2 h-2 rounded-full bg-blue-500" />
              Available – {availableRooms}
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block w-2 h-2 rounded-full bg-amber-500" />
              Maintenance – {maintenanceRooms}
            </span>
          </div>
        </Card>
      </div>
    </main>
  );
}
