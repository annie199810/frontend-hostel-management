import React, { useEffect, useState, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Card from "../components/Card";
import StatusModal from "../components/StatusModal";
import { useAuth } from "../auth/AuthProvider";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

/* ---------- HELPERS ---------- */
function getAuthHeaders() {
  var headers = {};
  var token = localStorage.getItem("token");
  if (token) headers["Authorization"] = "Bearer " + token;
  return headers;
}

function formatCurrency(amount) {
  if (!amount) return "₹0";
  return "₹" + amount.toLocaleString("en-IN");
}

/* ---------- COMPONENT ---------- */
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

  /* ---------- LOAD DASHBOARD ---------- */
  useEffect(function () {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    try {
      setLoading(true);
      setError("");

      const roomsReq = fetch(API_BASE + "/api/rooms", {
        headers: getAuthHeaders(),
      });
      const residentsReq = fetch(API_BASE + "/api/residents", {
        headers: getAuthHeaders(),
      });
      const billingReq = fetch(API_BASE + "/api/billing", {
        headers: getAuthHeaders(),
      });

      const responses = await Promise.all([
        roomsReq,
        residentsReq,
        billingReq,
      ]);

      if (
        responses[0].status === 401 ||
        responses[1].status === 401 ||
        responses[2].status === 401
      ) {
        logout();
        navigate("/login");
        return;
      }

      const roomsData = await responses[0].json();
      const residentsData = await responses[1].json();
      const billingData = await responses[2].json();

      setRooms(roomsData.rooms || []);
      setResidents(residentsData.residents || []);
      setBills(billingData.payments || []);
    } catch (err) {
      console.error("Dashboard load error:", err);
      setError("Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  }

  /* ---------- STATS ---------- */
  const totalRooms = rooms.length;

  const occupiedRooms = useMemo(
    function () {
      return rooms.filter(function (r) {
        return r.status === "occupied";
      }).length;
    },
    [rooms]
  );

  const availableRooms = useMemo(
    function () {
      return rooms.filter(function (r) {
        return r.status === "available";
      }).length;
    },
    [rooms]
  );

  const maintenanceRooms = useMemo(
    function () {
      return rooms.filter(function (r) {
        return r.status === "maintenance";
      }).length;
    },
    [rooms]
  );

  const occupancyRate = totalRooms
    ? Math.round((occupiedRooms * 100) / totalRooms)
    : 0;

  const billingStats = useMemo(
    function () {
      var paid = 0;
      var pending = 0;

      bills.forEach(function (b) {
        if (b.status === "Paid") paid += b.amount || 0;
        else pending += b.amount || 0;
      });

      return { paid, pending };
    },
    [bills]
  );

  /* ---------- UI ---------- */
  return (
    <main className="p-4 sm:p-6 space-y-6 bg-gray-50 min-h-screen">
      <StatusModal
        open={welcomeOpen}
        type="success"
        message={`Welcome ${user?.name || ""}`}
        onClose={() => setWelcomeOpen(false)}
      />

      <div>
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-sm text-gray-500">
          Hostel Management Console
        </p>
      </div>

      {loading && (
        <p className="text-sm text-gray-500">Loading dashboard…</p>
      )}

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      {!loading && !error && (
        <>
          {/* TOP CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-lg text-blue-600 text-xl">
                  🏠
                </div>
                <div>
                  <div className="text-xs text-gray-500">TOTAL ROOMS</div>
                  <div className="text-2xl font-bold">{totalRooms}</div>
                </div>
              </div>
            </Card>

            <Card>
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 rounded-lg text-green-600 text-xl">
                  ✅
                </div>
                <div>
                  <div className="text-xs text-gray-500">OCCUPIED</div>
                  <div className="text-2xl font-bold">{occupiedRooms}</div>
                </div>
              </div>
            </Card>

            <Card>
              <div className="flex items-center gap-4">
                <div className="p-3 bg-sky-100 rounded-lg text-sky-600 text-xl">
                  🔓
                </div>
                <div>
                  <div className="text-xs text-gray-500">AVAILABLE</div>
                  <div className="text-2xl font-bold">{availableRooms}</div>
                </div>
              </div>
            </Card>

            <Card>
              <div className="flex items-center gap-4">
                <div className="p-3 bg-fuchsia-100 rounded-lg text-fuchsia-700 text-xl">
                  💰
                </div>
                <div>
                  <div className="text-xs text-gray-500">
                    MONTHLY REVENUE
                  </div>
                  <div className="text-2xl font-bold">
                    {formatCurrency(billingStats.paid)}
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* OCCUPANCY */}
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500">Occupancy Rate</div>
                <div className="text-4xl font-extrabold text-indigo-600 mt-1">
                  {occupancyRate}%
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  {maintenanceRooms} rooms under maintenance
                </div>
              </div>
              <div className="text-6xl">📊</div>
            </div>
          </Card>
        </>
      )}
    </main>
  );
}
