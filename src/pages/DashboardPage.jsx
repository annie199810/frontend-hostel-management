import React, { useEffect, useState, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Card from "../components/Card";
import StatusModal from "../components/StatusModal";
import { useAuth } from "../auth/AuthProvider";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

function getAuthHeaders() {
  var headers = {};
  var token = localStorage.getItem("token");

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
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [welcomeOpen, setWelcomeOpen] = useState(
    location.state?.justLoggedIn || false
  );

  const [rooms, setRooms] = useState([]);
  const [residents, setResidents] = useState([]);
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    try {
      setLoading(true);
      setError("");

      const [roomsRes, residentsRes, billingRes] = await Promise.all([
        fetch(API_BASE + "/api/rooms", { headers: getAuthHeaders() }),
        fetch(API_BASE + "/api/residents", { headers: getAuthHeaders() }),
        fetch(API_BASE + "/api/billing", { headers: getAuthHeaders() }),
      ]);

      if (
        roomsRes.status === 401 ||
        residentsRes.status === 401 ||
        billingRes.status === 401
      ) {
        logout();
        navigate("/login");
        return;
      }

      const roomsData = await roomsRes.json();
      const residentsData = await residentsRes.json();
      const billingData = await billingRes.json();

      setRooms(roomsData.rooms || []);
      setResidents(residentsData.residents || []);

      // ✅ FIX: backend returns `payments`
      setBills(billingData.payments || []);
    } catch (err) {
      console.error(err);
      setError("Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  }

  const totalRooms = rooms.length;

  const occupiedRooms = useMemo(
    () => rooms.filter((r) => r.status === "occupied").length,
    [rooms]
  );

  const availableRooms = useMemo(
    () => rooms.filter((r) => r.status === "available").length,
    [rooms]
  );

  const occupancyRate = totalRooms
    ? Math.round((occupiedRooms * 100) / totalRooms)
    : 0;

  const billingStats = useMemo(() => {
    let paid = 0;
    let pending = 0;

    bills.forEach((b) => {
      if (b.status === "Paid") paid += b.amount;
      else pending += b.amount;
    });

    return { paid, pending };
  }, [bills]);

  return (
    <main className="p-6 space-y-6">
      <StatusModal
        open={welcomeOpen}
        type="success"
        message={`Welcome ${user?.name || ""}`}
        onClose={() => setWelcomeOpen(false)}
      />

      {loading && <p>Loading dashboard…</p>}
      {error && <p className="text-red-600">{error}</p>}

      {!loading && !error && (
        <>
          <div className="grid md:grid-cols-4 gap-4">
            <Card title="TOTAL ROOMS" value={totalRooms} />
            <Card title="OCCUPIED" value={occupiedRooms} />
            <Card title="AVAILABLE" value={totalRooms - occupiedRooms} />
            <Card
              title="MONTHLY REVENUE"
              value={formatCurrency(billingStats.paid)}
            />
          </div>

          <Card>
            <h3 className="font-semibold mb-2">Occupancy Rate</h3>
            <p className="text-3xl font-bold">{occupancyRate}%</p>
          </Card>
        </>
      )}
    </main>
  );
}
