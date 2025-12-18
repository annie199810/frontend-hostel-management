import React, { useEffect, useState, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Card from "../components/Card";
import StatusModal from "../components/StatusModal";
import { useAuth } from "../auth/AuthProvider";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

/* ---------------- AUTH HEADERS ---------------- */

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

/* ---------------- HELPERS ---------------- */

function formatCurrency(amount) {
  if (!amount) return "₹0";
  return "₹" + (Number(amount) || 0).toLocaleString("en-IN");
}

/* ---------------- COMPONENT ---------------- */

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

  /* ---------------- LOAD DASHBOARD DATA ---------------- */

  function loadData() {
    setLoading(true);
    setError("");

    // ✅ FIXED: include auth headers
    const roomsPromise = fetch(API_BASE + "/api/rooms", {
      method: "GET",
      headers: getAuthHeaders(false),
    }).then(function (r) {
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

        if (!resRes.ok) throw new Error("Residents API error");
        if (!billRes.ok) throw new Error("Billing API error");

        // ✅ FIX: backend returns summary, convert to room-like array
        var summary = roomsRes || {};
        var fakeRooms = [];

        for (var i = 0; i < (summary.occupied || 0); i++) {
          fakeRooms.push({ status: "occupied" });
        }
        for (var j = 0; j < (summary.available || 0); j++) {
          fakeRooms.push({ status: "available" });
        }
        for (var k = 0; k < (summary.maintenance || 0); k++) {
          fakeRooms.push({ status: "maintenance" });
        }

        setRooms(fakeRooms);
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

  /* ---------------- CALCULATIONS ---------------- */

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
        else if (status === "pending" || status === "overdue")
          pending += amount;
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

  /* ---------------- UI ---------------- */

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

      <p className="text-sm text-slate-600">
        Here’s an overview of your hostel today.
      </p>

      {loading && (
        <div className="text-sm text-gray-500">Loading dashboard data…</div>
      )}
      {!loading && error && (
        <div className="text-sm text-red-600 mb-2">{error}</div>
      )}

      {/* CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card title="TOTAL ROOMS" value={totalRooms} />
        <Card title="OCCUPIED" value={occupiedRooms} />
        <Card title="AVAILABLE" value={availableRooms} />
        <Card
          title="MONTHLY REVENUE"
          value={formatCurrency(billingStats.paid)}
        />
      </div>

      {/* RECENT */}
      <Card title="Recent Activities">
        {recentResidents.length === 0 ? (
          <div className="text-xs text-gray-500">
            No recent resident activity.
          </div>
        ) : (
          recentResidents.map(function (r) {
            return (
              <div key={r._id} className="text-sm">
                {r.name} — Room {r.roomNumber}
              </div>
            );
          })
        )}
      </Card>
    </main>
  );
}
