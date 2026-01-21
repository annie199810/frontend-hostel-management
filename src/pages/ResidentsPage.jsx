import React, { useEffect, useMemo, useState } from "react";
import Card from "../components/Card";
import StatusModal from "../components/StatusModal";

var API_BASE = import.meta.env.VITE_API_BASE_URL || "";

/* -------------------- AUTH HEADER -------------------- */
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

/* -------------------- STATUS BADGE -------------------- */
function StatusBadge({ value }) {
  var active = (value || "active").toLowerCase() !== "inactive";

  return (
    <span
      className={
        "px-3 py-1 rounded-full text-xs font-semibold inline-block " +
        (active
          ? "bg-green-100 text-green-700"
          : "bg-gray-200 text-gray-600")
      }
    >
      {active ? "Active" : "Inactive"}
    </span>
  );
}

/* -------------------- CONFIRM MODAL -------------------- */
function ConfirmModal(props) {
  if (!props.open) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center px-4 modal-backdrop">
      <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl p-6 text-center border">
        <div className="text-red-600 text-5xl mb-3">⚠</div>

        <h2 className="text-xl font-semibold mb-2 text-gray-800">
          Delete Resident
        </h2>

        <p className="text-gray-600 mb-6">{props.message}</p>

        <div className="flex justify-center gap-3">
          <button
            onClick={props.onCancel}
            className="px-4 py-2 rounded-lg border text-sm hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            onClick={props.onConfirm}
            className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm hover:bg-red-700"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

/* ==================== MAIN PAGE ==================== */
export default function ResidentsPage() {
  var [items, setItems] = useState([]);
  var [availableRooms, setAvailableRooms] = useState([]);
  var [loading, setLoading] = useState(true);
  var [error, setError] = useState("");

  var [search, setSearch] = useState("");
  var [statusFilter, setStatusFilter] = useState("all");

  var [showForm, setShowForm] = useState(false);
  var [formMode, setFormMode] = useState("add");

  var [formData, setFormData] = useState({
    _id: null,
    name: "",
    roomNumber: "",
    phone: "",
    status: "active",
    expectedCheckout: "",
  });

  var [statusOpen, setStatusOpen] = useState(false);
  var [statusType, setStatusType] = useState("success");
  var [statusMessage, setStatusMessage] = useState("");

  var [deleteOpen, setDeleteOpen] = useState(false);
  var [residentToDelete, setResidentToDelete] = useState(null);

  function showStatus(type, msg) {
    setStatusType(type);
    setStatusMessage(msg);
    setStatusOpen(true);
  }

  /* -------------------- LOAD DATA -------------------- */
  useEffect(function () {
    loadResidents();
    loadAvailableRooms();
  }, []);

  function loadResidents() {
    setLoading(true);
    setError("");

    fetch(API_BASE + "/api/residents", {
      headers: getAuthHeaders(true),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data && data.ok) setItems(data.residents || []);
        else setError(data.error || "Failed to load residents");
      })
      .catch(() => setError("Server unreachable"))
      .finally(() => setLoading(false));
  }

  function loadAvailableRooms() {
    fetch(API_BASE + "/api/rooms/available", {
      headers: getAuthHeaders(true),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data && data.ok) setAvailableRooms(data.rooms || []);
      })
      .catch(() => {});
  }

  /* -------------------- FILTER -------------------- */
  var filteredItems = useMemo(
    function () {
      var text = search.toLowerCase();

      return items.filter(function (r) {
        var matchText =
          !text ||
          (r.name || "").toLowerCase().includes(text) ||
          (r.roomNumber || "").includes(text) ||
          (r.phone || "").includes(text);

        var matchStatus =
          statusFilter === "all" ||
          (r.status || "active") === statusFilter;

        return matchText && matchStatus;
      });
    },
    [items, search, statusFilter]
  );

  /* -------------------- FORM HANDLERS -------------------- */
  function openAddForm() {
    setFormMode("add");
    setFormData({
      _id: null,
      name: "",
      roomNumber: "",
      phone: "",
      status: "active",
      expectedCheckout: "",
    });
    setShowForm(true);
  }

  function openEditForm(row) {
    setFormMode("edit");
    setFormData({
      _id: row._id,
      name: row.name,
      roomNumber: row.roomNumber,
      phone: row.phone,
      status: row.status || "active",
      expectedCheckout: row.expectedCheckout
      ? row.expectedCheckout.slice(0, 10)
      : "",
    });
    setShowForm(true);
  }

  function handleFormChange(k, v) {
    setFormData(function (p) {
      return { ...p, [k]: v };
    });
  }

  function handleFormSubmit(e) {
    e.preventDefault();

    if (!formData.name || !formData.roomNumber || !formData.phone) {
      showStatus("error", "All fields are required");
      return;
    }

    var payload = {
      name: formData.name,
      roomNumber: formData.roomNumber,
      phone: formData.phone,
      status: formData.status,
      expectedCheckout: formData.expectedCheckout,
    };

    var url =
      API_BASE +
      "/api/residents" +
      (formMode === "edit" ? "/" + formData._id : "");

    fetch(url, {
      method: formMode === "add" ? "POST" : "PUT",
      headers: getAuthHeaders(true),
      body: JSON.stringify(payload),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data && data.ok) {
          setShowForm(false);
          loadResidents();
          loadAvailableRooms();
          showStatus(
            "success",
            formMode === "add"
              ? "Resident added successfully"
              : "Resident updated successfully"
          );
        } else {
          showStatus("error", data.error || "Operation failed");
        }
      })
      .catch(() => showStatus("error", "Server error"));
  }

  /* -------------------- DELETE -------------------- */
  function handleDelete(row) {
    setResidentToDelete(row);
    setDeleteOpen(true);
  }

  function confirmDelete() {
    fetch(API_BASE + "/api/residents/" + residentToDelete._id, {
      method: "DELETE",
      headers: getAuthHeaders(true),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data && data.ok) {
          setItems(function (p) {
            return p.filter(function (x) {
              return x._id !== residentToDelete._id;
            });
          });
          loadAvailableRooms();
          showStatus("success", "Resident deleted");
        } else {
          showStatus("error", data.error || "Delete failed");
        }
      })
      .finally(function () {
        setDeleteOpen(false);
        setResidentToDelete(null);
      });
  }

  /* ==================== UI ==================== */
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
          residentToDelete
            ? `Delete resident "${residentToDelete.name}"?`
            : ""
        }
        onCancel={() => setDeleteOpen(false)}
        onConfirm={confirmDelete}
      />

      <main className="p-4 sm:p-6 space-y-6">
        <div className="flex justify-between">
          <p className="text-sm text-gray-500">
            Manage hostel residents & room allocation
          </p>
          <button
            onClick={openAddForm}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm"
          >
            + Add Resident
          </button>
        </div>

        <Card>
          <input
            className="border px-4 py-2 rounded-lg text-sm w-full mb-4"
            placeholder="Search name, room or phone"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <table className="min-w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-3 text-left">Name</th>
                <th className="px-4 py-3 text-left">Room</th>
                <th className="px-4 py-3 text-left">Phone</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map(function (r) {
                return (
                  <tr key={r._id} className="border-t">
                    <td className="px-4 py-3">{r.name}</td>
                    <td className="px-4 py-3">{r.roomNumber}</td>
                    <td className="px-4 py-3">{r.phone}</td>
                    <td className="px-4 py-3">
                      <StatusBadge value={r.status} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        className="text-blue-600 mr-3"
                        onClick={() => openEditForm(r)}
                      >
                        Edit
                      </button>
                      <button
                        className="text-red-600"
                        onClick={() => handleDelete(r)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>

        {showForm && (
          <div className="fixed inset-0 modal-backdrop flex items-center justify-center">
            <div className="bg-white w-full max-w-lg rounded-xl p-6">
              <h3 className="text-xl mb-4">
                {formMode === "add" ? "Add Resident" : "Edit Resident"}
              </h3>

              <form onSubmit={handleFormSubmit} className="space-y-4">
                <input
                  className="border px-3 py-2 rounded w-full"
                  placeholder="Name"
                  value={formData.name}
                  onChange={(e) =>
                    handleFormChange("name", e.target.value)
                  }
                />

              <select
  className="border px-3 py-2 rounded w-full"
  value={formData.roomNumber}
  onChange={(e) =>
    handleFormChange("roomNumber", e.target.value)
  }
>
  <option value="">Select Available Room</option>

  {[...availableRooms]
    .concat(
      formMode === "edit" &&
        !availableRooms.some(
          (r) => r.number === formData.roomNumber
        )
        ? items
            .map((r) => r.roomNumber)
            .filter((n) => n === formData.roomNumber)
            .map((n) => ({
              number: n,
              type: "Occupied",
              ac: "",
              _id: "current",
            }))
        : []
    )
    .map((room) => (
      <option key={room._id || room.number} value={room.number}>
        Room {room.number} ({room.type} {room.ac && "/ " + room.ac})
      </option>
    ))}
</select>



                <input
                  className="border px-3 py-2 rounded w-full"
                  placeholder="Phone"
                  value={formData.phone}
                  onChange={(e) =>
                    handleFormChange("phone", e.target.value)
                  }
                />

                <input
                  type="date"
                  className="border px-3 py-2 rounded w-full"
                 value={formData.expectedCheckout || ""}
                  onChange={(e) =>
                    handleFormChange(
                      "expectedCheckout",
                      e.target.value
                    )
                  }
                />

                <select
                  className="border px-3 py-2 rounded w-full"
                  value={formData.status}
                  onChange={(e) =>
                    handleFormChange("status", e.target.value)
                  }
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>

                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-4 py-2 border rounded"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded"
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
