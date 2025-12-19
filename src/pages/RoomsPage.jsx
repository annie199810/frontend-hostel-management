import React, { useEffect, useMemo, useState } from "react";
import Card from "../components/Card";
import StatusModal from "../components/StatusModal";

var API_BASE = import.meta.env.VITE_API_BASE_URL || "";

/* ------------------ HELPERS ------------------ */

function getAuthHeaders(includeJson) {
  var headers = {};
  var token = null;

  try {
    token = localStorage.getItem("token");
  } catch (e) {}

  if (includeJson) headers["Content-Type"] = "application/json";
  if (token) headers["Authorization"] = "Bearer " + token;

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

/* ------------------ DELETE CONFIRM ------------------ */

function ConfirmModal(props) {
  if (!props.open) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center modal-backdrop">
      <div className="bg-white w-full max-w-sm rounded-xl shadow-xl p-6 text-center">
        <div className="text-red-600 text-4xl mb-3">⚠</div>
        <h2 className="text-lg font-semibold mb-2">Delete Room</h2>
        <p className="text-sm text-gray-600 mb-5">{props.message}</p>

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

/* ================== MAIN PAGE ================== */

export default function RoomPage() {
  var [rooms, setRooms] = useState([]);
  var [loading, setLoading] = useState(true);
  var [error, setError] = useState("");

  var [search, setSearch] = useState("");
  var [statusFilter, setStatusFilter] = useState("all");
  var [typeFilter, setTypeFilter] = useState("all");

  var [showForm, setShowForm] = useState(false);
  var [formMode, setFormMode] = useState("add");
  var [formData, setFormData] = useState({
    _id: null,
    number: "",
    type: "single",
    acType: "non-ac",
    status: "available",
    pricePerMonth: "",
  });

  var [statusOpen, setStatusOpen] = useState(false);
  var [statusType, setStatusType] = useState("success");
  var [statusMessage, setStatusMessage] = useState("");

  var [deleteOpen, setDeleteOpen] = useState(false);
  var [roomToDelete, setRoomToDelete] = useState(null);

  function showStatus(type, msg) {
    setStatusType(type);
    setStatusMessage(msg);
    setStatusOpen(true);
  }

  /* ------------------ LOAD ROOMS ------------------ */

  useEffect(function () {
    loadRooms();
  }, []);

  function loadRooms() {
    setLoading(true);
    setError("");

    fetch(API_BASE + "/api/rooms", {
      headers: getAuthHeaders(false),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data && data.ok) setRooms(data.rooms || []);
        else setError(data.error || "Failed to load rooms");
      })
      .catch(() => setError("Server not reachable"))
      .finally(() => setLoading(false));
  }

  /* ------------------ FILTER ------------------ */

  var filteredRooms = useMemo(function () {
    var t = search.toLowerCase();

    return rooms.filter(function (r) {
      var matchText =
        !t ||
        (r.number || "").toLowerCase().includes(t) ||
        (r.type || "").toLowerCase().includes(t);

      var matchStatus =
        statusFilter === "all" || r.status === statusFilter;

      var matchType =
        typeFilter === "all" || r.type === typeFilter;

      return matchText && matchStatus && matchType;
    });
  }, [rooms, search, statusFilter, typeFilter]);

  /* ------------------ FORM ------------------ */

  function openAddForm() {
    setFormMode("add");
    setFormData({
      _id: null,
      number: "",
      type: "single",
      acType: "non-ac",
      status: "available",
      pricePerMonth: "",
    });
    setShowForm(true);
  }

  function openEditForm(row) {
    setFormMode("edit");
    setFormData({
      _id: row._id,
      number: row.number || "",
      type: row.type || "single",
      acType: row.acType || "non-ac",
      status: row.status || "available",
      pricePerMonth: String(row.pricePerMonth || ""),
    });
    setShowForm(true);
  }

  function handleChange(field, value) {
    setFormData((p) => ({ ...p, [field]: value }));
  }

  function submitForm(e) {
    e.preventDefault();

    if (!formData.number || !formData.pricePerMonth) {
      showStatus("error", "All fields are required");
      return;
    }

    var payload = {
      number: formData.number,
      type: formData.type,
      acType: formData.acType,
      status: formData.status,
      pricePerMonth: Number(formData.pricePerMonth),
    };

    var url =
      formMode === "add"
        ? API_BASE + "/api/rooms"
        : API_BASE + "/api/rooms/" + formData._id;

    var method = formMode === "add" ? "POST" : "PUT";

    fetch(url, {
      method,
      headers: getAuthHeaders(true),
      body: JSON.stringify(payload),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.ok) {
          setShowForm(false);
          loadRooms();
          showStatus("success", "Room saved successfully");
        } else showStatus("error", data.error || "Failed");
      })
      .catch(() => showStatus("error", "Server error"));
  }

  /* ------------------ DELETE ------------------ */

  function confirmDelete(row) {
    setRoomToDelete(row);
    setDeleteOpen(true);
  }

  function deleteRoom() {
    fetch(API_BASE + "/api/rooms/" + roomToDelete._id, {
      method: "DELETE",
      headers: getAuthHeaders(false),
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.ok) {
          setRooms((p) => p.filter((x) => x._id !== roomToDelete._id));
          showStatus("success", "Room deleted");
        } else showStatus("error", "Delete failed");
      })
      .finally(() => {
        setDeleteOpen(false);
        setRoomToDelete(null);
      });
  }

  /* ================== UI ================== */

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
        message={roomToDelete ? `Delete room ${roomToDelete.number}?` : ""}
        onCancel={() => setDeleteOpen(false)}
        onConfirm={deleteRoom}
      />

      <main className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Rooms</h2>
          <button
            onClick={openAddForm}
            className="px-4 py-2 bg-blue-600 text-white rounded"
          >
            + Add Room
          </button>
        </div>

        <Card>
          {loading && <p className="text-sm">Loading…</p>}
          {error && <p className="text-sm text-red-600">{error}</p>}

          {!loading && !error && (
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-2 text-left">Room</th>
                  <th className="p-2">Type</th>
                  <th className="p-2">AC</th>
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
                    <td className="p-2 uppercase">{r.acType}</td>
                    <td className="p-2">
                      <RoomStatusBadge value={r.status} />
                    </td>
                    <td className="p-2 text-right">₹{r.pricePerMonth}</td>
                    <td className="p-2 text-right space-x-2">
                      <button
                        onClick={() => openEditForm(r)}
                        className="text-blue-600 text-xs"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => confirmDelete(r)}
                        className="text-red-600 text-xs"
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

        {/* FORM MODAL */}
        {showForm && (
          <div className="fixed inset-0 modal-backdrop flex items-center justify-center">
            <div className="bg-white w-full max-w-lg rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">
                {formMode === "add" ? "Add Room" : "Edit Room"}
              </h3>

              <form onSubmit={submitForm} className="space-y-4">
                <input
                  placeholder="Room Number"
                  className="border p-2 w-full"
                  value={formData.number}
                  onChange={(e) => handleChange("number", e.target.value)}
                />

                <div className="grid grid-cols-2 gap-3">
                  <select
                    className="border p-2"
                    value={formData.type}
                    onChange={(e) => handleChange("type", e.target.value)}
                  >
                    <option value="single">Single</option>
                    <option value="double">Double</option>
                    <option value="dorm">Dorm</option>
                  </select>

                  <select
                    className="border p-2"
                    value={formData.acType}
                    onChange={(e) => handleChange("acType", e.target.value)}
                  >
                    <option value="non-ac">Non AC</option>
                    <option value="ac">AC</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="number"
                    placeholder="Price"
                    className="border p-2"
                    value={formData.pricePerMonth}
                    onChange={(e) =>
                      handleChange("pricePerMonth", e.target.value)
                    }
                  />

                  <select
                    className="border p-2"
                    value={formData.status}
                    onChange={(e) => handleChange("status", e.target.value)}
                  >
                    <option value="available">Available</option>
                    <option value="occupied">Occupied</option>
                    <option value="maintenance">Maintenance</option>
                  </select>
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="border px-4 py-2"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-blue-600 text-white px-4 py-2"
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
