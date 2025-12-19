import React, { useEffect, useMemo, useState } from "react";
import Card from "../components/Card";
import StatusModal from "../components/StatusModal";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

/* ---------------- AUTH HEADERS ---------------- */
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

/* ---------------- STATUS BADGE ---------------- */
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

/* ---------------- DELETE CONFIRM MODAL ---------------- */
function ConfirmModal(props) {
  if (!props.open) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center px-4 modal-backdrop">
      <div className="bg-white w-full max-w-sm rounded-xl shadow-lg p-6 text-center">
        <div className="text-red-600 text-4xl mb-3">⚠</div>
        <h2 className="text-lg font-semibold mb-2">Delete Room</h2>
        <p className="text-gray-600 mb-4">{props.message}</p>

        <div className="flex justify-center gap-3">
          <button
            onClick={props.onCancel}
            className="px-4 py-2 border rounded text-sm"
          >
            Cancel
          </button>
          <button
            onClick={props.onConfirm}
            className="px-4 py-2 bg-red-600 text-white rounded text-sm"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

/* ================= MAIN PAGE ================= */
export default function RoomManagementPage() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState("add");
  const [formData, setFormData] = useState({
    _id: null,
    number: "",
    type: "single",
    status: "available",
    pricePerMonth: "",
  });

  const [statusOpen, setStatusOpen] = useState(false);
  const [statusType, setStatusType] = useState("success");
  const [statusMessage, setStatusMessage] = useState("");

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [roomToDelete, setRoomToDelete] = useState(null);

  function showStatus(type, message) {
    setStatusType(type);
    setStatusMessage(message);
    setStatusOpen(true);
  }

  /* ---------------- LOAD ROOMS (FIXED) ---------------- */
  useEffect(() => {
    loadRooms();
  }, []);

  function loadRooms() {
    setLoading(true);
    setError("");

    fetch(API_BASE + "/api/rooms", {
      headers: getAuthHeaders(false),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed");
        return res.json();
      })
      .then((data) => {
        // ✅ BACKEND RETURNS ARRAY
        if (Array.isArray(data)) {
          setRooms(data);
        } else {
          setError("Failed to load rooms");
        }
      })
      .catch(() => {
        setError("Failed to load rooms");
      })
      .finally(() => {
        setLoading(false);
      });
  }

  /* ---------------- FILTER ---------------- */
  const filteredRooms = useMemo(() => {
    const text = search.toLowerCase();

    return rooms.filter((r) => {
      const matchSearch =
        !text ||
        r.number?.toLowerCase().includes(text) ||
        r.type?.toLowerCase().includes(text);

      const matchStatus =
        statusFilter === "all" || r.status === statusFilter;

      const matchType =
        typeFilter === "all" || r.type === typeFilter;

      return matchSearch && matchStatus && matchType;
    });
  }, [rooms, search, statusFilter, typeFilter]);

  /* ---------------- ADD / EDIT ---------------- */
  function openAddForm() {
    setFormMode("add");
    setFormData({
      _id: null,
      number: "",
      type: "single",
      status: "available",
      pricePerMonth: "",
    });
    setShowForm(true);
  }

  function openEditForm(row) {
    setFormMode("edit");
    setFormData({
      _id: row._id,
      number: row.number,
      type: row.type,
      status: row.status,
      pricePerMonth: row.pricePerMonth,
    });
    setShowForm(true);
  }

  function handleFormChange(field, value) {
    setFormData((p) => ({ ...p, [field]: value }));
  }

  function handleFormSubmit(e) {
    e.preventDefault();

    const payload = {
      number: formData.number,
      type: formData.type,
      status: formData.status,
      pricePerMonth: Number(formData.pricePerMonth),
    };

    const url =
      formMode === "add"
        ? API_BASE + "/api/rooms"
        : API_BASE + "/api/rooms/" + formData._id;

    const method = formMode === "add" ? "POST" : "PUT";

    fetch(url, {
      method,
      headers: getAuthHeaders(true),
      body: JSON.stringify(payload),
    })
      .then((r) => r.json())
      .then(() => {
        setShowForm(false);
        loadRooms();
        showStatus("success", "Room saved successfully");
      })
      .catch(() => {
        showStatus("error", "Failed to save room");
      });
  }

  /* ---------------- DELETE ---------------- */
  function handleConfirmDelete() {
    fetch(API_BASE + "/api/rooms/" + roomToDelete._id, {
      method: "DELETE",
      headers: getAuthHeaders(false),
    })
      .then(() => {
        loadRooms();
        showStatus("success", "Room deleted");
      })
      .catch(() => {
        showStatus("error", "Failed to delete room");
      })
      .finally(() => {
        setDeleteOpen(false);
        setRoomToDelete(null);
      });
  }

  /* ================= UI ================= */
  return (
    <>
      <StatusModal
        open={statusOpen}
        type={statusType}
        message={statusMessage}
        onClose={() => setStatusOpen(false)}
      />

      <ConfirmModal
        open={deleteOpen}
        message={`Delete room "${roomToDelete?.number}"?`}
        onCancel={() => setDeleteOpen(false)}
        onConfirm={handleConfirmDelete}
      />

      <main className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <p className="text-sm text-gray-600">
            Manage room inventory, availability and pricing.
          </p>
          <button
            onClick={openAddForm}
            className="px-4 py-2 bg-blue-600 text-white rounded"
          >
            + Add New Room
          </button>
        </div>

        <Card>
          <div className="flex gap-3 mb-4">
            <input
              className="border px-3 py-2 rounded text-sm flex-1"
              placeholder="Search room..."
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

          {loading && <p>Loading rooms…</p>}
          {error && <p className="text-red-600">{error}</p>}

          {!loading && !error && (
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-2 text-left">Room</th>
                  <th className="p-2">Type</th>
                  <th className="p-2">Status</th>
                  <th className="p-2 text-right">Price</th>
                  <th className="p-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRooms.map((r) => (
                  <tr key={r._id} className="border-t">
                    <td className="p-2">{r.number}</td>
                    <td className="p-2 capitalize">{r.type}</td>
                    <td className="p-2">
                      <RoomStatusBadge value={r.status} />
                    </td>
                    <td className="p-2 text-right">
                      ₹{r.pricePerMonth}
                    </td>
                    <td className="p-2 text-right">
                      <button
                        onClick={() => openEditForm(r)}
                        className="text-blue-600 mr-3"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          setRoomToDelete(r);
                          setDeleteOpen(true);
                        }}
                        className="text-red-600"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>

        {showForm && (
          <div className="fixed inset-0 flex items-center justify-center modal-backdrop">
            <div className="bg-white p-6 rounded w-full max-w-lg">
              <h3 className="text-lg font-semibold mb-4">
                {formMode === "add" ? "Add Room" : "Edit Room"}
              </h3>

              <form onSubmit={handleFormSubmit} className="space-y-4">
                <input
                  className="border px-3 py-2 w-full"
                  placeholder="Room Number"
                  value={formData.number}
                  onChange={(e) =>
                    handleFormChange("number", e.target.value)
                  }
                />
                <input
                  type="number"
                  className="border px-3 py-2 w-full"
                  placeholder="Monthly Price"
                  value={formData.pricePerMonth}
                  onChange={(e) =>
                    handleFormChange("pricePerMonth", e.target.value)
                  }
                />

                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="border px-4 py-2 rounded"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-blue-600 text-white px-4 py-2 rounded"
                  >
                    Save
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
