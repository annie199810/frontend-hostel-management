import React, { useEffect, useMemo, useState } from "react";
import Card from "../components/Card";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

function StatusBadge({ value }) {
  const v = (value || "").toLowerCase();
  const cls =
    v === "occupied"
      ? "bg-emerald-50 text-emerald-700"
      : v === "maintenance"
      ? "bg-amber-50 text-amber-700"
      : "bg-sky-50 text-sky-700";

  return (
    <span className={"px-2 py-0.5 rounded-full text-xs font-medium " + cls}>
      {v === "occupied" ? "Occupied" : v === "maintenance" ? "Under maintenance" : "Available"}
    </span>
  );
}

function StatCard({ icon, label, value, colorBg }) {
  return (
    <Card>
      <div className="flex items-center gap-4">
        <div className={`rounded-lg p-3 ${colorBg} flex items-center justify-center`} style={{ minWidth: 56 }}>
          <div className="text-2xl">{icon}</div>
        </div>
        <div>
          <div className="text-xs text-gray-500">{label}</div>
          <div className="mt-2 text-2xl font-bold text-slate-900">{value}</div>
        </div>
      </div>
    </Card>
  );
}

export default function RoomsPage() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  const [showAssign, setShowAssign] = useState(false);
  const [assignRoom, setAssignRoom] = useState(null);
  const [assignForm, setAssignForm] = useState({ name: "", phone: "", checkIn: "" });

  async function loadRooms() {
    try {
      setLoading(true);
      setError("");
      const res = await fetch(API_BASE + "/api/rooms");
      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.error || "Failed to load rooms");
      }
      setRooms(json.rooms || []);
    } catch (err) {
      setError("Failed to load rooms. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRooms();
  }, []);

  const totalRooms = rooms.length;
  const occupiedCount = rooms.filter((r) => (r.status || "").toLowerCase() === "occupied").length;
  const maintenanceCount = rooms.filter((r) => (r.status || "").toLowerCase() === "maintenance").length;
  const availableCount = totalRooms - occupiedCount - maintenanceCount;
  const occupancyRate = totalRooms ? Math.round((occupiedCount * 100) / totalRooms) : 0;

  const filteredRooms = useMemo(() => {
    const t = (search || "").toLowerCase();
    return rooms.filter((r) => {
      const matchSearch =
        !t ||
        (r.number && String(r.number).toLowerCase().includes(t)) ||
        (r.type && r.type.toLowerCase().includes(t)) ||
        (r.occupantName && r.occupantName.toLowerCase().includes(t));
      const matchStatus = statusFilter === "all" || (r.status || "").toLowerCase() === statusFilter;
      const matchType = typeFilter === "all" || (r.type || "").toLowerCase() === typeFilter;
      return matchSearch && matchStatus && matchType;
    });
  }, [rooms, search, statusFilter, typeFilter]);

  function openAssignModal(room) {
    setAssignRoom(room);
    setAssignForm({ name: "", phone: "", checkIn: new Date().toISOString().slice(0, 10) });
    setShowAssign(true);
  }

  function handleAssignChange(field, value) {
    setAssignForm((p) => ({ ...p, [field]: value }));
  }

  async function handleAssignSubmit(e) {
    e.preventDefault();
    if (!assignRoom) return;
    if (!assignForm.name) {
      alert("Please enter resident name");
      return;
    }
    try {
      const res1 = await fetch(API_BASE + "/api/residents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: assignForm.name,
          roomNumber: assignRoom.number,
          phone: assignForm.phone,
          status: "active",
          checkIn: assignForm.checkIn,
        }),
      });
      const json1 = await res1.json();
      if (!res1.ok || !json1.ok) throw new Error(json1.error || "Failed to create resident");
      const residentId = json1.resident._id;

      const res2 = await fetch(`${API_BASE}/api/rooms/${assignRoom._id}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ residentId, checkInDate: assignForm.checkIn }),
      });
      const json2 = await res2.json();
      if (!res2.ok || !json2.ok) throw new Error(json2.error || "Failed to assign room");

      setShowAssign(false);
      setAssignRoom(null);
      setAssignForm({ name: "", phone: "", checkIn: "" });
      loadRooms();
    } catch (err) {
      alert("Failed to assign room. See console for details.");
    }
  }

  async function handleCheckout(room) {
    if (!window.confirm("Checkout room " + room.number + "?")) return;
    try {
      const res = await fetch(`${API_BASE}/api/rooms/${room._id}/checkout`, { method: "POST" });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || "Failed to checkout room");
      loadRooms();
    } catch (err) {
      alert("Failed to checkout room. See console for details.");
    }
  }


  const donutSize = 110;
  const stroke = 14;
  const radius = (donutSize - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.max(0, Math.min(100, occupancyRate)) / 100) * circumference;

  return (
    <main className="p-6 space-y-6">
     

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon="🏠" label="TOTAL ROOMS" value={totalRooms} colorBg="bg-blue-50" />
        <StatCard icon="✅" label="OCCUPIED" value={occupiedCount} colorBg="bg-emerald-50" />
        <StatCard icon="🔓" label="AVAILABLE" value={availableCount} colorBg="bg-sky-50" />
        <StatCard icon="🛠️" label="UNDER MAINTENANCE" value={maintenanceCount} colorBg="bg-amber-50" />
      </div>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3 w-full lg:w-auto">
            <input
              type="text"
              placeholder="Search by room number, type, or occupant..."
              className="border px-3 py-2 rounded text-sm w-full lg:w-[420px]"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <select className="border px-3 py-2 rounded text-sm" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">All Status</option>
              <option value="available">Available</option>
              <option value="occupied">Occupied</option>
              <option value="maintenance">Under maintenance</option>
            </select>

            <select className="border px-3 py-2 rounded text-sm" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
              <option value="all">All Types</option>
              <option value="single">Single</option>
              <option value="double">Double</option>
            </select>
          </div>

          <div className="text-sm text-gray-500">{filteredRooms.length} results</div>
        </div>

        {loading ? (
          <div className="py-8 text-center text-gray-500 text-sm">Loading rooms...</div>
        ) : error ? (
          <div className="py-8 text-center text-red-600 text-sm">{error}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm border-t border-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold">Room</th>
                  <th className="text-left px-4 py-3 font-semibold">Type</th>
                  <th className="text-left px-4 py-3 font-semibold">Occupant</th>
                  <th className="text-left px-4 py-3 font-semibold">Status</th>
                  <th className="text-left px-4 py-3 font-semibold">Rent / month</th>
                  <th className="text-right px-4 py-3 font-semibold">Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredRooms.length === 0 && (
                  <tr>
                    <td colSpan="6" className="px-4 py-8 text-center text-gray-500">
                      No rooms found.
                    </td>
                  </tr>
                )}

                {filteredRooms.map((room) => (
                  <tr key={room._id} className="border-t even:bg-white odd:bg-white">
                    <td className="px-4 py-3 align-middle">{room.number}</td>
                    <td className="px-4 py-3 align-middle">{(room.type || "").toUpperCase()}</td>
                    <td className="px-4 py-3 align-middle">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-slate-50 flex items-center justify-center text-lg">
                          
                          {(room.occupantName && room.occupantName.charAt(0).toUpperCase()) || "—"}
                        </div>
                        <div>
                          <div className="text-sm font-medium">{room.occupantName || "—"}</div>
                          <div className="text-xs text-gray-500">{room.occupantPhone || ""}</div>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3 align-middle">
                      <StatusBadge value={room.status} />
                    </td>

                    <td className="px-4 py-3 align-middle">₹{room.pricePerMonth || 0}</td>

                    <td className="px-4 py-3 align-middle text-right space-x-2">
                      {room.status !== "occupied" ? (
                        <button onClick={() => openAssignModal(room)} className="px-3 py-1 text-xs rounded bg-sky-600 text-white hover:bg-sky-700">
                          Assign
                        </button>
                      ) : (
                        <button onClick={() => handleCheckout(room)} className="px-3 py-1 text-xs rounded bg-gray-900 text-white hover:bg-gray-800">
                          Checkout
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>


      {showAssign && assignRoom && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Assign Room {assignRoom.number}</h3>
              <button onClick={() => setShowAssign(false)} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
            </div>

            <form onSubmit={handleAssignSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Resident name</label>
                <input
                  type="text"
                  className="border px-3 py-2 rounded w-full text-sm"
                  value={assignForm.name}
                  onChange={(e) => handleAssignChange("name", e.target.value)}
                  placeholder="e.g. Allen"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Phone (optional)</label>
                <input
                  type="text"
                  className="border px-3 py-2 rounded w-full text-sm"
                  value={assignForm.phone}
                  onChange={(e) => handleAssignChange("phone", e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Check-in date</label>
                <input
                  type="date"
                  className="border px-3 py-2 rounded w-full text-sm"
                  value={assignForm.checkIn}
                  onChange={(e) => handleAssignChange("checkIn", e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowAssign(false)} className="px-4 py-2 border rounded text-sm">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded text-sm">Assign Room</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
