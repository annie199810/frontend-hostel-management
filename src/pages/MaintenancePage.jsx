
import React, { useEffect, useMemo, useRef, useState } from "react";
import Card from "../components/Card";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "";


async function safeFetchJson(url, opts) {
  const res = await fetch(url, opts);
  const text = await res.text();
  try {
    return { res, json: text ? JSON.parse(text) : {} };
  } catch {
    return { res, json: { __rawText: text } };
  }
}

function StatusBadge({ value }) {
  const v = value || "Open";
  const cls =
    v === "Open"
      ? "bg-red-50 text-red-700"
      : v === "In-progress"
      ? "bg-amber-50 text-amber-700"
      : "bg-green-50 text-green-700";
  return <span className={"px-2 py-0.5 rounded-full text-xs font-medium " + cls}>{v}</span>;
}

function PriorityBadge({ value }) {
  const v = value || "Medium";
  const cls =
    v === "High"
      ? "bg-red-50 text-red-700"
      : v === "Medium"
      ? "bg-amber-50 text-amber-700"
      : "bg-sky-50 text-sky-700";
  return <span className={"px-2 py-0.5 rounded-full text-xs font-medium " + cls}>{v}</span>;
}


export default function MaintenancePage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");

  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState("add"); // add | edit
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

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setLoading(true);
        setError("");
        const { json } = await safeFetchJson(API_BASE + "/api/maintenance");
        const list = Array.isArray(json) ? json : json.requests || json.data || [];
        if (mounted) setItems(list);
      } catch (err) {
        console.error("Maintenance load error:", err);
        if (mounted) setError("Failed to load maintenance requests.");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => (mounted = false);
  }, []);

  const filteredItems = useMemo(() => {
    const q = (search || "").trim().toLowerCase();
    return (items || []).filter((r) => {
      const matchSearch =
        !q ||
        String(r.roomNumber || "").toLowerCase().includes(q) ||
        String(r.issue || "").toLowerCase().includes(q) ||
        String(r.reportedBy || "").toLowerCase().includes(q);

      const matchStatus = statusFilter === "all" || (r.status || "") === statusFilter;
      const matchPriority = priorityFilter === "all" || (r.priority || "") === priorityFilter;
      return matchSearch && matchStatus && matchPriority;
    });
  }, [items, search, statusFilter, priorityFilter]);

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
   
    setTimeout(() => firstInputRef.current?.focus?.(), 60);
  }

  function openEditForm(row) {
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
    setTimeout(() => firstInputRef.current?.focus?.(), 60);
  }

  function handleFormChange(field, value) {
    setFormData((p) => ({ ...p, [field]: value }));
  }

  async function handleFormSubmit(e) {
    e.preventDefault();
    if (!formData.roomNumber || !formData.issue) {
      alert("Please enter room number and a short issue title.");
      return;
    }

    try {
      setSaving(true);
      if (formMode === "add") {
        const { res, json } = await safeFetchJson(API_BASE + "/api/maintenance", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        if (!res.ok) {
          throw new Error(json?.error || json?.message || `Create failed (${res.status})`);
        }
        const created = json.request || json.data || (Array.isArray(json) ? json[0] : json);
        if (created) setItems((prev) => [created, ...prev]);
        setFeedback("Request created");
        setTimeout(() => setFeedback(""), 2500);
      } else {
        const id = formData._id;
        const payload = { ...formData };
        delete payload._id;
        const { res, json } = await safeFetchJson(API_BASE + "/api/maintenance/" + id, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          throw new Error(json?.error || json?.message || `Update failed (${res.status})`);
        }
        const updated = json.request || json.data || json;
        setItems((prev) => prev.map((r) => (r._id === id ? updated : r)));
        setFeedback("Request updated");
        setTimeout(() => setFeedback(""), 2500);
      }
      setShowForm(false);
    } catch (err) {
      console.error("Maintenance save error:", err);
      alert(err.message || "Failed to save request.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(row) {
    if (!window.confirm(`Delete request for room ${row.roomNumber}?`)) return;
    try {
      const { res } = await safeFetchJson(API_BASE + "/api/maintenance/" + row._id, { method: "DELETE" });
      if (res.ok) {
        setItems((prev) => prev.filter((r) => r._id !== row._id));
        return;
      }
     
      setItems((prev) => prev.filter((r) => r._id !== row._id));
    } catch (err) {
      console.error("Delete maintenance error:", err);
      setItems((prev) => prev.filter((r) => r._id !== row._id));
    }
  }

  function handleMarkDone(row) {
    setItems((prev) => prev.map((r) => (r._id === row._id ? { ...r, status: "Closed" } : r)));
   
    fetch(API_BASE + "/api/maintenance/" + row._id + "/status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "Closed" }),
    }).catch((err) => {
      console.warn("Failed to update status on server:", err);
    });
  }

  return (
    <main className="p-6 space-y-6 container-responsive">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold">Maintenance Requests</h2>

        <div className="flex items-center gap-3">
          <button
            onClick={openAddForm}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm shadow hover:bg-blue-700"
          >
            + New Request
          </button>
        </div>
      </div>

      {feedback && (
        <div className="text-sm text-emerald-700 bg-emerald-50 rounded px-3 py-2 w-max">
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
            <div className="flex gap-3 mb-4 flex-wrap items-center">
              <input
                aria-label="Search maintenance"
                type="text"
                placeholder="Search by room / issue / reporter..."
                className="border px-3 py-2 rounded text-sm flex-1 min-w-[200px]"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />

              <select className="border px-3 py-2 rounded text-sm" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="all">All Status</option>
                <option value="Open">Open</option>
                <option value="In-progress">In-progress</option>
                <option value="Closed">Closed</option>
              </select>

              <select className="border px-3 py-2 rounded text-sm" value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
                <option value="all">All Priority</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>

              <div className="ml-auto text-sm text-slate-500">{filteredItems.length} items</div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-3 py-2 text-left">Room</th>
                    <th className="px-3 py-2 text-left">Issue</th>
                    <th className="px-3 py-2 text-left">Type</th>
                    <th className="px-3 py-2 text-left">Priority</th>
                    <th className="px-3 py-2 text-left">Status</th>
                    <th className="px-3 py-2 text-left">Reported By</th>
                    <th className="px-3 py-2 text-left">Reported On</th>
                    <th className="px-3 py-2 text-right">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredItems.length === 0 && (
                    <tr>
                      <td colSpan="8" className="px-3 py-6 text-center text-gray-500">
                        No maintenance requests found.
                      </td>
                    </tr>
                  )}

                  {filteredItems.map((row) => (
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
                      <td className="px-3 py-3">{row.reportedBy || "—"}</td>
                      <td className="px-3 py-3">{row.reportedOn || "—"}</td>
                      <td className="px-3 py-3 text-right space-x-3">
                        <button onClick={() => handleMarkDone(row)} className="text-green-600 text-xs">
                          Mark Done
                        </button>
                        <button onClick={() => openEditForm(row)} className="text-blue-600 text-xs">
                          Edit
                        </button>
                        <button onClick={() => handleDelete(row)} className="text-red-600 text-xs">
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Card>

    
      {showForm && (
        <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-40">
          <div role="dialog" aria-modal="true" className="bg-white rounded-lg shadow-lg w-full max-w-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold">{formMode === "add" ? "New Maintenance Request" : "Edit Request"}</h3>
              <button onClick={() => setShowForm(false)} className="text-gray-500 hover:text-gray-700 text-lg" aria-label="Close">×</button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Room Number</label>
                  <input
                    ref={firstInputRef}
                    type="text"
                    inputMode="numeric"
                    placeholder="e.g. 103"
                    className="border px-3 py-2 rounded w-full text-sm"
                    value={formData.roomNumber}
                    onChange={(e) => handleFormChange("roomNumber", e.target.value)}
                    aria-label="Room number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Reported By (name)</label>
                  <input
                    type="text"
                    placeholder="e.g. Alice"
                    className="border px-3 py-2 rounded w-full text-sm"
                    value={formData.reportedBy}
                    onChange={(e) => handleFormChange("reportedBy", e.target.value)}
                    aria-label="Reported by"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Issue Title (brief)</label>
                <input
                  type="text"
                  placeholder="e.g. Leaking tap in bathroom"
                  className="border px-3 py-2 rounded w-full text-sm"
                  value={formData.issue}
                  onChange={(e) => handleFormChange("issue", e.target.value)}
                  aria-label="Issue title"
                />
                <p className="text-xs text-gray-400 mt-1">Short summary — this shows on the list.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Type</label>
                  <select className="border px-3 py-2 rounded w-full text-sm" value={formData.type} onChange={(e) => handleFormChange("type", e.target.value)}>
                    <option value="Plumbing">Plumbing</option>
                    <option value="Electrical">Electrical</option>
                    <option value="Cleaning">Cleaning</option>
                    <option value="Others">Others</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Priority</label>
                  <select className="border px-3 py-2 rounded w-full text-sm" value={formData.priority} onChange={(e) => handleFormChange("priority", e.target.value)}>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Status</label>
                  <select className="border px-3 py-2 rounded w-full text-sm" value={formData.status} onChange={(e) => handleFormChange("status", e.target.value)}>
                    <option value="Open">Open</option>
                    <option value="In-progress">In-progress</option>
                    <option value="Closed">Closed</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Reported On</label>
                <input type="date" className="border px-3 py-2 rounded w-full text-sm" value={formData.reportedOn} onChange={(e) => handleFormChange("reportedOn", e.target.value)} />
              </div>

              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border rounded text-sm">Cancel</button>
                <button type="submit" disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded text-sm">
                  {saving ? (formMode === "add" ? "Creating…" : "Saving…") : (formMode === "add" ? "Create Request" : "Save Changes")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
