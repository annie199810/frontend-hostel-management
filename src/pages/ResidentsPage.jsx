import React, { useEffect, useMemo, useState } from "react";
import Card from "../components/Card";
import StatusModal from "../components/StatusModal";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

function getAuthHeaders(json) {
  const h = {};
  const t = localStorage.getItem("token");
  if (json) h["Content-Type"] = "application/json";
  if (t) h.Authorization = "Bearer " + t;
  return h;
}

function StatusBadge({ value }) {
  const v = value === "inactive" ? "Inactive" : "Active";
  const cls =
    value === "inactive"
      ? "bg-gray-100 text-gray-600"
      : "bg-emerald-50 text-emerald-700";
  return <span className={`px-2 py-0.5 rounded-full text-xs ${cls}`}>{v}</span>;
}

export default function ResidentsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [mode, setMode] = useState("add");

  const [form, setForm] = useState({
    _id: null,
    name: "",
    roomNumber: "",
    phone: "",
    status: "active",
  });

  const [status, setStatus] = useState({ open: false, type: "", msg: "" });

  function toast(type, msg) {
    setStatus({ open: true, type, msg });
  }

  useEffect(loadResidents, []);

  function loadResidents() {
    setLoading(true);
    fetch(API_BASE + "/api/residents", { headers: getAuthHeaders() })
      .then((r) => r.json())
      .then((d) => setItems(d.residents || []))
      .finally(() => setLoading(false));
  }

  function submit(e) {
    e.preventDefault();

    const payload = {
      name: form.name.trim(),
      phone: form.phone.trim(),
      roomNumber: String(form.roomNumber).trim(),
      status: form.status,
    };

    const url =
      mode === "add"
        ? "/api/residents"
        : "/api/residents/" + form._id;

    fetch(API_BASE + url, {
      method: mode === "add" ? "POST" : "PUT",
      headers: getAuthHeaders(true),
      body: JSON.stringify(payload),
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.ok) {
          toast("success", `Resident ${mode === "add" ? "added" : "updated"}`);
          setShowForm(false);
          loadResidents();
        } else {
          toast("error", d.error);
        }
      })
      .catch(() => toast("error", "Server error"));
  }

  function del(row) {
    fetch(API_BASE + "/api/residents/" + row._id, {
      method: "DELETE",
      headers: getAuthHeaders(),
    })
      .then(() => {
        toast("success", "Resident deleted");
        setItems(items.filter((x) => x._id !== row._id));
      });
  }

  return (
    <>
      <StatusModal
        open={status.open}
        type={status.type}
        message={status.msg}
        onClose={() => setStatus({ ...status, open: false })}
      />

      <main className="p-6">
        <div className="flex justify-between mb-4">
          <h2 className="text-xl font-semibold">Residents</h2>
          <button
            onClick={() => {
              setMode("add");
              setForm({ name: "", roomNumber: "", phone: "", status: "active" });
              setShowForm(true);
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            + Add Resident
          </button>
        </div>

        <Card>
          {loading ? (
            <p className="p-4">Loading...</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th>Name</th>
                  <th>Room</th>
                  <th>Phone</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {items.map((r) => (
                  <tr key={r._id} className="border-b">
                    <td>{r.name}</td>
                    <td>{r.roomNumber}</td>
                    <td>{r.phone}</td>
                    <td><StatusBadge value={r.status} /></td>
                    <td className="text-right">
                      <button
                        className="text-blue-600 mr-2"
                        onClick={() => {
                          setMode("edit");
                          setForm(r);
                          setShowForm(true);
                        }}
                      >
                        Edit
                      </button>
                      <button className="text-red-600" onClick={() => del(r)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>

        {showForm && (
          <div className="fixed inset-0 flex items-center justify-center modal-backdrop">
            <form onSubmit={submit} className="bg-white p-6 rounded w-[400px]">
              <h3 className="font-semibold mb-4">
                {mode === "add" ? "Add Resident" : "Edit Resident"}
              </h3>

              <input
                className="border p-2 w-full mb-2"
                placeholder="Name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
              <input
                className="border p-2 w-full mb-2"
                placeholder="Room Number"
                value={form.roomNumber}
                onChange={(e) =>
                  setForm({ ...form, roomNumber: e.target.value })
                }
              />
              <input
                className="border p-2 w-full mb-2"
                placeholder="Phone"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />

              <select
                className="border p-2 w-full mb-4"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="border px-3 py-1 rounded"
                >
                  Cancel
                </button>
                <button className="bg-blue-600 text-white px-3 py-1 rounded">
                  Save
                </button>
              </div>
            </form>
          </div>
        )}
      </main>
    </>
  );
}
