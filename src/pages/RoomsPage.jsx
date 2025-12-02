
import React, { useEffect, useMemo, useState } from "react";
import Card from "../components/Card";

var API_BASE = import.meta.env.VITE_API_BASE_URL;


function StatusBadge(props) {
  var v = props.value || "";
  var cls =
    v === "occupied"
      ? "bg-emerald-50 text-emerald-700"
      : v === "maintenance"
      ? "bg-amber-50 text-amber-700"
      : "bg-sky-50 text-sky-700";

  return (
    <span className={"px-2 py-0.5 rounded-full text-xs font-medium " + cls}>
      {v === "occupied"
        ? "Occupied"
        : v === "maintenance"
        ? "Under maintenance"
        : "Available"}
    </span>
  );
}

export default function RoomsPage() {
  var [rooms, setRooms] = useState([]);
  var [loading, setLoading] = useState(true);
  var [error, setError] = useState("");

  var [search, setSearch] = useState("");
  var [statusFilter, setStatusFilter] = useState("all");
  var [typeFilter, setTypeFilter] = useState("all");

  
  var [showAssign, setShowAssign] = useState(false);
  var [assignRoom, setAssignRoom] = useState(null);
  var [assignForm, setAssignForm] = useState({
    name: "",
    phone: "",
    checkIn: "",
  });

  
  async function loadRooms() {
    try {
      setLoading(true);
      setError("");

      var res = await fetch(API_BASE + "/api/rooms");
      var json = await res.json();

      if (!res.ok || !json.ok) {
        throw new Error(json.error || "Failed to load rooms");
      }

      setRooms(json.rooms || []);
    } catch (err) {
    //  console.error("Error loading rooms:", err);
      setError("Failed to load rooms. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(function () {
    loadRooms();
  }, []);

  
  var totalRooms = rooms.length;
  var occupiedCount = rooms.filter(function (r) {
    return r.status === "occupied";
  }).length;
  var maintenanceCount = rooms.filter(function (r) {
    return r.status === "maintenance";
  }).length;
  var availableCount = totalRooms - occupiedCount - maintenanceCount;

  var filteredRooms = useMemo(
    function () {
      var text = (search || "").toLowerCase();

      return rooms.filter(function (r) {
        var matchSearch =
          !text ||
          (r.number && String(r.number).toLowerCase().indexOf(text) !== -1) ||
          (r.type && r.type.toLowerCase().indexOf(text) !== -1);

        var matchStatus =
          statusFilter === "all" || r.status === statusFilter;

        var matchType = typeFilter === "all" || r.type === typeFilter;

        return matchSearch && matchStatus && matchType;
      });
    },
    [rooms, search, statusFilter, typeFilter]
  );

  
  function openAssignModal(room) {
    setAssignRoom(room);
    setAssignForm({
      name: "",
      phone: "",
      checkIn: new Date().toISOString().slice(0, 10), 
    });
    setShowAssign(true);
  }

  function handleAssignChange(field, value) {
    setAssignForm(function (prev) {
      return { ...prev, [field]: value };
    });
  }

  async function handleAssignSubmit(e) {
    e.preventDefault();
    if (!assignRoom) return;

    if (!assignForm.name) {
      alert("Please enter resident name");
      return;
    }

    try {
   
      var res1 = await fetch(API_BASE + "/api/residents", {
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

      var json1 = await res1.json();
      if (!res1.ok || !json1.ok) {
        throw new Error(json1.error || "Failed to create resident");
      }

      var residentId = json1.resident._id;

      
      var res2 = await fetch(
        API_BASE + "/api/rooms/" + assignRoom._id + "/assign",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            residentId: residentId,
            checkInDate: assignForm.checkIn,
          }),
        }
      );

      var json2 = await res2.json();
      if (!res2.ok || !json2.ok) {
        throw new Error(json2.error || "Failed to assign room");
      }

      setShowAssign(false);
      setAssignRoom(null);
      setAssignForm({ name: "", phone: "", checkIn: "" });

      
      loadRooms();
    } catch (err) {
     // console.error("Assign error:", err);
      alert("Failed to assign room. See console for details.");
    }
  }

  
  async function handleCheckout(room) {
    if (!window.confirm("Checkout room " + room.number + "?")) return;

    try {
      var res = await fetch(
        API_BASE + "/api/rooms/" + room._id + "/checkout",
        { method: "POST" }
      );
      var json = await res.json();

      if (!res.ok || !json.ok) {
        throw new Error(json.error || "Failed to checkout room");
      }

      loadRooms();
    } catch (err) {
     // console.error("Checkout error:", err);
      alert("Failed to checkout room. See console for details.");
    }
  }

  
  return (
    <main className="p-6 space-y-6">
      
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-3xl font-bold">Room Management</h2>
          <p className="text-sm text-gray-600 mt-1">
            View and manage all hostel rooms, their status and rent details.
          </p>
        </div>

        <button
          onClick={loadRooms}
          className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50"
        >
          Refresh
        </button>
      </div>

     
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <p className="text-xs text-gray-500">TOTAL ROOMS</p>
          <p className="mt-2 text-2xl font-bold">{totalRooms}</p>
        </Card>
        <Card>
          <p className="text-xs text-gray-500">OCCUPIED</p>
          <p className="mt-2 text-2xl font-bold text-emerald-600">
            {occupiedCount}
          </p>
        </Card>
        <Card>
          <p className="text-xs text-gray-500">AVAILABLE</p>
          <p className="mt-2 text-2xl font-bold text-sky-600">
            {availableCount}
          </p>
        </Card>
        <Card>
          <p className="text-xs text-gray-500">UNDER MAINTENANCE</p>
          <p className="mt-2 text-2xl font-bold text-amber-600">
            {maintenanceCount}
          </p>
        </Card>
      </div>

      
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <input
            type="text"
            placeholder="Search by room number or type..."
            className="border px-3 py-2 rounded text-sm flex-1 min-w-[220px]"
            value={search}
            onChange={function (e) {
              setSearch(e.target.value);
            }}
          />

          <div className="flex gap-3 flex-wrap">
            <select
              className="border px-3 py-2 rounded text-sm"
              value={statusFilter}
              onChange={function (e) {
                setStatusFilter(e.target.value);
              }}
            >
              <option value="all">All Status</option>
              <option value="available">Available</option>
              <option value="occupied">Occupied</option>
              <option value="maintenance">Under maintenance</option>
            </select>

            <select
              className="border px-3 py-2 rounded text-sm"
              value={typeFilter}
              onChange={function (e) {
                setTypeFilter(e.target.value);
              }}
            >
              <option value="all">All Types</option>
              <option value="single">Single</option>
              <option value="double">Double</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="py-8 text-center text-gray-500 text-sm">
            Loading rooms...
          </div>
        ) : error ? (
          <div className="py-8 text-center text-red-600 text-sm">
            {error}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm border-t border-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-3 py-2 font-semibold">Room</th>
                  <th className="text-left px-3 py-2 font-semibold">Type</th>
                  <th className="text-left px-3 py-2 font-semibold">
                    Status
                  </th>
                  <th className="text-left px-3 py-2 font-semibold">
                    Rent / month
                  </th>
                  <th className="text-right px-3 py-2 font-semibold">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredRooms.length === 0 && (
                  <tr>
                    <td
                      colSpan="5"
                      className="px-3 py-4 text-center text-gray-500"
                    >
                      No rooms found.
                    </td>
                  </tr>
                )}

                {filteredRooms.map(function (room) {
                  return (
                    <tr key={room._id} className="border-t">
                      <td className="px-3 py-2">{room.number}</td>
                      <td className="px-3 py-2">
                        {(room.type || "").toUpperCase()}
                      </td>
                      <td className="px-3 py-2">
                        <StatusBadge value={room.status} />
                      </td>
                      <td className="px-3 py-2">
                        ₹{room.pricePerMonth || 0}
                      </td>
                      <td className="px-3 py-2 text-right space-x-2">
                        {room.status !== "occupied" && (
                          <button
                            onClick={function () {
                              openAssignModal(room);
                            }}
                            className="px-3 py-1 text-xs rounded bg-sky-600 text-white hover:bg-sky-700"
                          >
                            Assign
                          </button>
                        )}
                        {room.status === "occupied" && (
                          <button
                            onClick={function () {
                              handleCheckout(room);
                            }}
                            className="px-3 py-1 text-xs rounded bg-gray-900 text-white hover:bg-gray-800"
                          >
                            Checkout
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

  
      {showAssign && assignRoom && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-20">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                Assign Room {assignRoom.number}
              </h3>
              <button
                onClick={function () {
                  setShowAssign(false);
                }}
                className="text-gray-500 hover:text-gray-700 text-lg"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleAssignSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Resident name
                </label>
                <input
                  type="text"
                  className="border px-3 py-2 rounded w-full text-sm"
                  value={assignForm.name}
                  onChange={function (e) {
                    handleAssignChange("name", e.target.value);
                  }}
                  placeholder="e.g. Allen"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Phone (optional)
                </label>
                <input
                  type="text"
                  className="border px-3 py-2 rounded w-full text-sm"
                  value={assignForm.phone}
                  onChange={function (e) {
                    handleAssignChange("phone", e.target.value);
                  }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Check-in date
                </label>
                <input
                  type="date"
                  className="border px-3 py-2 rounded w-full text-sm"
                  value={assignForm.checkIn}
                  onChange={function (e) {
                    handleAssignChange("checkIn", e.target.value);
                  }}
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={function () {
                    setShowAssign(false);
                  }}
                  className="px-4 py-2 border rounded text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded text-sm"
                >
                  Assign Room
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
