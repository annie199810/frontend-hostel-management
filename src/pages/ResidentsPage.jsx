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

  if (includeJson) headers["Content-Type"] = "application/json";
  if (token) headers["Authorization"] = "Bearer " + token;

  return headers;
}

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



export default function ResidentsPage() {
  var [items, setItems] = useState([]);
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

 

  useEffect(function () {
    loadResidents();
  }, []);

  function loadResidents() {
    setLoading(true);
    setError("");

    fetch(API_BASE + "/api/residents", {
      headers: getAuthHeaders(false),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data && data.ok) setItems(data.residents || []);
        else setError(data.error || "Failed to load residents");
      })
      .catch(() => setError("Server unreachable"))
      .finally(() => setLoading(false));
  }

  

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

  

  function openAddForm() {
    setFormMode("add");
    setFormData({
      _id: null,
      name: "",
      roomNumber: "",
      phone: "",
      status: "active",
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
    });
    setShowForm(true);
  }

  function handleFormChange(k, v) {
    setFormData((p) => ({ ...p, [k]: v }));
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

 

  function handleDelete(row) {
    setResidentToDelete(row);
    setDeleteOpen(true);
  }

  function confirmDelete() {
    fetch(API_BASE + "/api/residents/" + residentToDelete._id, {
      method: "DELETE",
      headers: getAuthHeaders(false),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data && data.ok) {
          setItems((p) => p.filter((x) => x._id !== residentToDelete._id));
          showStatus("success", "Resident deleted");
        } else {
          showStatus("error", data.error || "Delete failed");
        }
      })
      .finally(() => {
        setDeleteOpen(false);
        setResidentToDelete(null);
      });
  }

 

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
        {/* header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>          
            <p className="text-sm text-gray-500">
              Manage hostel residents & room allocation
            </p>
          </div>

          <button
            onClick={openAddForm}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow-sm hover:bg-blue-700 text-sm"
          >
            + Add Resident
          </button>
        </div>

        <Card>
     
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <input
              className="border px-4 py-2 rounded-lg text-sm flex-1"
              placeholder="Search name, room or phone"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <select
              className="border px-3 py-2 rounded-lg text-sm w-full sm:w-40"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

      
          <div className="overflow-x-auto rounded-xl border">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-100 text-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left">Name</th>
                  <th className="px-4 py-3 text-left">Room</th>
                  <th className="px-4 py-3 text-left">Phone</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.length === 0 && (
                  <tr>
                    <td colSpan="5" className="py-10 text-center text-gray-500">
                      No residents found
                    </td>
                  </tr>
                )}

                {filteredItems.map((r) => (
                  <tr
                    key={r._id}
                    className="border-t hover:bg-gray-50 transition"
                  >
                    <td className="px-4 py-3">{r.name}</td>
                    <td className="px-4 py-3">{r.roomNumber}</td>
                    <td className="px-4 py-3">{r.phone}</td>
                    <td className="px-4 py-3">
                      <StatusBadge value={r.status} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-3">
                        <button
                          onClick={() => openEditForm(r)}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(r)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

       
        {showForm && (
          <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-20">
            <div className="bg-white w-full max-w-lg rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-semibold mb-4">
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

                <input
                  className="border px-3 py-2 rounded w-full"
                  placeholder="Room Number"
                  value={formData.roomNumber}
                  onChange={(e) =>
                    handleFormChange("roomNumber", e.target.value)
                  }
                />

                <input
                  className="border px-3 py-2 rounded w-full"
                  placeholder="Phone"
                  value={formData.phone}
                  onChange={(e) =>
                    handleFormChange("phone", e.target.value)
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

                <div className="flex justify-end gap-3 pt-2">
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
