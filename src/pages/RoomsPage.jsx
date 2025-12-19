import React, { useEffect, useMemo, useState } from "react";
import Card from "../components/Card";
import StatusModal from "../components/StatusModal";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

/* ---------------- AUTH HEADERS ---------------- */
function getAuthHeaders(includeJson) {
  var headers = {};
  var token = localStorage.getItem("token");

  if (includeJson) headers["Content-Type"] = "application/json";
  if (token) headers["Authorization"] = "Bearer " + token;

  return headers;
}

/* ---------------- STATUS BADGE ---------------- */
function RoomStatusBadge({ value }) {
  var v = (value || "").toLowerCase();

  var map = {
    available: "bg-green-100 text-green-700",
    occupied: "bg-blue-100 text-blue-700",
    maintenance: "bg-yellow-100 text-yellow-700",
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${map[v]}`}>
      {value}
    </span>
  );
}

/* ================= ROOM PAGE ================= */
export default function RoomPage() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [statusOpen, setStatusOpen] = useState(false);
  const [statusType, setStatusType] = useState("success");
  const [statusMessage, setStatusMessage] = useState("");

  function showStatus(type, message) {
    setStatusType(type);
    setStatusMessage(message);
    setStatusOpen(true);
  }

  /* ---------------- LOAD ROOMS ---------------- */
  useEffect(() => {
    loadRooms();
  }, []);

  function loadRooms() {
    console.log("🔄 Loading rooms...");
    setLoading(true);
    setError("");

    fetch(API_BASE + "/api/rooms", {
      method: "GET",
      headers: getAuthHeaders(false),
    })
      .then((res) => {
        console.log("📡 Rooms response status:", res.status);
        return res.json();
      })
      .then((data) => {
        console.log("📦 Rooms API data:", data);

        // ✅ FIX: check rooms array directly
        if (data && Array.isArray(data.rooms)) {
          setRooms(data.rooms);
          console.log("✅ Rooms set in state:", data.rooms.length);
        } else {
          console.error("❌ Invalid rooms response format");
          setError("Failed to load rooms");
        }
      })
      .catch((err) => {
        console.error("❌ Fetch error:", err);
        setError("Cannot reach server");
      })
      .finally(() => {
        setLoading(false);
      });
  }

  /* ---------------- FILTER ---------------- */
  const filteredRooms = useMemo(() => {
    return rooms.filter((r) => {
      const matchSearch =
        !search ||
        r.number.toLowerCase().includes(search.toLowerCase()) ||
        r.type.toLowerCase().includes(search.toLowerCase());

      const matchType =
        typeFilter === "all" || r.type === typeFilter;

      const matchStatus =
        statusFilter === "all" || r.status === statusFilter;

      return matchSearch && matchType && matchStatus;
    });
  }, [rooms, search, typeFilter, statusFilter]);

  /* ================= UI ================= */
  return (
    <>
      <StatusModal
        open={statusOpen}
        type={statusType}
        message={statusMessage}
        onClose={() => setStatusOpen(false)}
      />

      <main className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <p className="text-gray-600">
            Manage room inventory, availability and monthly pricing.
          </p>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg">
            + Add New Room
          </button>
        </div>

        <Card>
          <div className="flex gap-3 flex-wrap mb-4">
            <input
              type="text"
              placeholder="Search by room number or type..."
              className="border px-3 py-2 rounded text-sm flex-1"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <select
              className="border px-3 py-2 rounded text-sm"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="all">All Types</option>
              <option value="single">Single</option>
              <option value="double">Double</option>
              <option value="dorm">Dorm</option>
            </select>

            <select
              className="border px-3 py-2 rounded text-sm"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="available">Available</option>
              <option value="occupied">Occupied</option>
              <option value="maintenance">Maintenance</option>
            </select>
          </div>

          {loading && (
            <p className="text-gray-500 text-sm">Loading rooms…</p>
          )}

          {!loading && error && (
            <p className="text-red-600 text-sm">{error}</p>
          )}

          {!loading && !error && (
            <div className="overflow-x-auto">
              <table className="min-w-full border-t text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left">Room No</th>
                    <th className="px-3 py-2 text-left">Type</th>
                    <th className="px-3 py-2 text-left">Status</th>
                    <th className="px-3 py-2 text-right">Price / Month</th>
                    <th className="px-3 py-2 text-center">Occupants</th>
                    <th className="px-3 py-2 text-left">Created At</th>
                    <th className="px-3 py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRooms.map((r) => (
                    <tr key={r._id} className="border-t">
                      <td className="px-3 py-2">{r.number}</td>
                      <td className="px-3 py-2 capitalize">{r.type}</td>
                      <td className="px-3 py-2">
                        <RoomStatusBadge value={r.status} />
                      </td>
                      <td className="px-3 py-2 text-right">
                        ₹{r.pricePerMonth.toLocaleString("en-IN")}
                      </td>
                      <td className="px-3 py-2 text-center">
                        {r.occupants?.length || 0}
                      </td>
                      <td className="px-3 py-2 text-gray-600">
                        {r.createdAt
                          ? new Date(r.createdAt).toLocaleDateString()
                          : "—"}
                      </td>
                      <td className="px-3 py-2 text-right space-x-2">
                        <button className="text-blue-600 text-xs">Edit</button>
                        <button className="text-red-600 text-xs">Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </main>
    </>
  );
}
