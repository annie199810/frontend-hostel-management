
import React, { useEffect, useMemo, useState } from "react";
import Card from "../components/Card";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "";


function StatusBadge(props) {
  const raw = props.value || "active";
  const v = String(raw).toLowerCase();

  const cls =
    v === "checked-out"
      ? "bg-gray-100 text-gray-700"
      : "bg-emerald-50 text-emerald-700";

  const label = v === "checked-out" ? "Checked-Out" : "Active";

  return (
    <span className={"px-2 py-0.5 rounded-full text-xs font-medium " + cls}>
      {label}
    </span>
  );
}


function AvatarEmoji(props) {
  var gender = props.gender || "";
  var g = gender.toLowerCase();
  var emoji = g === "female" ? "👩" : g === "male" ? "👨" : "🙂";

  return (
    <div className="avatar-circle">
      <span role="img" aria-label="avatar">
        {emoji}
      </span>
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
    gender: "",
    status: "active",
    checkIn: "",
  });

 
  useEffect(function () {
    var mounted = true;

    async function load() {
      try {
        setLoading(true);
        setError("");

        var res = await fetch(API_BASE + "/api/residents");
        var json = await res.json();

        if (!res.ok || (json && json.ok === false)) {
          if (mounted) {
            setError(
              (json && json.error) || "Failed to load residents"
            );
          }
          return;
        }

        if (mounted) {
          setItems(json.residents || json.data || []);
        }
      } catch (err) {
        console.error("Residents load error:", err);
        if (mounted) setError("Failed to load residents");
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
      var text = (search || "").toLowerCase();

      return (items || []).filter(function (r) {
        var matchSearch =
          !text ||
          (r.name &&
            r.name.toLowerCase().indexOf(text) !== -1) ||
          (r.roomNumber &&
            String(r.roomNumber)
              .toLowerCase()
              .indexOf(text) !== -1) ||
          (r.phone &&
            String(r.phone)
              .toLowerCase()
              .indexOf(text) !== -1);

        var itemStatus = (r.status || "active").toLowerCase();
        var matchStatus =
          statusFilter === "all" || itemStatus === statusFilter;

        return matchSearch && matchStatus;
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
      gender: "",
      status: "active",
      checkIn: new Date().toISOString().slice(0, 10),
    });
    setShowForm(true);
  }

  function openEditForm(row) {
    setFormMode("edit");
    setFormData({
      _id: row._id,
      name: row.name || "",
      roomNumber: row.roomNumber || "",
      phone: row.phone || "",
      gender: row.gender || "",
      status: (row.status || "active").toLowerCase(),
      checkIn: row.checkIn || "",
    });
    setShowForm(true);
  }

  function handleFormChange(field, value) {
    setFormData(function (prev) {
      return Object.assign({}, prev, { [field]: value });
    });
  }

  
  async function handleFormSubmit(e) {
    e.preventDefault();

    if (!formData.name) {
      alert("Please enter resident name");
      return;
    }

    try {
      if (formMode === "add") {
        var resAdd = await fetch(API_BASE + "/api/residents", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formData.name,
            roomNumber: formData.roomNumber,
            phone: formData.phone,
            gender: formData.gender,
            status: formData.status,
            checkIn: formData.checkIn,
          }),
        });
        var jsonAdd = await resAdd.json();

        if (!resAdd.ok || (jsonAdd && jsonAdd.ok === false)) {
          alert(
            (jsonAdd && jsonAdd.error) ||
              "Failed to create resident"
          );
          return;
        }

        setItems(function (prev) {
          return prev.concat(
            jsonAdd.resident || jsonAdd.data || jsonAdd
          );
        });
      } else {
        var id = formData._id;

        var resEdit = await fetch(
          API_BASE + "/api/residents/" + id,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: formData.name,
              roomNumber: formData.roomNumber,
              phone: formData.phone,
              gender: formData.gender,
              status: formData.status,
              checkIn: formData.checkIn,
            }),
          }
        );
        var jsonEdit = await resEdit.json();

        if (!resEdit.ok || (jsonEdit && jsonEdit.ok === false)) {
          alert(
            (jsonEdit && jsonEdit.error) ||
              "Failed to update resident"
          );
          return;
        }

        setItems(function (prev) {
          return prev.map(function (r) {
            return r._id === id
              ? jsonEdit.resident || jsonEdit.data || jsonEdit
              : r;
          });
        });
      }

      setShowForm(false);
    } catch (err) {
      console.error("Save resident error:", err);
      alert("Failed to save resident");
    }
  }

 
  async function handleDelete(row) {
    if (!window.confirm("Delete resident " + row.name + "?")) return;

    try {
      var res = await fetch(
        API_BASE + "/api/residents/" + row._id,
        { method: "DELETE" }
      );
      var json = await res.json();

      if (!res.ok || (json && json.ok === false)) {
        alert(
          (json && json.error) || "Failed to delete resident"
        );
        return;
      }

      setItems(function (prev) {
        return prev.filter(function (r) {
          return r._id !== row._id;
        });
      });
    } catch (err) {
      console.error("Delete error:", err);
      alert("Failed to delete resident");
    }
  }

  
  return (
    <main className="p-4 sm:p-6 space-y-6">
      
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="text-sm text-gray-600 mt-1">
            Manage current hostel residents and their room
            assignments.
          </p>
        </div>

        <button
          onClick={openAddForm}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 text-sm"
        >
          + Add New Resident
        </button>
      </div>

      <Card>
        
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <input
            type="text"
            placeholder="Search by name, room or phone..."
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
            <option value="active">Active</option>
            <option value="checked-out">Checked-Out</option>
          </select>
        </div>

        {loading && (
          <div className="px-3 py-4 text-sm text-gray-500">
            Loading…
          </div>
        )}

        {!loading && error && (
          <div className="px-3 py-4 text-sm text-red-600">
            {error}
          </div>
        )}

        {!loading && !error && (
          <div className="overflow-x-auto w-full">
            <table className="min-w-full text-sm border-t border-gray-200 table-auto">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-3 py-2 font-semibold">
                    Name
                  </th>
                  <th className="text-left px-3 py-2 font-semibold">
                    Room
                  </th>
                  <th className="text-left px-3 py-2 font-semibold">
                    Phone
                  </th>
                  <th className="text-left px-3 py-2 font-semibold">
                    Status
                  </th>
                  <th className="text-left px-3 py-2 font-semibold">
                    Check-in
                  </th>
                  <th className="text-right px-3 py-2 font-semibold">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredItems.length === 0 && (
                  <tr>
                    <td
                      colSpan="6"
                      className="px-3 py-4 text-center text-gray-500"
                    >
                      No residents found.
                    </td>
                  </tr>
                )}

                {filteredItems.map(function (row) {
                  var genderLabel = row.gender
                    ? row.gender.charAt(0).toUpperCase() +
                      row.gender.slice(1)
                    : "—";

                  return (
                    <tr key={row._id} className="border-t">
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-3">
                          <AvatarEmoji
                            gender={row.gender}
                            name={row.name}
                          />
                          <div>
                            <div className="text-sm font-medium">
                              {row.name}
                            </div>
                            <div className="text-xs text-gray-500">
                              {genderLabel}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-3 py-3">
                        {row.roomNumber || "—"}
                      </td>

                      <td className="px-3 py-3">
                        {row.phone && row.phone !== ""
                          ? row.phone
                          : "—"}
                      </td>

                      <td className="px-3 py-3">
                        <StatusBadge value={row.status} />
                      </td>

                      <td className="px-3 py-3 text-gray-600">
                        {row.checkIn || "—"}
                      </td>

                      <td className="px-3 py-3 text-right space-x-2">
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
        <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-30">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold">
                {formMode === "add"
                  ? "New Resident"
                  : "Edit Resident"}
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

            <form
              onSubmit={handleFormSubmit}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    className="border px-3 py-2 rounded w-full text-sm"
                    value={formData.name}
                    onChange={function (e) {
                      handleFormChange("name", e.target.value);
                    }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Room
                  </label>
                  <input
                    type="text"
                    className="border px-3 py-2 rounded w-full text-sm"
                    value={formData.roomNumber}
                    onChange={function (e) {
                      handleFormChange(
                        "roomNumber",
                        e.target.value
                      );
                    }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Phone
                  </label>
                  <input
                    type="text"
                    className="border px-3 py-2 rounded w-full text-sm"
                    value={formData.phone}
                    onChange={function (e) {
                      handleFormChange("phone", e.target.value);
                    }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Gender
                  </label>
                  <select
                    className="border px-3 py-2 rounded w-full text-sm"
                    value={formData.gender}
                    onChange={function (e) {
                      handleFormChange("gender", e.target.value);
                    }}
                  >
                    <option value="">
                      Prefer not to say
                    </option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    <option value="active">Active</option>
                    <option value="checked-out">
                      Checked-Out
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Check-in
                  </label>
                  <input
                    type="date"
                    className="border px-3 py-2 rounded w-full text-sm"
                    value={formData.checkIn}
                    onChange={function (e) {
                      handleFormChange("checkIn", e.target.value);
                    }}
                  />
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
                  {formMode === "add"
                    ? "Create"
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
