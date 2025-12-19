import React, { useEffect, useMemo, useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

/* ===================== HELPERS ===================== */
function getAuthHeaders() {
  var headers = {};
  var token = localStorage.getItem("token");
  if (token) headers.Authorization = "Bearer " + token;
  return headers;
}

function StatusBadge({ value }) {
  var v = (value || "").toLowerCase();
  var cls =
    v === "occupied"
      ? "bg-sky-100 text-sky-700"
      : v === "available"
      ? "bg-emerald-100 text-emerald-700"
      : "bg-gray-100 text-gray-600";

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium ${cls}`}>
      {value}
    </span>
  );
}

/* ===================== PAGE ===================== */
export default function RoomPage() {
  var [rooms, setRooms] = useState([]);
  var [loading, setLoading] = useState(true);
  var [error, setError] = useState("");

  var [search, setSearch] = useState("");
  var [typeFilter, setTypeFilter] = useState("all");
  var [statusFilter, setStatusFilter] = useState("all");

  /* ===================== LOAD ROOMS ===================== */
  useEffect(function () {
    console.log("📦 Loading rooms...");
    fetch(API_BASE + "/api/rooms", {
      headers: getAuthHeaders(),
    })
      .then(function (res) {
        console.log("📡 Rooms response status:", res.status);
        return res.json();
      })
      .then(function (data) {
        console.log("✅ Rooms API data:", data);
        if (data && data.ok) {
          setRooms(data.rooms || []);
        } else {
          setError("Failed to load rooms");
        }
      })
      .catch(function (err) {
        console.error("❌ Rooms fetch error:", err);
        setError("Server not reachable");
      })
      .finally(function () {
        setLoading(false);
      });
  }, []);

  /* ===================== FILTER ===================== */
  var filteredRooms = useMemo(
    function () {
      return rooms.filter(function (r) {
        var matchSearch =
          !search ||
          r.number.toLowerCase().includes(search.toLowerCase()) ||
          r.type.toLowerCase().includes(search.toLowerCase());

        var matchType =
          typeFilter === "all" || r.type.toLowerCase() === typeFilter;

        var matchStatus =
          statusFilter === "all" || r.status.toLowerCase() === statusFilter;

        return matchSearch && matchType && matchStatus;
      });
    },
    [rooms, search, typeFilter, statusFilter]
  );

  /* ===================== UI ===================== */
  return (
    <main className="p-6 space-y-6">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Manage room inventory, availability and monthly pricing.
        </p>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
          + Add New Room
        </button>
      </div>

      {/* SEARCH + FILTER */}
      <div className="bg-white rounded-xl p-4 shadow space-y-4">
        <div className="flex flex-wrap gap-3">
          <input
            type="text"
            placeholder="Search by room number or type..."
            className="border px-3 py-2 rounded text-sm flex-1 min-w-[220px]"
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
          </select>

          <select
            className="border px-3 py-2 rounded text-sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="occupied">Occupied</option>
            <option value="available">Available</option>
          </select>
        </div>

        {/* TABLE */}
        {loading && (
          <p className="text-sm text-gray-500">Loading rooms…</p>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}

        {!loading && !error && (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm border-t">
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
                {filteredRooms.map(function (r) {
                  return (
                    <tr key={r._id} className="border-t">
                      <td className="px-3 py-2">{r.number}</td>
                      <td className="px-3 py-2 capitalize">{r.type}</td>
                      <td className="px-3 py-2">
                        <StatusBadge value={r.status} />
                      </td>
                      <td className="px-3 py-2 text-right">
                        ₹{r.pricePerMonth?.toLocaleString("en-IN")}
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
                        <button className="text-blue-600 text-xs hover:underline">
                          Edit
                        </button>
                        <button className="text-red-600 text-xs hover:underline">
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {filteredRooms.length === 0 && (
                  <tr>
                    <td
                      colSpan="7"
                      className="text-center py-4 text-gray-500"
                    >
                      No rooms found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
