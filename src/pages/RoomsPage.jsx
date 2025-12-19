import React, { useEffect, useMemo, useState } from "react";
import Card from "../components/Card";
import StatusModal from "../components/StatusModal";

var API_BASE = import.meta.env.VITE_API_BASE_URL || "";

console.log("API_BASE =", API_BASE);

/* ---------------- AUTH HEADERS ---------------- */
function getAuthHeaders(includeJson) {
  var headers = {};
  var token = null;

  try {
    token = localStorage.getItem("token");
  } catch (e) {
    console.error("Token read error", e);
  }

  if (includeJson) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers["Authorization"] = "Bearer " + token;
  }

  console.log("Request headers:", headers);
  return headers;
}

/* ---------------- STATUS BADGE ---------------- */
function RoomStatusBadge(props) {
  var v = (props.value || "").toLowerCase();

  var map = {
    available: "bg-emerald-50 text-emerald-700",
    occupied: "bg-sky-50 text-sky-700",
    maintenance: "bg-amber-50 text-amber-700",
  };

  return (
    <span className={"px-2 py-0.5 rounded-full text-xs " + (map[v] || "")}>
      {props.value || "-"}
    </span>
  );
}

/* ---------------- PAGE ---------------- */
export default function RoomPage() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [statusOpen, setStatusOpen] = useState(false);
  const [statusType, setStatusType] = useState("success");
  const [statusMessage, setStatusMessage] = useState("");

  /* ---------------- LOAD ROOMS ---------------- */
  function loadRooms() {
    console.log("📡 loadRooms() called");

    setLoading(true);
    setError("");

    fetch(API_BASE + "/api/rooms", {
      method: "GET",
      headers: {
        ...getAuthHeaders(false),
        "Cache-Control": "no-cache",
      },
    })
      .then((res) => {
        console.log("➡️ Rooms API status:", res.status);
        console.log("➡️ Response headers:", [...res.headers.entries()]);

        if (res.status === 304) {
          console.warn("⚠️ 304 received – no response body");
          return null;
        }

        return res.json();
      })
      .then((data) => {
        console.log("📦 Rooms API response:", data);

        if (!data) {
          console.warn("⚠️ No data returned from API");
          setRooms([]);
          return;
        }

        if (Array.isArray(data)) {
          console.log("✅ Rooms array length:", data.length);
          setRooms(data);
        } else if (data.rooms) {
          console.log("✅ Rooms from data.rooms:", data.rooms.length);
          setRooms(data.rooms);
        } else {
          console.error("❌ Unexpected response format:", data);
          setError("Invalid rooms response");
        }
      })
      .catch((err) => {
        console.error("❌ Fetch rooms failed:", err);
        setError("Failed to load rooms");
      })
      .finally(() => {
        console.log("🏁 loadRooms() finished");
        setLoading(false);
      });
  }

  /* ---------------- EFFECT ---------------- */
  useEffect(() => {
    console.log("🚀 RoomPage mounted");
    loadRooms();
  }, []);

  /* ---------------- FILTER ---------------- */
  const filteredRooms = useMemo(() => {
    console.log("🔄 Filtering rooms", rooms.length);
    return rooms;
  }, [rooms]);

  /* ---------------- UI ---------------- */
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
          <p className="text-sm text-gray-600">
            Manage room inventory, availability and pricing.
          </p>
          <button className="px-4 py-2 bg-blue-600 text-white rounded">
            + Add New Room
          </button>
        </div>

        <Card>
          {loading && (
            <div className="text-sm text-gray-500">Loading rooms…</div>
          )}

          {!loading && error && (
            <div className="text-sm text-red-600">{error}</div>
          )}

          {!loading && !error && (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm border">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left">Room</th>
                    <th className="px-3 py-2 text-left">Type</th>
                    <th className="px-3 py-2 text-left">Status</th>
                    <th className="px-3 py-2 text-right">Price</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRooms.length === 0 && (
                    <tr>
                      <td colSpan="4" className="text-center py-4">
                        No rooms found
                      </td>
                    </tr>
                  )}

                  {filteredRooms.map((r) => (
                    <tr key={r._id} className="border-t">
                      <td className="px-3 py-2">{r.number}</td>
                      <td className="px-3 py-2">{r.type}</td>
                      <td className="px-3 py-2">
                        <RoomStatusBadge value={r.status} />
                      </td>
                      <td className="px-3 py-2 text-right">
                        ₹{r.pricePerMonth}
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
