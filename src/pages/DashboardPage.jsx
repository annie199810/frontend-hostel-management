import React, { useEffect, useState, useMemo } from "react";
import { useLocation } from "react-router-dom";
import Card from "../components/Card";
import StatusModal from "../components/StatusModal";
import { useAuth } from "../auth/AuthProvider";

const API_BASE = import.meta.env.VITE_API_BASE_URL;


function getAuthHeaders() {
  var headers = {};
  var token = localStorage.getItem("token");
  if (token) headers["Authorization"] = "Bearer " + token;
  return headers;
}

function formatCurrency(val) {
  if (!val) return "₹0";
  return "₹" + val.toLocaleString("en-IN");
}


export default function DashboardPage() {
  const { user } = useAuth();
  const location = useLocation();

  const [welcomeOpen, setWelcomeOpen] = useState(
    location.state?.justLoggedIn || false
  );

  const [rooms, setRooms] = useState([]);
  const [residents, setResidents] = useState([]);
  const [billing, setBilling] = useState([]);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    try {
      const [r1, r2, r3] = await Promise.all([
        fetch(API_BASE + "/api/rooms", { headers: getAuthHeaders() }),
        fetch(API_BASE + "/api/residents", { headers: getAuthHeaders() }),
        fetch(API_BASE + "/api/billing", { headers: getAuthHeaders() }),
      ]);

      const d1 = await r1.json();
      const d2 = await r2.json();
      const d3 = await r3.json();

      setRooms(d1.rooms || []);
      setResidents(d2.residents || []);
      setBilling(d3.payments || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

 
  const totalRooms = rooms.length;
  const occupied = rooms.filter(r => r.status === "occupied").length;
  const available = rooms.filter(r => r.status === "available").length;
  const occupancyRate = totalRooms
    ? Math.round((occupied * 100) / totalRooms)
    : 0;

  const revenue = billing.reduce(
    (sum, b) => (b.status === "Paid" ? sum + (b.amount || 0) : sum),
    0
  );

  const recentResidents = [...residents]
    .sort((a, b) => (b.checkIn || "").localeCompare(a.checkIn || ""))
    .slice(0, 5);

 
  const radius = 90;
  const stroke = 14;
  const circumference = 2 * Math.PI * radius;
  const progress = (occupancyRate / 100) * circumference;

 
  return (
    <main className="p-6 space-y-6 bg-gray-50 min-h-screen">
      <StatusModal
        open={welcomeOpen}
        type="success"
        message={`Welcome ${user?.name || "Admin"}`}
        onClose={() => setWelcomeOpen(false)}
      />

      <div>       
        <p className="text-sm text-gray-500">
          Here’s an overview of your hostel today.
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">Loading…</p>
      ) : (
        <>
       
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <div className="flex gap-4 items-center">
                <div className="p-3 rounded-xl bg-blue-100 text-xl">🏠</div>
                <div>
                  <p className="text-xs text-gray-500">TOTAL ROOMS</p>
                  <p className="text-2xl font-bold">{totalRooms}</p>
                  <p className="text-xs text-gray-400">
                    {occupied} occupied • {available} available
                  </p>
                </div>
              </div>
            </Card>

            <Card>
              <div className="flex gap-4 items-center">
                <div className="p-3 rounded-xl bg-green-100 text-xl">✅</div>
                <div>
                  <p className="text-xs text-gray-500">OCCUPIED</p>
                  <p className="text-2xl font-bold">{occupied}</p>
                  <p className="text-xs text-gray-400">
                    {occupancyRate}% occupancy
                  </p>
                </div>
              </div>
            </Card>

            <Card>
              <div className="flex gap-4 items-center">
                <div className="p-3 rounded-xl bg-sky-100 text-xl">🔓</div>
                <div>
                  <p className="text-xs text-gray-500">AVAILABLE</p>
                  <p className="text-2xl font-bold">{available}</p>
                  <p className="text-xs text-gray-400">0 maintenance</p>
                </div>
              </div>
            </Card>

            <Card>
              <div className="flex gap-4 items-center">
                <div className="p-3 rounded-xl bg-fuchsia-100 text-xl">💰</div>
                <div>
                  <p className="text-xs text-gray-500">MONTHLY REVENUE</p>
                  <p className="text-2xl font-bold text-fuchsia-700">
                    {formatCurrency(revenue)}
                  </p>
                </div>
              </div>
            </Card>
          </div>

          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
           
            <Card>
              <div className="flex justify-between mb-3">
                <h3 className="font-semibold">Recent Activities</h3>
                <span className="text-xs text-gray-400">
                  {recentResidents.length} items
                </span>
              </div>

              {recentResidents.map(r => (
                <div
                  key={r._id}
                  className="flex justify-between items-center py-2"
                >
                  <div className="flex gap-3 items-center">
                    <div className="p-2 rounded-full bg-blue-50">🙂</div>
                    <div>
                      <p className="text-sm font-medium">{r.name}</p>
                      <p className="text-xs text-gray-400">
                        Room {r.roomNumber} • Active
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400">
                    {r.checkIn || "—"}
                  </p>
                </div>
              ))}
            </Card>

          
            <Card>
              <h3 className="font-semibold mb-4">Occupancy Rate</h3>

              <div className="flex items-center gap-6">
                <svg width="220" height="220">
                  <circle
                    cx="110"
                    cy="110"
                    r={radius}
                    stroke="#e5e7eb"
                    strokeWidth={stroke}
                    fill="none"
                  />
                  <circle
                    cx="110"
                    cy="110"
                    r={radius}
                    stroke="#10b981"
                    strokeWidth={stroke}
                    fill="none"
                    strokeDasharray={`${progress} ${
                      circumference - progress
                    }`}
                    transform="rotate(-90 110 110)"
                  />
                  <text
                    x="110"
                    y="115"
                    textAnchor="middle"
                    fontSize="32"
                    fontWeight="700"
                  >
                    {occupancyRate}%
                  </text>
                  <text
                    x="110"
                    y="140"
                    textAnchor="middle"
                    fontSize="12"
                    fill="#6b7280"
                  >
                    occupied
                  </text>
                </svg>

                <div className="space-y-2 text-sm">
                  <p>🟢 Occupied: {occupied}</p>
                  <p>🔵 Available: {available}</p>
                  <p>🟠 Maintenance: 0</p>
                  <p className="text-xs text-gray-400">
                    Total rooms: {totalRooms}
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </>
      )}
    </main>
  );
}
