
import React, { useEffect, useState, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Card from "../components/Card";
import StatusModal from "../components/StatusModal";
import { useAuth } from "../auth/AuthProvider";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "";


function getAuthHeaders(includeJson) {
  var headers = {};
  var token = null;

  try {
    token = localStorage.getItem("token");
  } catch (e) {}

  if (includeJson) {
    headers["Content-Type"] = "application/json";
  }
  if (token) {
    headers["Authorization"] = "Bearer " + token;
  }
  return headers;
}

function formatCurrency(amount) {
  if (!amount) return "₹0";
  return "₹" + (Number(amount) || 0).toLocaleString("en-IN");
}

export default function DashboardPage() {
  const { user } = useAuth();

  const location = useLocation();
  const navigate = useNavigate();

  const initialWelcome =
    (location.state && location.state.justLoggedIn) || false;

  const [welcomeOpen, setWelcomeOpen] = useState(initialWelcome);

  useEffect(
    function () {
      if (initialWelcome) {
        navigate(location.pathname, { replace: true, state: {} });
      }
    },
    [initialWelcome, location.pathname, navigate]
  );

  const welcomeMessage =
    user && user.name
      ? "Welcome, " + user.name + "! You are now signed in."
      : "Welcome to the dashboard!";

  const [rooms, setRooms] = useState([]);
  const [residents, setResidents] = useState([]);
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(function () {
    loadData();
  }, []);

  function loadData() {
    setLoading(true);
    setError("");

    const roomsPromise = fetch(API_BASE + "/api/rooms").then(function (r) {
      return r.json();
    });

    const residentsPromise = fetch(API_BASE + "/api/residents", {
      method: "GET",
      headers: getAuthHeaders(false),
    }).then(function (r) {
      return r.json();
    });

    const billingPromise = fetch(API_BASE + "/api/billing", {
      method: "GET",
      headers: getAuthHeaders(false),
    }).then(function (r) {
      return r.json();
    });

    Promise.all([roomsPromise, residentsPromise, billingPromise])
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
        console.error("Dashboard load error:", err);
        if (
          String(err.message || "").indexOf("401") !== -1 ||
          String(err.message || "").toLowerCase().indexOf("unauthorized") !== -1
        ) {
          setError("Session expired or unauthorized. Please log in again.");
        } else {
          setError("Failed to load dashboard data.");
        }
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
        if (status === "paid") paid += amount;
        else if (status === "pending" || status === "overdue") pending += amount;
      });
      return { paid: paid, pending: pending, total: paid + pending };
    },
    [bills]
  );

  var recentResidents = useMemo(
    function () {
      var copy = (residents || []).slice();
      copy.sort(function (a, b) {
        var da = a.checkIn || "";
        var db = b.checkIn || "";
        return db.localeCompare(da);
      });
      return copy.slice(0, 5);
    },
    [residents]
  );

  
  var donutSize = 220;
  var stroke = 22;
  var radius = (donutSize - stroke) / 2;
  var circumference = 2 * Math.PI * radius;

  var segOccupied = occupiedRooms;
  var segAvailable = availableRooms;
  var segMaintenance = maintenanceRooms;
  var segTotal =
    segOccupied + segAvailable + segMaintenance || totalRooms || 1;

  var segOccPct = Math.round((segOccupied / segTotal) * 100) || 0;
  var segAvailPct = Math.round((segAvailable / segTotal) * 100) || 0;
  var segMaintPct = Math.max(0, 100 - segOccPct - segAvailPct);

  var dashOcc = (circumference * segOccupied) / segTotal;
  var dashAvail = (circumference * segAvailable) / segTotal;
  var dashMaint = (circumference * segMaintenance) / segTotal;

  var offsetOcc = 0;
  var offsetAvail = circumference - dashOcc;
  var offsetMaint = circumference - (dashOcc + dashAvail);

  return (
    <main className="p-4 sm:p-6 space-y-6">
    
      <StatusModal
        open={welcomeOpen}
        type="success"
        message={welcomeMessage}
        onClose={function () {
          setWelcomeOpen(false);
        }}
      />

      <div>
        <p className="text-sm text-slate-600 mt-1">
          Here’s an overview of your hostel today.
        </p>
      </div>

      {loading && (
        <div className="text-sm text-gray-500">Loading dashboard data…</div>
      )}
      {!loading && error && (
        <div className="text-sm text-red-600 mb-2">{error}</div>
      )}

    
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-md bg-blue-100 text-blue-600 text-2xl">
              🏠
            </div>
            <div>
              <div className="text-xs font-medium text-gray-500">
                TOTAL ROOMS
              </div>
              <div className="mt-2 text-3xl font-extrabold text-slate-900">
                {totalRooms}
              </div>
              <div className="mt-1 text-xs text-gray-500">
                {occupiedRooms} occupied • {availableRooms} available
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-md bg-emerald-100 text-emerald-600 text-2xl">
              ✅
            </div>
            <div>
              <div className="text-xs font-medium text-gray-500">OCCUPIED</div>
              <div className="mt-2 text-3xl font-extrabold text-emerald-600">
                {occupiedRooms}
              </div>
              <div className="mt-1 text-xs text-gray-500">
                {occupancyRate}% occupancy
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-md bg-sky-100 text-sky-600 text-2xl">
              🔓
            </div>
            <div>
              <div className="text-xs font-medium text-gray-500">
                AVAILABLE
              </div>
              <div className="mt-2 text-3xl font-extrabold text-sky-600">
                {availableRooms}
              </div>
              <div className="mt-1 text-xs text-gray-500">
                {maintenanceRooms} under maintenance
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-md bg-fuchsia-100 text-fuchsia-700 text-2xl">
              💰
            </div>
            <div>
              <div className="text-xs font-medium text-gray-500">
                MONTHLY REVENUE
              </div>
              <div className="mt-2 text-3xl font-extrabold text-fuchsia-700">
                {formatCurrency(billingStats.paid)}
              </div>
              <div className="mt-1 text-xs text-gray-500">
                Pending & overdue: {formatCurrency(billingStats.pending)}
              </div>
            </div>
          </div>
        </Card>
      </div>

     
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
       
        <Card>
          <div className="flex items-center justify-between">
            <div className="font-semibold mb-2 text-sm flex items-center gap-2">
              <span className="text-lg">⏱️</span> Recent Activities
            </div>
            <div className="text-xs text-slate-500">
              {recentResidents.length} items
            </div>
          </div>

          {recentResidents.length === 0 ? (
            <div className="text-xs text-gray-500">
              No recent resident activity.
            </div>
          ) : (
            <ul className="space-y-3 mt-2">
              {recentResidents.map(function (r) {
                var gender = String(r.gender || "").toLowerCase();
                var icon =
                  gender === "male"
                    ? "👨"
                    : gender === "female"
                    ? "👩"
                    : "🙂";
                return (
                  <li
                    key={r._id}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-md bg-blue-50 text-blue-600 text-lg">
                        {icon}
                      </div>
                      <div>
                        <div className="text-sm font-medium">{r.name}</div>
                        <div className="text-xs text-gray-500">
                          Room {r.roomNumber || "—"} •{" "}
                          {(r.status || "").charAt(0).toUpperCase() +
                            (r.status || "").slice(1)}
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-gray-400">
                      {r.checkIn || "—"}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

     
        <Card>
          <div className="font-semibold mb-3 text-sm">Occupancy Rate</div>

          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            <div
              style={{ width: donutSize, height: donutSize }}
              className="relative flex items-center justify-center"
            >
              <svg
                width={donutSize}
                height={donutSize}
                viewBox={"0 0 " + donutSize + " " + donutSize}
              >
                <g
                  transform={
                    "translate(" +
                    donutSize / 2 +
                    "," +
                    donutSize / 2 +
                    ")"
                  }
                >
                  <circle
                    r={radius}
                    fill="none"
                    stroke="#eef2f7"
                    strokeWidth={stroke}
                  />

                  {segOccupied > 0 && (
                    <circle
                      r={radius}
                      fill="none"
                      stroke="#10b981"
                      strokeWidth={stroke}
                      strokeDasharray={
                        dashOcc + " " + (circumference - dashOcc)
                      }
                      strokeDashoffset={offsetOcc}
                      strokeLinecap="round"
                      transform="rotate(-90)"
                    />
                  )}

                  {segAvailable > 0 && (
                    <circle
                      r={radius}
                      fill="none"
                      stroke="#06b6d4"
                      strokeWidth={stroke}
                      strokeDasharray={
                        dashAvail + " " + (circumference - dashAvail)
                      }
                      strokeDashoffset={offsetAvail}
                      strokeLinecap="round"
                      transform="rotate(-90)"
                    />
                  )}

                  {segMaintenance > 0 && (
                    <circle
                      r={radius}
                      fill="none"
                      stroke="#f59e0b"
                      strokeWidth={stroke}
                      strokeDasharray={
                        dashMaint + " " + (circumference - dashMaint)
                      }
                      strokeDashoffset={offsetMaint}
                      strokeLinecap="round"
                      transform="rotate(-90)"
                    />
                  )}
                </g>
              </svg>

              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-4xl font-extrabold">
                  {occupancyRate}%
                </div>
                <div className="text-sm text-gray-500 -mt-1">occupied</div>
              </div>
            </div>

            <div className="flex flex-col gap-3 w-full">
              <div className="flex items-center gap-3">
                <span className="inline-block w-3 h-3 rounded-full bg-emerald-500" />
                <div>
                  <div className="text-sm font-medium">Occupied</div>
                  <div className="text-xs text-gray-500">
                    {occupiedRooms} ({segOccPct}%)
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="inline-block w-3 h-3 rounded-full bg-sky-500" />
                <div>
                  <div className="text-sm font-medium">Available</div>
                  <div className="text-xs text-gray-500">
                    {availableRooms} ({segAvailPct}%)
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="inline-block w-3 h-3 rounded-full bg-amber-500" />
                <div>
                  <div className="text-sm font-medium">Maintenance</div>
                  <div className="text-xs text-gray-500">
                    {maintenanceRooms} ({segMaintPct}%)
                  </div>
                </div>
              </div>

              <div className="text-xs text-gray-500 mt-2">
                Total rooms: {totalRooms}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </main>
  );
}
