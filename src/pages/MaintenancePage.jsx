
import React, { useEffect, useMemo, useRef, useState } from "react";
import Card from "../components/Card";
import StatusModal from "../components/StatusModal";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "";


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

async function safeFetchJson(url, opts) {
  const res = await fetch(url, opts);
  const text = await res.text();
  let json = {};
  try {
    json = text ? JSON.parse(text) : {};
  } catch (e) {
    json = { __rawText: text };
  }
  return { res, json };
}

function StatusBadge(props) {
  var v = props.value || "Open";
  var cls =
    v === "Open"
      ? "bg-red-50 text-red-700"
      : v === "In-progress"
      ? "bg-amber-50 text-amber-700"
      : "bg-green-50 text-green-700";

  return (
    <span className={"px-2 py-0.5 rounded-full text-xs font-medium " + cls}>
      {v}
    </span>
  );
}

function PriorityBadge(props) {
  var v = props.value || "Medium";
  var cls =
    v === "High"
      ? "bg-red-50 text-red-700"
      : v === "Medium"
      ? "bg-amber-50 text-amber-700"
      : "bg-sky-50 text-sky-700";

  return (
    <span className={"px-2 py-0.5 rounded-full text-xs font-medium " + cls}>
      {v}
    </span>
  );
}

function ConfirmModal(props) {
  if (!props.open) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative z-10 bg-white w-full max-w-sm rounded-2xl shadow-xl p-6 text-center border">
        <div className="text-amber-500 text-5xl mb-3">⚠</div>
        <h2 className="text-xl font-semibold mb-2 text-amber-700">CONFIRM</h2>
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
            className="px-4 py-2 rounded-lg text-sm text-white bg-amber-600 hover:bg-amber-700"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}


export default function MaintenancePage() {
  var [items, setItems] = useState([]);
  var [loading, setLoading] = useState(true);
  var [error, setError] = useState("");

  var [search, setSearch] = useState("");
  var [statusFilter, setStatusFilter] = useState("all");
  var [priorityFilter, setPriorityFilter] = useState("all");

  var [showForm, setShowForm] = useState(false);
  var [formMode, setFormMode] = useState("add");
  var [saving, setSaving] = useState(false);

  var [statusOpen, setStatusOpen] = useState(false);
  var [statusType, setStatusType] = useState("success");
  var [statusMessage, setStatusMessage] = useState("");

  var [confirmOpen, setConfirmOpen] = useState(false);
  var [rowToDelete, setRowToDelete] = useState(null);

  var firstInputRef = useRef(null);

  var [formData, setFormData] = useState({
    roomNumber: "",
    issue: "",
    type: "Plumbing",
    priority: "Medium",
    status: "Open",
    reportedBy: "",
    reportedOn: "",
    _id: undefined,
  });

  function showStatus(type, message) {
    setStatusType(type);
    setStatusMessage(message);
    setStatusOpen(true);
  }

 
  useEffect(function () {
    var mounted = true;

    async function load() {
      try {
        setLoading(true);
        setError("");

        var result = await safeFetchJson(API_BASE + "/api/maintenance", {
          method: "GET",
          headers: getAuthHeaders(false),
        });

        var json = result.json || {};
        if (!result.res.ok || json.ok === false) {
          throw new Error(
            json.error || json.message || "Failed to load maintenance"
          );
        }

        var list = Array.isArray(json)
          ? json
          : json.requests || json.data || [];

        if (mounted) setItems(list);
      } catch (err) {
        console.error("Maintenance load error:", err);
        if (mounted) setError("Failed to load maintenance requests.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return function () {
      mounted = false;
    };
  }, []);

 
  var filteredItems = useMemo(
    function () {
      var q = (search || "").trim().toLowerCase();
      return (items || []).filter(function (r) {
        var matchSearch =
          !q ||
          String(r.roomNumber || "").toLowerCase().indexOf(q) !== -1 ||
          String(r.issue || "").toLowerCase().indexOf(q) !== -1 ||
          String(r.reportedBy || "").toLowerCase().indexOf(q) !== -1;

        var matchStatus =
          statusFilter === "all" || (r.status || "") === statusFilter;

        var matchPriority =
          priorityFilter === "all" || (r.priority || "") === priorityFilter;

        return matchSearch && matchStatus && matchPriority;
      });
    },
    [items, search, statusFilter, priorityFilter]
  );

  
  function openAddForm() {
    setFormMode("add");
    setFormData({
      roomNumber: "",
      issue: "",
      type: "Plumbing",
      priority: "Medium",
      status: "Open",
      reportedBy: "",
      reportedOn: new Date().toISOString().slice(0, 10),
      _id: undefined,
    });
    setShowForm(true);

    setTimeout(function () {
      if (firstInputRef.current && firstInputRef.current.focus) {
        firstInputRef.current.focus();
      }
    }, 60);
  }

  function openEditForm(row) {
    
    if (row.status === "Closed") return;

    setFormMode("edit");
    setFormData({
      roomNumber: row.roomNumber || "",
      issue: row.issue || "",
      type: row.type || "Plumbing",
      priority: row.priority || "Medium",
      status: row.status || "Open",
      reportedBy: row.reportedBy || "",
      reportedOn: row.reportedOn || new Date().toISOString().slice(0, 10),
      _id: row._id,
    });
    setShowForm(true);

    setTimeout(function () {
      if (firstInputRef.current && firstInputRef.current.focus) {
        firstInputRef.current.focus();
      }
    }, 60);
  }

  function handleFormChange(field, value) {
    setFormData(function (p) {
      return Object.assign({}, p, { [field]: value });
    });
  }

  
  async function handleFormSubmit(e) {
    e.preventDefault();

    if (!formData.roomNumber || !formData.issue) {
      showStatus("error", "Please enter room number and a short issue title.");
      return;
    }

    try {
      setSaving(true);

      if (formMode === "add") {
        var addResult = await safeFetchJson(API_BASE + "/api/maintenance", {
          method: "POST",
          headers: getAuthHeaders(true),
          body: JSON.stringify(formData),
        });

        var addJson = addResult.json || {};
        if (!addResult.res.ok || addJson.ok === false) {
          throw new Error(
            addJson.error ||
              addJson.message ||
              "Create failed (" + addResult.res.status + ")"
          );
        }

        var created =
          addJson.request ||
          addJson.data ||
          (Array.isArray(addJson) ? addJson[0] : addJson);

        if (created) {
          setItems(function (prev) {
            return [created].concat(prev);
          });
        }

        showStatus("success", "Maintenance request created.");
      } else {
        var id = formData._id;
        var payload = Object.assign({}, formData);
        delete payload._id;

        var editResult = await safeFetchJson(
          API_BASE + "/api/maintenance/" + id,
          {
            method: "PUT",
            headers: getAuthHeaders(true),
            body: JSON.stringify(payload),
          }
        );

        var editJson = editResult.json || {};
        if (!editResult.res.ok || editJson.ok === false) {
          throw new Error(
            editJson.error ||
              editJson.message ||
              "Update failed (" + editResult.res.status + ")"
          );
        }

        var updated = editJson.request || editJson.data || editJson;

        setItems(function (prev) {
          return prev.map(function (r) {
            return r._id === id ? updated : r;
          });
        });

        showStatus("success", "Maintenance request updated.");
      }

      setShowForm(false);
    } catch (err) {
      console.error("Maintenance save error:", err);
      showStatus("error", err.message || "Failed to save request.");
    } finally {
      setSaving(false);
    }
  }

  
  function askDelete(row) {
    setRowToDelete(row);
    setConfirmOpen(true);
  }

  async function confirmDelete() {
    if (!rowToDelete) {
      setConfirmOpen(false);
      return;
    }

    var row = rowToDelete;

    try {
      var delResult = await safeFetchJson(
        API_BASE + "/api/maintenance/" + row._id,
        {
          method: "DELETE",
          headers: getAuthHeaders(false),
        }
      );
      var delJson = delResult.json || {};
      if (!delResult.res.ok || delJson.ok === false) {
        throw new Error(
          delJson.error ||
            delJson.message ||
            "Delete failed (" + delResult.res.status + ")"
        );
      }

      setItems(function (prev) {
        return prev.filter(function (r) {
          return r._id !== row._id;
        });
      });

      showStatus("success", "Request deleted.");
    } catch (err) {
      console.error("Delete maintenance error:", err);
      showStatus("error", err.message || "Delete failed.");
    } finally {
      setConfirmOpen(false);
      setRowToDelete(null);
    }
  }

 
  function handleMarkDone(row) {
    if (row.status === "Closed") return;

    setItems(function (prev) {
      return prev.map(function (r) {
        return r._id === row._id
          ? Object.assign({}, r, { status: "Closed" })
          : r;
      });
    });

    safeFetchJson(API_BASE + "/api/maintenance/" + row._id + "/status", {
      method: "POST",
      headers: getAuthHeaders(true),
      body: JSON.stringify({ status: "Closed" }),
    }).catch(function (err) {
      console.warn("Failed to update status on server:", err);
    });
  }

  
  return (
    <main className="p-4 sm:p-6 space-y-6">
     
      <StatusModal
        open={statusOpen}
        type={statusType}
        message={statusMessage}
        onClose={function () {
          setStatusOpen(false);
        }}
      />

    
      <ConfirmModal
        open={confirmOpen}
        message={
          rowToDelete ? "Delete request for room " + rowToDelete.roomNumber + "?" : ""
        }
        onCancel={function () {
          setConfirmOpen(false);
          setRowToDelete(null);
        }}
        onConfirm={confirmDelete}
      />

      {/* header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="text-sm text-gray-600 mt-1">
            Track maintenance requests and follow up on open issues.
          </p>
        </div>

        <button
          onClick={openAddForm}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm shadow hover:bg-blue-700"
        >
          + New Request
        </button>
      </div>

      <Card>
        {loading ? (
          <div className="p-4 text-gray-600">
            Loading maintenance requests…
          </div>
        ) : error ? (
          <div className="p-4 text-red-600">{error}</div>
        ) : (
          <>
            {/* filters */}
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <input
                aria-label="Search maintenance"
                type="text"
                placeholder="Search by room / issue / reporter..."
                className="border px-3 py-2 rounded text-sm flex-1 min-w-[220px]"
                value={search}
                onChange={function (e) {
                  setSearch(e.target.value);
                }}
              />

              <select
                className="border px-3 py-2 rounded text-sm"
                value={statusFilter}
                onChange={function (e) {
                  setStatusFilter(e.target.value);
                }}
              >
                <option value="all">All Status</option>
                <option value="Open">Open</option>
                <option value="In-progress">In-progress</option>
                <option value="Closed">Closed</option>
              </select>

              <select
                className="border px-3 py-2 rounded text-sm"
                value={priorityFilter}
                onChange={function (e) {
                  setPriorityFilter(e.target.value);
                }}
              >
                <option value="all">All Priority</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>

              <div className="ml-auto text-sm text-slate-500">
                {filteredItems.length} items
              </div>
            </div>

            
            <div className="overflow-x-auto w-full">
              <table className="min-w-full text-sm table-auto border-t border-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left font-semibold">Room</th>
                    <th className="px-3 py-2 text-left font-semibold">Issue</th>
                    <th className="px-3 py-2 text-left font-semibold">Type</th>
                    <th className="px-3 py-2 text-left font-semibold">
                      Priority
                    </th>
                    <th className="px-3 py-2 text-left font-semibold">Status</th>
                    <th className="px-3 py-2 text-left font-semibold">
                      Reported By
                    </th>
                    <th className="px-3 py-2 text-left font-semibold">
                      Reported On
                    </th>
                    <th className="px-3 py-2 text-right font-semibold">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredItems.length === 0 && (
                    <tr>
                      <td
                        colSpan="8"
                        className="px-3 py-6 text-center text-gray-500"
                      >
                        No maintenance requests found.
                      </td>
                    </tr>
                  )}

                  {filteredItems.map(function (row) {
                    var isClosed = row.status === "Closed";

                    return (
                      <tr key={row._id} className="border-t">
                        <td className="px-3 py-3">{row.roomNumber}</td>
                        <td className="px-3 py-3">{row.issue}</td>
                        <td className="px-3 py-3">{row.type}</td>
                        <td className="px-3 py-3">
                          <PriorityBadge value={row.priority} />
                        </td>
                        <td className="px-3 py-3">
                          <StatusBadge value={row.status} />
                        </td>
                        <td className="px-3 py-3">
                          {row.reportedBy || "—"}
                        </td>
                        <td className="px-3 py-3">
                          {row.reportedOn || "—"}
                        </td>
                        <td className="px-3 py-3 text-right space-x-3">
                          <button
                            onClick={function () {
                              handleMarkDone(row);
                            }}
                            className={
                              "text-green-600 text-xs " +
                              (isClosed ? "opacity-40 cursor-not-allowed" : "")
                            }
                            disabled={isClosed}
                          >
                            Mark Done
                          </button>
                          <button
                            onClick={function () {
                              openEditForm(row);
                            }}
                            className={
                              "text-blue-600 text-xs " +
                              (isClosed ? "opacity-40 cursor-not-allowed" : "")
                            }
                            disabled={isClosed}
                          >
                            Edit
                          </button>
                          <button
                            onClick={function () {
                              askDelete(row);
                            }}
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
            </div>
          </>
        )}
      </Card>

    
      {showForm && (
        <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-40">
          <div
            role="dialog"
            aria-modal="true"
            className="bg-white rounded-lg shadow-lg w-full max-w-xl p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold">
                {formMode === "add"
                  ? "New Maintenance Request"
                  : "Edit Request"}
              </h3>
              <button
                onClick={function () {
                  setShowForm(false);
                }}
                className="text-gray-500 hover:text-gray-700 text-lg"
                aria-label="Close"
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
                    ref={firstInputRef}
                    type="text"
                    inputMode="numeric"
                    placeholder="e.g. 103"
                    className="border px-3 py-2 rounded w-full text-sm"
                    value={formData.roomNumber}
                    onChange={function (e) {
                      handleFormChange("roomNumber", e.target.value);
                    }}
                    aria-label="Room number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Reported By (name)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Alice"
                    className="border px-3 py-2 rounded w-full text-sm"
                    value={formData.reportedBy}
                    onChange={function (e) {
                      handleFormChange("reportedBy", e.target.value);
                    }}
                    aria-label="Reported by"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Issue Title (brief)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Leaking tap in bathroom"
                  className="border px-3 py-2 rounded w-full text-sm"
                  value={formData.issue}
                  onChange={function (e) {
                    handleFormChange("issue", e.target.value);
                  }}
                  aria-label="Issue title"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Short summary — this shows on the list.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Type
                  </label>
                  <select
                    className="border px-3 py-2 rounded w-full text-sm"
                    value={formData.type}
                    onChange={function (e) {
                      handleFormChange("type", e.target.value);
                    }}
                  >
                    <option value="Plumbing">Plumbing</option>
                    <option value="Electrical">Electrical</option>
                    <option value="Cleaning">Cleaning</option>
                    <option value="Others">Others</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Priority
                  </label>
                  <select
                    className="border px-3 py-2 rounded w-full text-sm"
                    value={formData.priority}
                    onChange={function (e) {
                      handleFormChange("priority", e.target.value);
                    }}
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
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
                    <option value="Open">Open</option>
                    <option value="In-progress">In-progress</option>
                    <option value="Closed">Closed</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Reported On
                </label>
                <input
                  type="date"
                  className="border px-3 py-2 rounded w-full text-sm"
                  value={formData.reportedOn}
                  onChange={function (e) {
                    handleFormChange("reportedOn", e.target.value);
                  }}
                />
              </div>

              <div className="flex justify-end gap-3">
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
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 text-white rounded text-sm disabled:opacity-70"
                >
                  {saving
                    ? formMode === "add"
                      ? "Creating…"
                      : "Saving…"
                    : formMode === "add"
                    ? "Create Request"
                    : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
