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


function ConfirmModal({ open, message, onCancel, onConfirm }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/40" />

      <div className="relative z-10 bg-white w-full max-w-sm rounded-2xl shadow-xl p-6 text-center border">
        <div className="text-yellow-500 text-5xl mb-3">⚠</div>

        <h2 className="text-xl font-semibold mb-2 text-amber-700">
          CONFIRM
        </h2>

        <p className="text-slate-600 mb-5 leading-relaxed">{message}</p>

        <div className="flex justify-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-lg border text-sm text-slate-700 hover:bg-slate-100"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
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
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");

  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState("add");
  const [saving, setSaving] = useState(false);

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
  const [itemToDelete, setItemToDelete] = useState(null);

  function showStatus(type, msg) {
    setStatusType(type);
    setStatusMessage(msg);
    setStatusOpen(true);
  }

  
  useEffect(function () {
    let mounted = true;

    async function load() {
      try {
        setLoading(true);
        setError("");

        const { json, res } = await safeFetchJson(
          API_BASE + "/api/maintenance",
          { headers: getAuthHeaders(false) }
        );

        if (!res.ok) {
          throw new Error(
            (json && (json.error || json.message)) ||
              "Failed to load maintenance (" + res.status + ")"
          );
        }

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
        const { res, json } = await safeFetchJson(
          API_BASE + "/api/maintenance",
          {
            method: "POST",
            headers: getAuthHeaders(true),
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

        showStatus("success", "Request created");
      } else {
        const id = formData._id;
        const payload = Object.assign({}, formData);
        delete payload._id;

        const { res, json } = await safeFetchJson(
          API_BASE + "/api/maintenance/" + id,
          {
            method: "PUT",
            headers: getAuthHeaders(true),
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

        showStatus("success", "Request updated");
      }

      setShowForm(false);
    } catch (err) {
      console.error("Maintenance save error:", err);
      showStatus("error", err.message || "Failed to save request.");
    } finally {
      setSaving(false);
    }
  }

  
  function handleDelete(row) {
    setItemToDelete(row);
    setConfirmOpen(true);
  }

  async function handleConfirmDelete() {
    const row = itemToDelete;
    if (!row) {
      setConfirmOpen(false);
      return;
    }

    try {
      const { res, json } = await safeFetchJson(
        API_BASE + "/api/maintenance/" + row._id,
        {
          method: "DELETE",
          headers: getAuthHeaders(false),
        }
      );

      if (!res.ok) {
        throw new Error(
          (json && (json.error || json.message)) ||
            "Delete failed (" + res.status + ")"
        );
      }

      setItems(function (prev) {
        return prev.filter(function (r) {
          return r._id !== row._id;
        });
      });

      showStatus("success", "Request deleted");
    } catch (err) {
      console.error("Delete maintenance error:", err);
      showStatus("error", err.message || "Delete failed");
    } finally {
      setConfirmOpen(false);
      setItemToDelete(null);
    }
  }


  async function handleMarkDone(row) {
    if (row.status === "Closed") return;

    
    setItems(function (prev) {
      return prev.map(function (r) {
        return r._id === row._id
          ? Object.assign({}, r, { status: "Closed" })
          : r;
      });
    });

    try {
      await fetch(API_BASE + "/api/maintenance/" + row._id + "/status", {
        method: "POST",
        headers: getAuthHeaders(true),
        body: JSON.stringify({ status: "Closed" }),
      });
    } catch (err) {
      console.warn("Failed to update status on server:", err);
    }
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
          itemToDelete
            ? "Delete request for room " + itemToDelete.roomNumber + "?"
            : ""
        }
        onCancel={function () {
          setConfirmOpen(false);
          setItemToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
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

      <Card>
        {loading ? (
          <div className="p-4 text-gray-600">
            Loading maintenance requests…
          </div>
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
                            className="text-green-600 text-xs disabled:opacity-40"
                            disabled={row.status === "Closed"}
                          >
                            Mark Done
                          </button>
                          <button
                            onClick={function () {
                              openEditForm(row);
                            }}
                            className="text-blue-600 text-xs disabled:opacity-40"
                            disabled={row.status === "Closed"}
                          >
                            Edit
                          </button>
                          <button
                            onClick={function () {
                              handleDelete(row);
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

    
    </main>
  );
}
