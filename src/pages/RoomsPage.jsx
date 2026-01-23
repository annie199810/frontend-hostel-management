import React, { useEffect, useState } from "react";
import Card from "../components/Card";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

function getAuthHeaders(json) {
  const h = {};
  const token = localStorage.getItem("token");
  if (json) h["Content-Type"] = "application/json";
  if (token) h["Authorization"] = "Bearer " + token;
  return h;
}

function StatusBadge({ value }) {
  const map = {
    available: "bg-green-100 text-green-700",
    occupied: "bg-blue-100 text-blue-700",
    maintenance: "bg-yellow-100 text-yellow-700",
  };
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium ${map[value]}`}>
      {value}
    </span>
  );
}

function Toast({ show, message, type = "success" }) {
  if (!show) return null;

  const bg =
    type === "error" ? "bg-red-600" : "bg-green-600";

  return (
    <div className={`fixed top-6 right-6 ${bg} text-white px-4 py-3 rounded-xl shadow-lg z-50`}>
      {message}
    </div>
  );
}



function DeleteModal({ open, room, onCancel, onConfirm }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/40 z-40 flex items-center justify-center">
      <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-xl">
        <h3 className="text-lg font-semibold mb-2">Delete Room</h3>
        <p className="text-sm text-gray-600 mb-6">
          Are you sure you want to delete room <b>{room?.number}</b>?
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 border rounded-lg text-sm"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

export default function RoomManagementPage() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
const [toastMsg, setToastMsg] = useState("");
const [toastType, setToastType] = useState("success");

  const [showForm, setShowForm] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({
    number: "",
    type: "single",
    ac: "NON",
    status: "available",
    pricePerMonth: "",
  });

  const [deleteRoom, setDeleteRoom] = useState(null);
 

  useEffect(() => {
    fetch(API_BASE + "/api/rooms", { headers: getAuthHeaders() })
      .then((r) => r.json())
      .then((d) => setRooms(d.rooms || []))
      .finally(() => setLoading(false));
  }, []);


  if (!form.number.trim()) {
  setToastType("error");
  setToastMsg("Room number is required");
  setTimeout(() => setToastMsg(""), 2500);
  return;
}

 function saveRoom(e) {
  e.preventDefault();

  const url = editMode
    ? API_BASE + "/api/rooms/" + form._id
    : API_BASE + "/api/rooms";

  const method = editMode ? "PUT" : "POST";

  fetch(url, {
    method,
    headers: getAuthHeaders(true),
    body: JSON.stringify(form),
  })
    .then(async (res) => {
      const data = await res.json();

     
      if (!res.ok) {
        setToastType("error");
        setToastMsg(data.error || "Something went wrong");
        setTimeout(() => setToastMsg(""), 3000);
        return;
      }

   
      setToastType("success");
      setToastMsg("Room saved successfully");
      setShowForm(false);

      setTimeout(() => setToastMsg(""), 2500);

      fetch(API_BASE + "/api/rooms", { headers: getAuthHeaders() })
        .then((r) => r.json())
        .then((d) => setRooms(d.rooms));
    })
    .catch(() => {
      setToastType("error");
      setToastMsg("Server error. Please try again.");
      setTimeout(() => setToastMsg(""), 3000);
    });
}



 function confirmDelete() {
  fetch(API_BASE + "/api/rooms/" + deleteRoom._id, {
    method: "DELETE",
    headers: getAuthHeaders(),
  })
    .then((res) => res.json())
    .then((data) => {
      
      if (data.ok === false) {
        setToastType("error");
        setToastMsg(data.error || "Failed to delete room");
        setTimeout(() => setToastMsg(""), 2500);
        return;
      }

     
      setRooms((p) => p.filter((r) => r._id !== deleteRoom._id));
      setDeleteRoom(null);

      setToastType("success");
      setToastMsg("Room deleted successfully");
      setTimeout(() => setToastMsg(""), 2500);
    })
    .catch(() => {
      setToastType("error");
      setToastMsg("Something went wrong. Try again.");
      setTimeout(() => setToastMsg(""), 2500);
    });
}


  return (
    <>
      <Toast show={!!toastMsg} message={toastMsg} type={toastType} />
      <DeleteModal
        open={!!deleteRoom}
        room={deleteRoom}
        onCancel={() => setDeleteRoom(null)}
        onConfirm={confirmDelete}
      />

    
      <main className="p-6 space-y-6">
    
        <div className="flex items-center justify-between">
          <div>           
            <p className="text-sm text-gray-500 mt-1">
              Manage hostel room inventory & pricing
            </p>
          </div>
          <button
            onClick={() => {
              setEditMode(false);
              setForm({
                number: "",
                type: "single",
                ac: "NON",
                status: "available",
                pricePerMonth: "",
              });
              setShowForm(true);
            }}
            className="bg-blue-600 text-white px-5 py-2.5 rounded-xl shadow hover:bg-blue-700"
          >
            + Add New Room
          </button>
        </div>

      
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left">Room</th>
                  <th className="px-6 py-4 text-left">Type</th>
                  <th className="px-6 py-4 text-left">AC</th>
                  <th className="px-6 py-4 text-left">Status</th>
                  <th className="px-6 py-4 text-right">Price</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rooms.map((r) => (
                  <tr key={r._id} className="border-t hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium">{r.number}</td>
                    <td className="px-6 py-4 capitalize">{r.type}</td>
                    <td className="px-6 py-4">{r.ac}</td>
                    <td className="px-6 py-4">
                      <StatusBadge value={r.status} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      ₹{r.pricePerMonth}
                    </td>
                    <td className="px-6 py-4 text-right space-x-3">
                      <button
                        onClick={() => {
                          setEditMode(true);
                          setForm(r);
                          setShowForm(true);
                        }}
                        className="text-blue-600 text-xs"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setDeleteRoom(r)}
                        className="text-red-600 text-xs"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

       
        {showForm && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-40">
            <form
              onSubmit={saveRoom}
              className="bg-white w-full max-w-lg rounded-2xl p-6 space-y-5"
            >
              <h3 className="text-xl font-semibold">
                {editMode ? "Edit Room" : "Add New Room"}
              </h3>

              <input
                className="w-full border px-4 py-2 rounded-lg"
                placeholder="Room Number"
                value={form.number}
                onChange={(e) => setForm({ ...form, number: e.target.value })}
              />

              <div className="grid grid-cols-2 gap-4">
                <select
                  className="border px-4 py-2 rounded-lg"
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                >
                  <option value="single">Single</option>
                  <option value="double">Double</option>
                </select>

                <select
                  className="border px-4 py-2 rounded-lg"
                  value={form.ac}
                  onChange={(e) => setForm({ ...form, ac: e.target.value })}
                >
                  <option value="NON">Non AC</option>
                  <option value="AC">AC</option>
                </select>
              </div>

              <input
                type="number"
                className="w-full border px-4 py-2 rounded-lg"
                placeholder="Monthly Price"
                value={form.pricePerMonth}
                onChange={(e) =>
                  setForm({ ...form, pricePerMonth: e.target.value })
                }
              />

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 border rounded-lg"
                >
                  Cancel
                </button>
                <button className="px-5 py-2 bg-blue-600 text-white rounded-lg">
                  Save Room
                </button>
              </div>
            </form>
          </div>
        )}
      </main>
    </>
  );
}
