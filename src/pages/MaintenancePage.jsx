
import React, { useEffect, useMemo, useRef, useState } from "react";
import Card from "../components/Card";
import StatusModal from "../components/StatusModal";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "";


async function safeFetchJson(url, opts) {
  const res = await fetch(url, opts);
  const text = await res.text();
  try {
    return { res, json: text ? JSON.parse(text) : {} };
  } catch (e) {
    return { res, json: { __rawText: text } };
  }
}



function StatusBadge(props) {
  const v = props.value || "Open";
  const cls =
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
  const v = props.value || "Medium";
  const cls =
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



export default function MaintenancePage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");

  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState("add"); 
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState("");

  const firstInputRef = useRef(null);

  const [formData, setFormData] = useState({
    roomNumber: "",
    issue: "",
    type: "Plumbing",
    priority: "Medium",
    status: "Open",
    reportedBy: "",
    reportedOn: "",
    _id: undefined,
  });

  
  const [statusOpen, setStatusOpen] = useState(false);
  const [statusType, setStatusType] = useState("success");
  const [statusMessage, setStatusMessage] = useState("");

  
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [rowToDelete, setRowToDelete] = useState(null);

  function showStatus(type, message) {
    setStatusType(type);
    setStatusMessage(message);
    setStatusOpen(true);
  }

  

  useEffect(function () {
    let mounted = true;

    async function load() {
      try {
        setLoading(true);
        setError("");

        const { json } = await safeFetchJson(API_BASE + "/api/maintenance");
        const list = Array.isArray(json)
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

  

  const filteredItems = useMemo(
    function () {
      const q = (search || "").trim().toLowerCase();
      return (items || []).filter(function (r) {
        const matchSearch =
          !q ||
          String(r.roomNumber || "").toLowerCase().indexOf(q) !== -1 ||
          String(r.issue || "").toLowerCase().indexOf(q) !== -1 ||
          String(r.reportedBy || "").toLowerCase().indexOf(q) !== -1;

        const matchStatus =
          statusFilter === "all" || (r.status || "") === statusFilter;

        const matchPriority =
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
    
    if ((row.status || "") === "Closed") return;

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
        const { res, json } = await safeFetchJson(
          API_BASE + "/api/maintenance",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(formData),
          }
        );

        if (!res.ok) {
          throw new Error(
            (json && (json.error || json.message)) ||
              "Create failed (" + res.status + ")"
          );
        }

        const created =
          json.request || json.data || (Array.isArray(json) ? json[0] : json);

        if (created) {
          setItems(function (prev) {
            return [created].concat(prev);
          });
        }

        setFeedback("Request created");
        setTimeout(function () {
          setFeedback("");
        }, 2500);
      } else {
        const id = formData._id;
        const payload = Object.assign({}, formData);
        delete payload._id;

        const { res, json } = await safeFetchJson(
          API_BASE + "/api/maintenance/" + id,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          }
        );

        if (!res.ok) {
          throw new Error(
            (json && (json.error || json.message)) ||
              "Update failed (" + res.status + ")"
          );
        }

        const updated = json.request || json.data || json;
        setItems(function (prev) {
          return prev.map(function (r) {
            return r._id === id ? updated : r;
          });
        });

        setFeedback("Request updated");
        setTimeout(function () {
          setFeedback("");
        }, 2500);
      }

      setShowForm(false);
    } catch (err) {
      console.error("Maintenance save error:", err);
      showStatus("error", err.message || "Failed to save request.");
    } finally {
      setSaving(false);
    }
  }



  function handleDeleteClick(row) {
    setRowToDelete(row);
    setConfirmOpen(true);
  }

  async function handleConfirmDelete() {
    if (!rowToDelete) return;

    try {
      const { res, json } = await safeFetchJson(
        API_BASE + "/api/maintenance/" + rowToDelete._id,
        { method: "DELETE" }
      );

      if (!res.ok) {
        throw new Error(
          (json && (json.error || json.message)) ||
            "Delete failed (" + res.status + ")"
        );
      }

      setItems(function (prev) {
        return prev.filter(function (r) {
          return r._id !== rowToDelete._id;
        });
      });

      showStatus("success", "Request deleted successfully.");
    } catch (err) {
      console.error("Delete maintenance error:", err);
      showStatus("error", err.message || "Failed to delete request.");
    } finally {
      setConfirmOpen(false);
      setRowToDelete(null);
    }
  }

  

  function handleMarkDone(row) {
    if (row.status === "Closed") return;

    const updatedRow = Object.assign({}, row, { status: "Closed" });

    setItems(function (prev) {
      return prev.map(function (r) {
        return r._id === row._id ? updatedRow : r;
      });
    });

    fetch(API_BASE + "/api/maintenance/" + row._id + "/status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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

      
      <StatusModal
        open={confirmOpen}
        type="warning"
        message={
          rowToDelete
            ? "Delete request for room " + rowToDelete.roomNumber + "?"
            : ""
        }
        onClose={function () {
          setConfirmOpen(false);
          setRowToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        confirmLabel="Delete"
        cancelLabel="Cancel"
      />

      
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

      {feedback && (
        <div className="text-sm text-emerald-700 bg-emerald-50 rounded px-3 py-2 inline-block">
          {feedback}
        </div>
      )}

      <Card>
        {loading ? (
          <div className="p-4 text-gray-600">Loading maintenance requests…</div>
        ) : error ? (
          <div className="p-4 text-red-600">{error}</div>
        ) : (
          <>
           
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
                    <th className="px-3 py-2 text-left font-semibold">
                      Status
                    </th>
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
                    const isClosed = (row.status || "") === "Closed";

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
                              (isClosed
                                ? "opacity-40 cursor-not-allowed"
                                : "hover:underline")
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
                              (isClosed
                                ? "opacity-40 cursor-not-allowed"
                                : "hover:underline")
                            }
                            disabled={isClosed}
                          >
                            Edit
                          </button>
                          <button
                            onClick={function () {
                              handleDeleteClick(row);
                            }}
                            className="text-red-600 text-xs hover:underline"
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
