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

function StatusBadge(props) {
  var v = props.value || "";
  var cls =
    v === "Active"
      ? "bg-emerald-50 text-emerald-700"
      : "bg-gray-100 text-gray-600";

  return (
    <span className={"px-2 py-0.5 rounded-full text-xs font-medium " + cls}>
      {v || "-"}
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
          Delete User
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

export default function UserManagementPage() {
  var [items, setItems] = useState([]);
  var [loading, setLoading] = useState(true);
  var [error, setError] = useState("");

  var [search, setSearch] = useState("");
  var [roleFilter, setRoleFilter] = useState("all");
  var [statusFilter, setStatusFilter] = useState("all");

  var [showForm, setShowForm] = useState(false);
  var [formMode, setFormMode] = useState("add");
  var [formData, setFormData] = useState({
    _id: null,
    name: "",
    email: "",
    password: "",
    role: "Staff",
    status: "Active",
  });

  var [statusOpen, setStatusOpen] = useState(false);
  var [statusType, setStatusType] = useState("success");
  var [statusMessage, setStatusMessage] = useState("");

  var [deleteOpen, setDeleteOpen] = useState(false);
  var [userToDelete, setUserToDelete] = useState(null);

  function showStatus(type, message) {
    setStatusType(type);
    setStatusMessage(message);
    setStatusOpen(true);
  }

  useEffect(function () {
    loadUsers();
  }, []);

  function loadUsers() {
    setLoading(true);
    setError("");

    var token = null;
    try {
      token = localStorage.getItem("token");
    } catch (e) {}

    if (!token) {
      setError("No token provided");
      setLoading(false);
      return;
    }

    fetch(API_BASE + "/api/users", {
      method: "GET",
      headers: getAuthHeaders(false),
    })
      .then(function (res) {
        return res.json();
      })
      .then(function (data) {
        if (data && data.ok) {
          setItems(data.users || []);
        } else {
          setError(data && data.error ? data.error : "Failed to load users");
        }
      })
      .catch(function () {
        setError("Cannot reach server");
      })
      .finally(function () {
        setLoading(false);
      });
  }

  var filteredItems = useMemo(
    function () {
      var text = (search || "").toLowerCase();

      return (items || []).filter(function (u) {
        var matchSearch =
          !text ||
          (u.name || "").toLowerCase().indexOf(text) !== -1 ||
          (u.email || "").toLowerCase().indexOf(text) !== -1;

        var matchRole = roleFilter === "all" || u.role === roleFilter;
        var matchStatus = statusFilter === "all" || u.status === statusFilter;

        return matchSearch && matchRole && matchStatus;
      });
    },
    [items, search, roleFilter, statusFilter]
  );

  function openAddForm() {
    setFormMode("add");
    setFormData({
      _id: null,
      name: "",
      email: "",
      password: "",
      role: "Staff",
      status: "Active",
    });
    setShowForm(true);
  }

  function openEditForm(row) {
    setFormMode("edit");
    setFormData({
      _id: row._id,
      name: row.name || "",
      email: row.email || "",
      password: "",
      role: row.role || "Staff",
      status: row.status || "Active",
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

    if (!formData.name || !formData.email) {
      showStatus("error", "Please enter name and email.");
      return;
    }

    if (formMode === "add" && !formData.password) {
      showStatus("error", "Password is required for new user.");
      return;
    }

    var payload = {
      name: formData.name,
      email: formData.email,
      role: formData.role,
      status: formData.status,
    };

    if (formData.password) {
      payload.password = formData.password;
    }

    if (formMode === "add") {
      fetch(API_BASE + "/api/users", {
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
            loadUsers();
            showStatus("success", "User created successfully.");
          } else {
            showStatus(
              "error",
              data && data.error ? data.error : "Failed to create user."
            );
          }
        })
        .catch(function () {
          showStatus("error", "Server error while creating user.");
        });
    } else {
      fetch(API_BASE + "/api/users/" + formData._id, {
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
            loadUsers();
            showStatus("success", "User updated successfully.");
          } else {
            showStatus(
              "error",
              data && data.error ? data.error : "Failed to update user."
            );
          }
        })
        .catch(function () {
          showStatus("error", "Server error while updating user.");
        });
    }
  }

  function handleDelete(row) {
    setUserToDelete(row);
    setDeleteOpen(true);
  }

  function handleConfirmDelete() {
    if (!userToDelete) {
      setDeleteOpen(false);
      return;
    }

    fetch(API_BASE + "/api/users/" + userToDelete._id, {
      method: "DELETE",
      headers: getAuthHeaders(false),
    })
      .then(function (res) {
        return res.json();
      })
      .then(function (data) {
        if (data && data.ok) {
          setItems(function (prev) {
            return prev.filter(function (u) {
              return u._id !== userToDelete._id;
            });
          });
          showStatus("success", "User deleted successfully.");
        } else {
          showStatus(
            "error",
            data && data.error ? data.error : "Failed to delete user."
          );
        }
      })
      .catch(function () {
        showStatus("error", "Server error while deleting user.");
      })
      .finally(function () {
        setDeleteOpen(false);
        setUserToDelete(null);
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
          userToDelete ? 'Delete user "' + userToDelete.name + '"?' : ""
        }
        onCancel={function () {
          setDeleteOpen(false);
          setUserToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
      />

      <main className="p-4 sm:p-6 space-y-6 container-responsive">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-gray-600 mt-1">
              Manage admin and staff accounts for the hostel management
              system.
            </p>
          </div>

          <button
            onClick={openAddForm}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 text-sm"
          >
            + Add New User
          </button>
        </div>

        <Card>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <input
              type="text"
              placeholder="Search by name or email..."
              className="border px-3 py-2 rounded text-sm flex-1 min-w-[220px]"
              value={search}
              onChange={function (e) {
                setSearch(e.target.value);
              }}
            />

            <div className="flex gap-3 flex-wrap">
              <select
                className="border px-3 py-2 rounded text-sm"
                value={roleFilter}
                onChange={function (e) {
                  setRoleFilter(e.target.value);
                }}
              >
                <option value="all">All Roles</option>
                <option value="Admin">Admin</option>
                <option value="Staff">Staff</option>
              </select>

              <select
                className="border px-3 py-2 rounded text-sm"
                value={statusFilter}
                onChange={function (e) {
                  setStatusFilter(e.target.value);
                }}
              >
                <option value="all">All Status</option>
                <option value="Active">Active</option>
                <option value="Disabled">Disabled</option>
              </select>
            </div>
          </div>

          {loading && (
            <div className="px-3 py-6 text-sm text-gray-500">
              Loading users…
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
                    <th className="text-left px-3 py-2 font-semibold">Name</th>
                    <th className="text-left px-3 py-2 font-semibold">Email</th>
                    <th className="text-left px-3 py-2 font-semibold">Role</th>
                    <th className="text-left px-3 py-2 font-semibold">
                      Status
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
                  {filteredItems.length === 0 && (
                    <tr>
                      <td
                        colSpan="6"
                        className="px-3 py-4 text-center text-gray-500"
                      >
                        No users found.
                      </td>
                    </tr>
                  )}

                  {filteredItems.map(function (row) {
                    return (
                      <tr key={row._id} className="border-t">
                        <td className="px-3 py-2">{row.name}</td>
                        <td className="px-3 py-2">{row.email}</td>
                        <td className="px-3 py-2">{row.role}</td>
                        <td className="px-3 py-2">
                          <StatusBadge value={row.status} />
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
                  {formMode === "add" ? "Add New User" : "Edit User"}
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
                      Email
                    </label>
                    <input
                      type="email"
                      className="border px-3 py-2 rounded w-full text-sm"
                      value={formData.email}
                      onChange={function (e) {
                        handleFormChange("email", e.target.value);
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Password{" "}
                    {formMode === "edit" && (
                      <span className="text-xs text-gray-500">
                        (leave blank to keep current)
                      </span>
                    )}
                  </label>
                  <input
                    type="password"
                    className="border px-3 py-2 rounded w-full text-sm"
                    value={formData.password}
                    onChange={function (e) {
                      handleFormChange("password", e.target.value);
                    }}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Role
                    </label>
                    <select
                      className="border px-3 py-2 rounded w-full text-sm"
                      value={formData.role}
                      onChange={function (e) {
                        handleFormChange("role", e.target.value);
                      }}
                    >
                      <option value="Admin">Admin</option>
                      <option value="Staff">Staff</option>
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
                      <option value="Active">Active</option>
                      <option value="Disabled">Disabled</option>
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
                    {formMode === "add" ? "Create User" : "Save Changes"}
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
