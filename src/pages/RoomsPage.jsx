import React, { useEffect, useMemo, useState } from "react";
import Card from "../components/Card";
import StatusModal from "../components/StatusModal";

var API_BASE = import.meta.env.VITE_API_BASE_URL || "";

/* -------------------- helpers -------------------- */
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

/* -------------------- badge -------------------- */
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

/* -------------------- confirm delete modal -------------------- */
function ConfirmModal(props) {
  if (!props.open) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center modal-backdrop">
      <div className="bg-white w-full max-w-sm rounded-xl shadow-lg p-6 text-center">
        <div className="text-red-600 text-4xl mb-3">⚠</div>
        <h2 className="text-lg font-semibold mb-2">Delete Room</h2>
        <p className="text-gray-600 mb-5">{props.message}</p>

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

/* -------------------- main page -------------------- */
export default function RoomManagementPage() {
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
    status: "available",
    pricePerMonth: "",
  });

  var [statusOpen, setStatusOpen] = useState(false);
  var [statusType, setStatusType] = useState("success");
  var [statusMessage, setStatusMessage] = useState("");

  var [deleteOpen, setDeleteOpen] = useState(false);
  var [roomToDelete, setRoomToDelete] = useState(null);

  function showStatus(type, message) {
    setStatusType(type);
    setStatusMessage(message);
    setStatusOpen(true);
  }

  /* -------------------- load rooms -------------------- */
  useEffect(function () {
    loadRooms();
  }, []);

  function loadRooms() {
    setLoading(true);
    setError("");

    fetch(API_BASE + "/api/rooms", {
      headers: getAuthHeaders(false),
    })
      .then(function (res) {
        return res.json();
      })
      .then(function (data) {
        // SAFE handling (no false error)
        if (Array.isArray(data.rooms)) {
          setRooms(data.rooms);
        } else {
          setRooms([]);
        }
      })
      .catch(function () {
        setError("Unable to load rooms.");
      })
      .finally(function () {
        setLoading(false);
      });
  }

  /* -------------------- filter -------------------- */
  var filteredRooms = useMemo(function () {
    var text = (search || "").toLowerCase();

    return rooms.filter(function (r) {
      var matchText =
        !text ||
        (r.number || "").toLowerCase().includes(text) ||
        (r.type || "").toLowerCase().includes(text);

      var matchStatus =
        statusFilter === "all" ||
        (r.status || "").toLowerCase() === statusFilter;

      var matchType =
        typeFilter === "all" ||
        (r.type || "").toLowerCase() === typeFilter;

      return matchText && matchStatus && matchType;
    });
  }, [rooms, search, statusFilter, typeFilter]);

  /* -------------------- form -------------------- */
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
      pricePerMonth: String(row.pricePerMonth || ""),
    });
    setShowForm(true);
  }

  function handleFormChange(field, value) {
    setFormData(function (prev) {
      return { ...prev, [field]: value };
    });
  }

  function handleFormSubmit(e) {
    e.preventDefault();

    if (!formData.number || formData.pricePerMonth === "") {
      showStatus("error", "Room number and price are required.");
      return;
    }

    var payload = {
      number: formData.number,
      type: formData.type,
      status: formData.status,
      pricePerMonth: Number(formData.pricePerMonth),
    };

    var url =
      formMode === "add"
        ? API_BASE + "/api/rooms"
        : API_BASE + "/api/rooms/" + formData._id;

    var method = formMode === "add" ? "POST" : "PUT";

    fetch(url, {
      method: method,
      headers: getAuthHeaders(true),
      body: JSON.stringify(payload),
    })
      .then(function (res) {
        return res.json();
      })
      .then(function () {
        setShowForm(false);
        loadRooms();
        showStatus(
          "success",
          formMode === "add"
            ? "Room created successfully."
            : "Room updated successfully."
        );
      })
      .catch(function () {
        showStatus("error", "Failed to save room.");
      });
  }

  /* -------------------- delete -------------------- */
  function handleDelete(row) {
    setRoomToDelete(row);
    setDeleteOpen(true);
  }

  function confirmDelete() {
    fetch(API_BASE + "/api/rooms/" + roomToDelete._id, {
      method: "DELETE",
      headers: getAuthHeaders(false),
    })
      .then(function () {
        setRooms(function (prev) {
          return prev.filter(function (r) {
            return r._id !== roomToDelete._id;
          });
        });
        showStatus("success", "Room deleted.");
      })
      .catch(function () {
        showStatus("error", "Delete failed.");
      })
      .finally(function () {
        setDeleteOpen(false);
        setRoomToDelete(null);
      });
  }

  /* -------------------- render -------------------- */
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
        message={
          roomToDelete ? `Delete room "${roomToDelete.number}"?` : ""
        }
        onCancel={() => setDeleteOpen(false)}
        onConfirm={confirmDelete}
      />

      <main className="p-4 sm:p-6 space-y-6">
        <div className="flex justify-between items-center">
          <p className="text-sm text-gray-600">
            Manage room inventory, availability and pricing.
          </p>
          <button
            onClick={openAddForm}
            className="px-4 py-2 bg-blue-600 text-white rounded text-sm"
          >
            + Add New Room
          </button>
        </div>

        <Card>
          <div className="flex gap-3 mb-4">
            <input
              className="border px-3 py-2 rounded text-sm flex-1"
              placeholder="Search by room number or type..."
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

          {loading && <p className="text-sm text-gray-500">Loading rooms…</p>}
          {!loading && error && <p className="text-red-600">{error}</p>}

          {!loading && !error && (
            <table className="w-full text-sm border-t">
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
                      <td className="px-3 py-2 text-center">
                        {row.occupants?.length || 0}
                      </td>
                      <td className="px-3 py-2">
                        {row.createdAt
                          ? new Date(row.createdAt).toLocaleDateString()
                          : "—"}
                      </td>
                      <td className="px-3 py-2 text-right space-x-2">
                        <button
                          onClick={() => openEditForm(row)}
                          className="text-blue-600 text-xs"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(row)}
                          className="text-red-600 text-xs"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </Card>

        {showForm && (
          <div className="fixed inset-0 flex items-center justify-center modal-backdrop">
            <div className="bg-white p-6 rounded-lg w-full max-w-xl">
              <h3 className="text-lg font-semibold mb-4">
                {formMode === "add" ? "Add Room" : "Edit Room"}
              </h3>

              <form onSubmit={handleFormSubmit} className="space-y-4">
                <input
                  className="border px-3 py-2 rounded w-full"
                  placeholder="Room Number"
                  value={formData.number}
                  onChange={(e) =>
                    handleFormChange("number", e.target.value)
                  }
                />

                <input
                  type="number"
                  className="border px-3 py-2 rounded w-full"
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
