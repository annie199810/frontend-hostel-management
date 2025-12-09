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
  return "₹" + amount.toLocaleString("en-IN");
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

  useEffect(() => {
    loadData();
  }, []);

  function loadData() {
    setLoading(true);
    setError("");

    const authHeaders = getAuthHeaders(false);

    Promise.all([
      
      fetch(API_BASE + "/api/rooms").then((r) => r.json()),
      
      fetch(API_BASE + "/api/residents", {
        headers: authHeaders,
      }).then((r) => r.json()),
    
      fetch(API_BASE + "/api/billing", {
        headers: authHeaders,
      }).then((r) => r.json()),
    ])
      .then((results) => {
        const roomsRes = results[0] || {};
        const resRes = results[1] || {};
        const billRes = results[2] || {};

        if (!roomsRes.ok) throw new Error("Rooms API error");
        if (!resRes.ok) throw new Error("Residents API error");
        if (!billRes.ok) throw new Error("Billing API error");

        setRooms(roomsRes.rooms || []);
        setResidents(resRes.residents || []);
        setBills(billRes.payments || []);
      })
      .catch((err) => {
        console.error("Dashboard load error:", err);
        setError("Failed to load dashboard data.");
      })
      .finally(() => {
        setLoading(false);
      });
  }

  const totalRooms = rooms.length;

  const occupiedRooms = useMemo(
    () =>
      rooms.filter((r) =>
        String(r.status || "").toLowerCase().includes("occupied")
      ).length,
    [rooms]
  );

  const availableRooms = useMemo(
    () =>
      rooms.filter((r) =>
        String(r.status || "").toLowerCase().includes("available")
      ).length,
    [rooms]
  );

  const maintenanceRooms = useMemo(
    () =>
      rooms.filter((r) =>
        String(r.status || "").toLowerCase().includes("maintenance")
      ).length,
    [rooms]
  );

  const occupancyRate = totalRooms
    ? Math.round((occupiedRooms * 100) / totalRooms)
    : 0;

  const billingStats = useMemo(() => {
    let paid = 0,
      pending = 0;
    (bills || []).forEach((b) => {
      const status = String(b.status || "").toLowerCase();
      const amount = Number(b.amount) || 0;
      if (status === "paid") paid += amount;
      else if (status === "pending" || status === "overdue") pending += amount;
    });
    return { paid, pending, total: paid + pending };
  }, [bills]);

  const recentResidents = useMemo(() => {
    const copy = (residents || []).slice();
    copy.sort((a, b) => {
      const da = a.checkIn || "";
      const db = b.checkIn || "";
      return db.localeCompare(da);
    });
    return copy.slice(0, 5);
  }, [residents]);

  
  const donutSize = 220;
  const stroke = 22;
  const radius = (donutSize - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  const segOccupied = occupiedRooms;
  const segAvailable = availableRooms;
  const segMaintenance = maintenanceRooms;
  const segTotal =
    segOccupied + segAvailable + segMaintenance || totalRooms || 1;

  const segOccPct = Math.round((segOccupied / segTotal) * 100) || 0;
  const segAvailPct = Math.round((segAvailable / segTotal) * 100) || 0;
  const segMaintPct = Math.max(0, 100 - segOccPct - segAvailPct);

  const dashOcc = (circumference * segOccupied) / segTotal;
  const dashAvail = (circumference * segAvailable) / segTotal;
  const dashMaint = (circumference * segMaintenance) / segTotal;

  const offsetOcc = 0;
  const offsetAvail = circumference - dashOcc;
  const offsetMaint = circumference - (dashOcc + dashAvail);

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
      {error && <div className="text-sm text-red-600 mb-2">{error}</div>}

      
    </main>
  );
}
