import React, { useEffect, useMemo, useState } from "react";
import Card from "../components/Card";
import StatusModal from "../components/StatusModal";

var API_BASE = import.meta.env.VITE_API_BASE_URL || "";

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

  // 🔥 IMPORTANT: disable cache
  headers["Cache-Control"] = "no-cache";

  return headers;
}

function RoomStatusBadge(props) {
  var v = (props.value || "").toLowerCase();

  var map = {
    available: "bg-emerald-50 text-emerald-700",
    occupied: "bg-sky-50 text-sky-700",
    maintenance: "bg-amber-50 text-amber-700",
  };

  var cls = map[v] || "bg-gray-100 text-gray-600";

  return (
    <span className={"px-2 py-0.5 rounded-full text-xs font-medium " + cls}>
      {props.value || "-"}
    </span>
  );
}

export default function RoomManagementPage() {
  var [rooms, setRooms] = useState([]);
  var [loading, setLoading] = useState(true);
  var [error, setError] = useState("");

  var [search, setSearch] = useState("");
  var [statusFilter, setStatusFilter] = useState("all");
  var [typeFilter, setTypeFilter] = useState("all");

  var [statusOpen, setStatusOpen] = useState(false);
  var [statusType, setStatusType] = useState("success");
  var [statusMessage, setStatusMessage] = useState("");

  function showStatus(type, message) {
    setStatusType(type);
    setStatusMessage(message);
    setStatusOpen(true);
  }

  useEffect(function () {
    loadRooms();
  }, []);

  // ✅ FIXED LOAD ROOMS
  function loadRooms() {
    setLoading(true);
    setError("");

    fetch(API_BASE + "/api/rooms", {
      method: "GET",
      headers: getAuthHeaders(false),
    })
      .then(function (res) {
        // ✅ Accept 200 & 304
        if (res.status === 401) {
          throw new Error("Unauthorized");
        }

        if (res.status === 304) {
          return { ok: true, rooms: rooms }; // keep existing
        }

        if (!res.ok) {
          throw new Error("Failed to load rooms");
        }

        return res.json();
      })
      .then(function (data) {
        if (data && data.ok) {
          setRooms(data.rooms || []);
        } else {
          setError(data?.error || "Failed to load rooms");
        }
      })
      .catch(function (err) {
        console.error(err);
        setError("Failed to load rooms");
      })
      .finally(function () {
        setLoading(false);
      });
  }

  var filteredRooms = useMemo(
    function () {
      var text = (search || "").toLowerCase();

      return (rooms || []).filter(function (r) {
        var matchSearch =
          !text ||
          (r.number || "").toLowerCase().includes(text) ||
          (r.type || "").toLowerCase().includes(text);

        var matchStatus =
          statusFilter === "all" ||
          (r.status || "").toLowerCase() === statusFilter;

        var matchType =
          typeFilter === "all" ||
          (r.type || "").toLowerCase() === typeFilter;

        return matchSearch && matchStatus && matchType;
      });
    },
    [rooms, search, statusFilter, typeFilter]
  );

  return (
    <>
      <StatusModal
        open={statusOpen}
        type={statusType}
        message={statusMessage}
        onClose={function () {
          setStatusOpen(false);
        }}
      />

      <main className="p-4 sm:p-6 space-y-6">
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
                value={typeFilter}
                onChange={function (e) {
                  setTypeFilter(e.target.value);
                }}
              >
                <option value="all">All Types</option>
                <option value="single">Single</option>
                <option value="double">Double</option>
                <option value="dorm">Dorm</option>
              </select>

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
                <option value="maintenance">Maintenance</option>
              </select>
            </div>
          </div>

          {loading && (
            <div className="px-3 py-6 text-sm text-gray-500">
              Loading rooms…
            </div>
          )}

          {!loading && error && (
            <div className="px-3 py-4 text-sm text-red-600">{error}</div>
          )}

          {!loading && !error && (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm border-t border-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left">Room No</th>
                    <th className="px-3 py-2 text-left">Type</th>
                    <th className="px-3 py-2 text-left">Status</th>
                    <th className="px-3 py-2 text-right">Price / Month</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRooms.length === 0 && (
                    <tr>
                      <td colSpan="4" className="px-3 py-4 text-center text-gray-500">
                        No rooms found.
                      </td>
                    </tr>
                  )}

                  {filteredRooms.map(function (row) {
                    return (
                      <tr key={row._id} className="border-t">
                        <td className="px-3 py-2">{row.number}</td>
                        <td className="px-3 py-2 capitalize">{row.type}</td>
                        <td className="px-3 py-2">
                          <RoomStatusBadge value={row.status} />
                        </td>
                        <td className="px-3 py-2 text-right">
                          ₹{row.pricePerMonth?.toLocaleString("en-IN")}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </main>
    </>
  );
}
