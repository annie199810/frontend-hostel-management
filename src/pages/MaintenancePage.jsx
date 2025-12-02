import React, { useEffect, useMemo, useState } from "react";
import Card from "../components/Card";

// 👇 ADD THIS
var API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

function StatusBadge(props) {
  var v = props.value || "";
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
  var v = props.value || "";
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

export default function MaintenancePage() {
  var [items, setItems] = useState([]);
  var [loading, setLoading] = useState(true);

  var [search, setSearch] = useState("");
  var [statusFilter, setStatusFilter] = useState("all");
  var [priorityFilter, setPriorityFilter] = useState("all");

  var [showForm, setShowForm] = useState(false);
  var [formMode, setFormMode] = useState("add");

  var [formData, setFormData] = useState({
    roomNumber: "",
    issue: "",
    type: "Plumbing",
    priority: "Medium",
    status: "Open",
    reportedBy: "",
    reportedOn: "",
  });

  // ⬇⬇ CHANGED: use API_BASE instead of localhost
  useEffect(function () {
    fetch(API_BASE + "/api/maintenance")
      .then(function (res) {
        return res.json();
      })
      .then(function (data) {
        setItems(data.requests || []);
        setLoading(false);
      })
      .catch(function (err) {
        //console.error("Error loading maintenance:", err);
        setLoading(false);
      });
  }, []);

  var filteredItems = useMemo(
    function () {
      var text = search.toLowerCase();

      return items.filter(function (r) {
        var matchSearch =
          !text ||
          r.roomNumber.toLowerCase().includes(text) ||
          r.issue.toLowerCase().includes(text) ||
          (r.reportedBy || "").toLowerCase().includes(text);

        var matchStatus =
          statusFilter === "all" || r.status === statusFilter;

        var matchPriority =
          priorityFilter === "all" || r.priority === priorityFilter;

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
      reportedOn: "",
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

    if (!formData.roomNumber || !formData.issue) {
      alert("Please enter room number and issue.");
      return;
    }

    var payload = {
      roomNumber: formData.roomNumber,
      issue: formData.issue,
      type: formData.type,
      priority: formData.priority,
      status: formData.status,
      reportedBy: formData.reportedBy,
      reportedOn: formData.reportedOn,
    };

    // ⬇⬇ CHANGED: use API_BASE instead of localhost
    fetch(API_BASE + "/api/maintenance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then(function (res) {
        return res.json();
      })
      .then(function (data) {
        if (data.ok) {
          setItems(function (prev) {
            return [data.request].concat(prev);
          });
          setShowForm(false);
        } else {
          alert("Failed to create maintenance request");
        }
      })
      .catch(function (err) {
       // console.error("Error creating maintenance:", err);
        alert("Failed to create maintenance request");
      });
  }

  function handleDelete(row) {
    if (!window.confirm("Delete request for room " + row.roomNumber + "?"))
      return;

    // (still local-only delete)
    setItems(function (prev) {
      return prev.filter(function (r) {
        return r._id !== row._id;
      });
    });
  }

  function handleMarkDone(row) {
    // (still local-only status change)
    setItems(function (prev) {
      return prev.map(function (r) {
        return r._id === row._id ? { ...r, status: "Closed" } : r;
      });
    });
  }

  return (
    <main className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold">Maintenance Requests</h2>

        <button
          onClick={openAddForm}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm"
        >
          + New Request
        </button>
      </div>

      <Card>
        {loading ? (
          <p className="p-4 text-gray-600">Loading...</p>
        ) : (
          <>
            <div className="flex gap-3 mb-4">
              <input
                type="text"
                placeholder="Search..."
                className="border px-3 py-2 rounded text-sm flex-1"
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
            </div>

            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-3 py-2">Room</th>
                  <th className="px-3 py-2">Issue</th>
                  <th className="px-3 py-2">Type</th>
                  <th className="px-3 py-2">Priority</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Reported By</th>
                  <th className="px-3 py-2">Reported On</th>
                  <th className="px-3 py-2 text-right">Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredItems.map(function (row) {
                  return (
                    <tr key={row._id} className="border-t">
                      <td className="px-3 py-2">{row.roomNumber}</td>
                      <td className="px-3 py-2">{row.issue}</td>
                      <td className="px-3 py-2">{row.type}</td>
                      <td className="px-3 py-2">
                        <PriorityBadge value={row.priority} />
                      </td>
                      <td className="px-3 py-2">
                        <StatusBadge value={row.status} />
                      </td>
                      <td className="px-3 py-2">{row.reportedBy}</td>
                      <td className="px-3 py-2">{row.reportedOn}</td>
                      <td className="px-3 py-2 text-right space-x-2">
                        <button
                          onClick={function () {
                            handleMarkDone(row);
                          }}
                          className="text-green-600 text-xs"
                        >
                          Mark Done
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

                {filteredItems.length === 0 && (
                  <tr>
                    <td
                      colSpan="8"
                      className="px-3 py-4 text-center text-gray-500"
                    >
                      No maintenance requests found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </>
        )}
      </Card>

      {showForm && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-20">
          <div className="bg-white rounded-lg p-6 w-full max-w-xl">
            <h3 className="text-xl font-semibold mb-4">
              New Maintenance Request
            </h3>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Room Number"
                  className="border px-3 py-2 rounded"
                  value={formData.roomNumber}
                  onChange={function (e) {
                    handleFormChange("roomNumber", e.target.value);
                  }}
                />

                <input
                  type="text"
                  placeholder="Reported By"
                  className="border px-3 py-2 rounded"
                  value={formData.reportedBy}
                  onChange={function (e) {
                    handleFormChange("reportedBy", e.target.value);
                  }}
                />
              </div>

              <input
                type="text"
                placeholder="Issue Title"
                className="border px-3 py-2 rounded w-full"
                value={formData.issue}
                onChange={function (e) {
                  handleFormChange("issue", e.target.value);
                }}
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <select
                  className="border px-3 py-2 rounded"
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

                <select
                  className="border px-3 py-2 rounded"
                  value={formData.priority}
                  onChange={function (e) {
                    handleFormChange("priority", e.target.value);
                  }}
                >
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>

                <select
                  className="border px-3 py-2 rounded"
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

              <input
                type="date"
                className="border px-3 py-2 rounded"
                value={formData.reportedOn}
                onChange={function (e) {
                  handleFormChange("reportedOn", e.target.value);
                }}
              />

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={function () {
                    setShowForm(false);
                  }}
                  className="px-4 py-2 border rounded"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded"
                >
                  Create Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
