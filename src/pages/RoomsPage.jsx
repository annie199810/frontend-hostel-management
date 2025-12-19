import React, { useEffect, useMemo, useState } from "react";
import Card from "../components/Card";
import { useAuth } from "../auth/AuthProvider";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

/* -------------------- HELPERS -------------------- */

function getAuthHeaders(json) {
  var headers = {};
  var token = localStorage.getItem("token");
  if (json) headers["Content-Type"] = "application/json";
  if (token) headers["Authorization"] = "Bearer " + token;
  return headers;
}

function StatusBadge({ value }) {
  var map = {
    available: "bg-green-100 text-green-700",
    occupied: "bg-blue-100 text-blue-700",
    maintenance: "bg-yellow-100 text-yellow-700",
  };

  return (
    <span
      className={
        "px-2 py-1 rounded-full text-xs font-medium " +
        (map[value] || "bg-gray-100 text-gray-600")
      }
    >
      {value}
    </span>
  );
}

/* -------------------- TOAST -------------------- */

function Toast({ open, type, message, onClose }) {
  if (!open) return null;

  return (
    <div className="fixed top-5 right-5 z-50 animate-slide-in">
      <div
        className={
          "px-4 py-3 rounded-lg shadow text-white text-sm " +
          (type === "error" ? "bg-red-600" : "bg-green-600")
        }
      >
        {message}
        <button
          className="ml-3 font-bold"
          onClick={onClose}
        >
          ×
        </button>
      </div>
    </div>
  );
}

/* -------------------- CONFIRM MODAL -------------------- */

function ConfirmModal({ open, message, onCancel, onConfirm, loading }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl p-6 w-full max-w-sm animate-scale-in">
        <h3 className="text-lg font-semibold mb-3">Confirm Delete</h3>
        <p className="text-sm text-gray-600 mb-5">{message}</p>

        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 border rounded text-sm"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="px-4 py-2 bg-red-600 text-white rounded text-sm"
          >
            {loading ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* -------------------- PAGE -------------------- */

export default function RoomPage() {
  const { user } = useAuth(); // expects user.role

  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState("add");
  const [formData, setFormData] = useState({
    _id: null,
    number: "",
    type: "single",
    status: "available",
    pricePerMonth: "",
  });

  const [saving, setSaving] = useState(false);

  const [toast, setToast] = useState({ open: false });

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  /* -------------------- LOAD ROOMS -------------------- */

  useEffect(() => {
    console.log("Loading rooms...");
    fetch(API_BASE + "/api/rooms", {
      headers: getAuthHeaders(),
    })
      .then((r) => r.json())
      .then((d) => {
        console.log("Rooms data:", d);
        setRooms(d.rooms || []);
      })
      .catch(() => showToast("error", "Failed to load rooms"))
      .finally(() => setLoading(false));
  }, []);

  /* -------------------- FILTER -------------------- */

  const filteredRooms = useMemo(() => {
    return rooms.filter((r) => {
      return (
        (!search || r.number.includes(search)) &&
        (typeFilter === "all" || r.type === typeFilter) &&
        (statusFilter === "all" || r.status === statusFilter)
      );
    });
  }, [rooms, search, typeFilter, statusFilter]);

  /* -------------------- TOAST -------------------- */

  function showToast(type, message) {
    setToast({ open: true, type, message });
    setTimeout(() => setToast({ open: false }), 3000);
  }

  /* -------------------- FORM -------------------- */

  function openAdd() {
    console.log("Add clicked");
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

  function openEdit(room) {
    console.log("Edit clicked", room);
    setFormMode("edit");
    setFormData({
      _id: room._id,
      number: room.number,
      type: room.type,
      status: room.status,
      pricePerMonth: room.pricePerMonth,
    });
    setShowForm(true);
  }

  function submitForm(e) {
    e.preventDefault();
    setSaving(true);

    var method = formMode === "add" ? "POST" : "PUT";
    var url =
      API_BASE +
      "/api/rooms" +
      (formMode === "edit" ? "/" + formData._id : "");

    fetch(url, {
      method,
      headers: getAuthHeaders(true),
      body: JSON.stringify(formData),
    })
      .then((r) => r.json())
      .then(() => {
        showToast("success", "Room saved successfully");
        window.location.reload();
      })
      .catch(() => showToast("error", "Save failed"))
      .finally(() => setSaving(false));
  }

  /* -------------------- DELETE -------------------- */

  function confirmDelete(room) {
    console.log("Delete clicked", room);
    setDeleteTarget(room);
    setDeleteOpen(true);
  }

  function doDelete() {
    setDeleteLoading(true);
    fetch(API_BASE + "/api/rooms/" + deleteTarget._id, {
      method: "DELETE",
      headers: getAuthHeaders(),
    })
      .then(() => {
        showToast("success", "Room deleted");
        window.location.reload();
      })
      .catch(() => showToast("error", "Delete failed"))
      .finally(() => setDeleteLoading(false));
  }

  /* -------------------- RENDER -------------------- */

  return (
    <>
      <Toast {...toast} onClose={() => setToast({ open: false })} />

      <ConfirmModal
        open={deleteOpen}
        message={
          deleteTarget ? `Delete room ${deleteTarget.number}?` : ""
        }
        loading={deleteLoading}
        onCancel={() => setDeleteOpen(false)}
        onConfirm={doDelete}
      />

      <main className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <p className="text-gray-600">
            Manage room inventory, availability and pricing.
          </p>
          {user?.role === "Admin" && (
            <button
              onClick={openAdd}
              className="bg-blue-600 text-white px-4 py-2 rounded"
            >
              + Add New Room
            </button>
          )}
        </div>

        <Card>
          <div className="flex gap-3 mb-4">
            <input
              className="border px-3 py-2 rounded w-full"
              placeholder="Search room..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <select
              className="border px-3 py-2 rounded"
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="all">All Types</option>
              <option value="single">Single</option>
              <option value="double">Double</option>
            </select>

            <select
              className="border px-3 py-2 rounded"
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="available">Available</option>
              <option value="occupied">Occupied</option>
            </select>
          </div>

          {loading ? (
            <p>Loading...</p>
          ) : (
            <table className="w-full text-sm border">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-2 text-left">Room</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Price</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRooms.map((r) => (
                  <tr key={r._id} className="border-t">
                    <td className="p-2">{r.number}</td>
                    <td>{r.type}</td>
                    <td><StatusBadge value={r.status} /></td>
                    <td>₹{r.pricePerMonth}</td>
                    <td className="space-x-2">
                      {user?.role === "Admin" && (
                        <>
                          <button
                            onClick={() => openEdit(r)}
                            className="text-blue-600"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => confirmDelete(r)}
                            className="text-red-600"
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>

        {showForm && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-40">
            <form
              onSubmit={submitForm}
              className="bg-white p-6 rounded-xl w-full max-w-md animate-scale-in"
            >
              <h3 className="text-lg font-semibold mb-4">
                {formMode === "add" ? "Add Room" : "Edit Room"}
              </h3>

              <input
                className="border w-full mb-3 px-3 py-2 rounded"
                placeholder="Room Number"
                value={formData.number}
                onChange={(e) =>
                  setFormData({ ...formData, number: e.target.value })
                }
              />

              <input
                className="border w-full mb-3 px-3 py-2 rounded"
                placeholder="Price"
                value={formData.pricePerMonth}
                onChange={(e) =>
                  setFormData({ ...formData, pricePerMonth: e.target.value })
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
                  disabled={saving}
                  className="bg-blue-600 text-white px-4 py-2 rounded"
                >
                  {saving ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </div>
        )}
      </main>
    </>
  );
}
