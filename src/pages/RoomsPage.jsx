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

function ConfirmModal(props) {
  if (!props.open) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center px-4 modal-backdrop">
      <div className="relative z-10 bg-white w-full max-w-sm rounded-2xl shadow-xl p-6 text-center border">
        <div className="text-red-600 text-5xl mb-3">⚠</div>

        <h2 className="text-xl font-semibold mb-2 text-slate-800">
          Delete Room
        </h2>

        <p className="text-slate-600 mb-5 leading-relaxed">{props.message}</p>

        <div className="flex justify-center gap-3">
          <button
            type="button"
            onClick={props.onCancel}
            className="px-4 py-2 rounded-lg border text-sm text-slate-700 hover:bg-slate-100"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={props.onConfirm}
            className="px-4 py-2 rounded-lg text-sm text-white bg-red-600 hover:bg-red-700"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

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

  useEffect(function () {
    loadRooms();
  }, []);

  function loadRooms() {
    setLoading(true);
    setError("");

    fetch(API_BASE + "/api/rooms", {
      method: "GET",
      headers: getAuthHeaders(false),
    })
      .then(function (res) {
        return res.json();
      })
      .then(function (data) {
        if (data && data.ok) {
          setRooms(data.rooms || []);
        } else {
          setError(data && data.error ? data.error : "Failed to load rooms");
        }
      })
      .catch(function () {
        setError("Cannot reach server");
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
          (r.number || "").toLowerCase().indexOf(text) !== -1 ||
          (r.type || "").toLowerCase().indexOf(text) !== -1;

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
      number: row.number || "",
      type: row.type || "single",
      status: row.status || "available",
      pricePerMonth:
        typeof row.pricePerMonth === "number"
          ? String(row.pricePerMonth)
          : row.pricePerMonth || "",
    });
    setShowForm(true);
  }

  function handleFormChange(field, value) {
    setFormData(function (prev) {
      return Object.assign({}, prev, { [field]: value });
    });
  }

  function handleFormSubmit(e) {
    e.preventDefault();

    if (!formData.number || formData.pricePerMonth === "") {
      showStatus("error", "Please enter room number and monthly price.");
      return;
    }

    var payload = {
      number: formData.number,
      type: formData.type,
      status: formData.status,
      pricePerMonth: Number(formData.pricePerMonth),
    };

    if (formMode === "add") {
      fetch(API_BASE + "/api/rooms", {
        method: "POST",
        headers: getAuthHeaders(true),
        body: JSON.stringify(payload),
      })
        .then(function (res) {
          return res.json();
        })
        .then(function (data) {
          if (data && data.ok) {
            setShowForm(false);
            loadRooms();
            showStatus("success", "Room created successfully.");
          } else {
            showStatus(
              "error",
              data && data.error ? data.error : "Failed to create room."
            );
          }
        })
        .catch(function () {
          showStatus("error", "Server error while creating room.");
        });
    } else {
      fetch(API_BASE + "/api/rooms/" + formData._id, {
        method: "PUT",
        headers: getAuthHeaders(true),
        body: JSON.stringify(payload),
      })
        .then(function (res) {
          return res.json();
        })
        .then(function (data) {
          if (data && data.ok) {
            setShowForm(false);
            loadRooms();
            showStatus("success", "Room updated successfully.");
          } else {
            showStatus(
              "error",
              data && data.error ? data.error : "Failed to update room."
            );
          }
        })
        .catch(function () {
          showStatus("error", "Server error while updating room.");
        });
    }
  }

  function handleDelete(row) {
    setRoomToDelete(row);
    setDeleteOpen(true);
  }

  function handleConfirmDelete() {
    if (!roomToDelete) {
      setDeleteOpen(false);
      return;
    }

    fetch(API_BASE + "/api/rooms/" + roomToDelete._id, {
      method: "DELETE",
      headers: getAuthHeaders(false),
    })
      .then(function (res) {
        return res.json();
      })
      .then(function (data) {
        if (data && data.ok) {
          setRooms(function (prev) {
            return prev.filter(function (r) {
              return r._id !== roomToDelete._id;
            });
          });
          showStatus("success", "Room deleted successfully.");
        } else {
          showStatus(
            "error",
            data && data.error ? data.error : "Failed to delete room."
          );
        }
      })
      .catch(function () {
        showStatus("error", "Server error while deleting room.");
      })
      .finally(function () {
        setDeleteOpen(false);
        setRoomToDelete(null);
      });
  }

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

      <ConfirmModal
        open={deleteOpen}
        message={
          roomToDelete ? 'Delete room "' + roomToDelete.number + '"?' : ""
        }
        onCancel={function () {
          setDeleteOpen(false);
          setRoomToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
      />

      <main className="p-4 sm:p-6 space-y-6 container-responsive">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-gray-600 mt-1">
              Manage room inventory, availability and monthly pricing.
            </p>
          </div>

          <button
            onClick={openAddForm}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 text-sm"
          >
            + Add New Room
          </button>
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
                    <th className="text-left px-3 py-2 font-semibold">
                      Room No
                    </th>
                    <th className="text-left px-3 py-2 font-semibold">Type</th>
                    <th className="text-left px-3 py-2 font-semibold">
                      Status
                    </th>
                    <th className="text-right px-3 py-2 font-semibold">
                      Price / Month
                    </th>
                    <th className="text-center px-3 py-2 font-semibold">
                      Occupants
                    </th>
                    <th className="text-left px-3 py-2 font-semibold">
                      Created At
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
                        colSpan="7"
                        className="px-3 py-4 text-center text-gray-500"
                      >
                        No rooms found.
                      </td>
                    </tr>
                  )}

                  {filteredRooms.map(function (row) {
                    return (
                      <tr key={row._id} className="border-t">
                        <td className="px-3 py-2">{row.number}</td>
                        <td className="px-3 py-2 capitalize">
                          {row.type || "-"}
                        </td>
                        <td className="px-3 py-2">
                          <RoomStatusBadge value={row.status} />
                        </td>
                        <td className="px-3 py-2 text-right">
                          ₹
                          {typeof row.pricePerMonth === "number"
                            ? row.pricePerMonth.toLocaleString("en-IN")
                            : row.pricePerMonth || "-"}
                        </td>
                        <td className="px-3 py-2 text-center">
                          {Array.isArray(row.occupants)
                            ? row.occupants.length
                            : 0}
                        </td>
                        <td className="px-3 py-2 text-gray-600">
                          {row.createdAt
                            ? new Date(row.createdAt).toLocaleDateString()
                            : "—"}
                        </td>
                        <td className="px-3 py-2 text-right space-x-2">
                          <button
                            onClick={function () {
                              openEditForm(row);
                            }}
                            className="text-blue-600 hover:underline text-xs"
                          >
                            Edit
                          </button>
                          <button
                            onClick={function () {
                              handleDelete(row);
                            }}
                            className="text-red-600 hover:underline text-xs"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {showForm && (
          <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-20">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold">
                  {formMode === "add" ? "Add New Room" : "Edit Room"}
                </h3>
                <button
                  onClick={function () {
                    setShowForm(false);
                  }}
                  className="text-gray-500 hover:text-gray-700 text-lg"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleFormSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Room Number
                    </label>
                    <input
                      type="text"
                      className="border px-3 py-2 rounded w-full text-sm"
                      value={formData.number}
                      onChange={function (e) {
                        handleFormChange("number", e.target.value);
                      }}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Room Type
                    </label>
                    <select
                      className="border px-3 py-2 rounded w-full text-sm"
                      value={formData.type}
                      onChange={function (e) {
                        handleFormChange("type", e.target.value);
                      }}
                    >
                      <option value="single">Single</option>
                      <option value="double">Double</option>
                      <option value="dorm">Dorm</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Monthly Price (₹)
                    </label>
                    <input
                      type="number"
                      min="0"
                      className="border px-3 py-2 rounded w-full text-sm"
                      value={formData.pricePerMonth}
                      onChange={function (e) {
                        handleFormChange("pricePerMonth", e.target.value);
                      }}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Status
                    </label>
                    <select
                      className="border px-3 py-2 rounded w-full text-sm"
                      value={formData.status}
                      onChange={function (e) {
                        handleFormChange("status", e.target.value);
                      }}
                    >
                      <option value="available">Available</option>
                      <option value="occupied">Occupied</option>
                      <option value="maintenance">Maintenance</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={function () {
                      setShowForm(false);
                    }}
                    className="px-4 py-2 border rounded text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded text-sm"
                  >
                    {formMode === "add" ? "Create Room" : "Save Changes"}
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
