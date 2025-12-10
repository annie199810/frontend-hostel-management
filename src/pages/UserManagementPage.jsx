import React, { useEffect, useMemo, useState } from "react";
import Card from "../components/Card";
import StatusModal from "../components/StatusModal";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";



function getAuthToken() {
  try {
    return (
      localStorage.getItem("authToken") ||
      localStorage.getItem("token") ||
      ""
    );
  } catch (e) {
    return "";
  }
}

function withAuth(headers) {
  const t = getAuthToken();
  if (!t) return headers || {};
  return Object.assign({}, headers || {}, {
    Authorization: "Bearer " + t,
  });
}

function formatDate(iso) {
  if (!iso) return "-";
  try {
    return new Date(iso).toLocaleDateString();
  } catch (e) {
    return iso;
  }
}

function StatusPill(props) {
  const status = (props.status || "").toLowerCase();
  const base =
    "inline-flex items-center px-2 py-1 rounded-full text-[11px] font-semibold";

  if (status === "active") {
    return (
      <span className={base + " bg-emerald-50 text-emerald-700"}>
        ● Active
      </span>
    );
  }

  return (
    <span className={base + " bg-slate-100 text-slate-500"}>
      ● Inactive
    </span>
  );
}


function isWeakPassword(pwd) {
  if (!pwd) return true;

  const weakList = [
    "123",
    "1234",
    "12345",
    "123456",
    "password",
    "admin",
    "abcd",
    "qwerty",
  ];

  if (weakList.indexOf(pwd.toLowerCase()) !== -1) return true;

  if (pwd.length < 6) return true;

  return false;
}



export default function UserManagementPage() {
  const [users, setUsers] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);

  const [addForm, setAddForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "Staff",
    status: "Active",
  });

  const [editForm, setEditForm] = useState({
    _id: "",
    name: "",
    email: "",
    role: "Staff",
    status: "Active",
  });

  
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState("success");
  const [modalMessage, setModalMessage] = useState("");


  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmUser, setConfirmUser] = useState(null);

  function showSuccess(msg) {
    setModalType("success");
    setModalMessage(msg);
    setModalOpen(true);
  }

  function showError(msg) {
    setModalType("error");
    setModalMessage(
      msg || "Something went wrong. Please try again in a moment."
    );
    setModalOpen(true);
  }

  

  useEffect(function () {
    let mounted = true;

    async function loadUsers() {
      setLoading(true);
      setError("");

      try {
        const res = await fetch(API_BASE + "/api/users", {
          headers: withAuth(),
        });

        if (!res.ok) {
          throw new Error("GET /api/users -> " + res.status);
        }

        const data = await res.json();
        const list = Array.isArray(data)
          ? data
          : Array.isArray(data.users)
          ? data.users
          : [];

        if (mounted) setUsers(list);
      } catch (err) {
        console.error("loadUsers error", err);
        if (mounted) {
          setError(
            "Unable to load users at the moment. Please try again shortly."
          );
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadUsers();
    return function () {
      mounted = false;
    };
  }, []);

 

  const stats = useMemo(
    function () {
      var total = users.length;
      var admins = 0;
      var staff = 0;
      var active = 0;

      (Array.isArray(users) ? users : []).forEach(function (u) {
        var role = (u.role || "").toLowerCase();
        var status = (u.status || "").toLowerCase();

        if (role === "admin") admins += 1;
        else staff += 1;

        if (status === "active") active += 1;
      });

      return { total: total, admins: admins, staff: staff, active: active };
    },
    [users]
  );

  const filtered = useMemo(
    function () {
      const q = (search || "").toLowerCase();

      return (Array.isArray(users) ? users : []).filter(function (u) {
        const matchText =
          !q ||
          (u.name || "").toLowerCase().indexOf(q) !== -1 ||
          (u.email || "").toLowerCase().indexOf(q) !== -1;

        const matchRole =
          roleFilter === "all" ||
          (u.role || "").toLowerCase() === roleFilter.toLowerCase();

        const matchStatus =
          statusFilter === "all" ||
          (u.status || "").toLowerCase() === statusFilter.toLowerCase();

        return matchText && matchRole && matchStatus;
      });
    },
    [users, search, roleFilter, statusFilter]
  );

 

  async function submitAdd(e) {
    e.preventDefault();

    if (!addForm.name || !addForm.email || !addForm.password) {
      showError("Please fill in name, email and password.");
      return;
    }

    if (isWeakPassword(addForm.password)) {
      showError(
        "Password too weak. Please use at least 6 characters with a mix of letters and numbers."
      );
      return;
    }

    const payload = {
      name: addForm.name,
      email: addForm.email,
      password: addForm.password,
      role: addForm.role || "Staff",
      status: addForm.status || "Active",
    };

    try {
      const res = await fetch(API_BASE + "/api/users", {
        method: "POST",
        headers: withAuth({ "Content-Type": "application/json" }),
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(function () {
        return {};
      });

      if (!res.ok || data.ok === false) {
        console.error("submitAdd user err:", data);
        showError(
          data && data.error
            ? data.error
            : "Unable to create user. Please try again."
        );
        return;
      }

      const saved = data.user || data.created || payload;

      setUsers(function (prev) {
        return [saved].concat(prev);
      });

      setShowAdd(false);
      setAddForm({
        name: "",
        email: "",
        password: "",
        role: "Staff",
        status: "Active",
      });

      showSuccess("User account has been created successfully.");
    } catch (err) {
      console.error("submitAdd user network err", err);
      showError("Network error while creating user. Please try again.");
    }
  }

  

  function openEdit(u) {
    setEditForm({
      _id: u._id,
      name: u.name || "",
      email: u.email || "",
      role: u.role || "Staff",
      status: u.status || "Active",
    });
    setShowEdit(true);
  }

  async function submitEdit(e) {
    e.preventDefault();

    if (!editForm._id) {
      showError("User reference is missing.");
      return;
    }
    if (!editForm.name || !editForm.email) {
      showError("Please fill in name and email.");
      return;
    }

    const payload = {
      name: editForm.name,
      email: editForm.email,
      role: editForm.role,
      status: editForm.status,
    };

    try {
      const res = await fetch(API_BASE + "/api/users/" + editForm._id, {
        method: "PUT",
        headers: withAuth({ "Content-Type": "application/json" }),
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(function () {
        return {};
      });

      if (!res.ok || data.ok === false) {
        console.error("submitEdit user err:", data);
        showError(
          data && data.error
            ? data.error
            : "Unable to update this user. Please try again."
        );
        return;
      }

      const updated = data.user || data.updated || payload;

      setUsers(function (prev) {
        return prev.map(function (u) {
          if (u._id !== editForm._id) return u;
          return Object.assign({}, u, updated);
        });
      });

      setShowEdit(false);
      showSuccess("User details have been updated.");
    } catch (err) {
      console.error("submitEdit user network err", err);
      showError("Network error while updating user. Please try again.");
    }
  }



  async function toggleStatus(u) {
    if (!u || !u._id) return;

    const isAdmin = (u.role || "").toLowerCase() === "admin";
    if (isAdmin) {
      showError("Admin accounts cannot be deactivated from here.");
      return;
    }

    const nextStatus =
      (u.status || "").toLowerCase() === "active" ? "Inactive" : "Active";

    try {
      const res = await fetch(API_BASE + "/api/users/" + u._id, {
        method: "PUT",
        headers: withAuth({ "Content-Type": "application/json" }),
        body: JSON.stringify({ status: nextStatus }),
      });

      const data = await res.json().catch(function () {
        return {};
      });

      if (!res.ok || data.ok === false) {
        console.error("toggleStatus err:", data);
        showError(
          data && data.error
            ? data.error
            : "Unable to update user status. Please try again."
        );
        return;
      }

      setUsers(function (prev) {
        return prev.map(function (x) {
          if (x._id !== u._id) return x;
          return Object.assign({}, x, { status: nextStatus });
        });
      });

      showSuccess(
        "User has been " +
          (nextStatus === "Active" ? "re-activated." : "deactivated.")
      );
    } catch (err) {
      console.error("toggleStatus network err", err);
      showError("Network error while updating status. Please try again.");
    }
  }

  

  function openDeleteConfirm(u) {
    const isAdmin = (u.role || "").toLowerCase() === "admin";
    if (isAdmin) {
      showError("Admin accounts cannot be deleted.");
      return;
    }

    setConfirmUser(u);
    setConfirmOpen(true);
  }

  async function confirmDelete() {
    const u = confirmUser;
    if (!u || !u._id) {
      setConfirmOpen(false);
      return;
    }

    try {
      const res = await fetch(API_BASE + "/api/users/" + u._id, {
        method: "DELETE",
        headers: withAuth(),
      });

      const data = await res.json().catch(function () {
        return {};
      });

      if (!res.ok || data.ok === false) {
        console.error("delete user err:", data);
        showError(
          data && data.error
            ? data.error
            : "Unable to delete this user. Please try again."
        );
        setConfirmOpen(false);
        return;
      }

      setUsers(function (prev) {
        return prev.filter(function (x) {
          return x._id !== u._id;
        });
      });

      setConfirmOpen(false);
      setConfirmUser(null);
      showSuccess("User account has been deleted.");
    } catch (err) {
      console.error("delete user network err", err);
      setConfirmOpen(false);
      showError("Network error while deleting user. Please try again.");
    }
  }

  

  if (loading) {
    return (
      <main className="p-4 sm:p-6">
        <p className="text-sm text-gray-500">Loading users…</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="p-4 sm:p-6">
        <p className="text-sm text-red-500">{error}</p>
      </main>
    );
  }

  return (
    <main className="p-4 sm:p-6 bg-gray-50 min-h-screen space-y-6">
   
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <p className="text-sm text-gray-600 mt-1">
            Manage admin and staff accounts with roles and access status.
          </p>
        </div>

        <button
          onClick={function () {
            setAddForm({
              name: "",
              email: "",
              password: "",
              role: "Staff",
              status: "Active",
            });
            setShowAdd(true);
          }}
          className="px-4 py-2 rounded bg-emerald-600 text-white text-sm shadow hover:bg-emerald-700"
        >
          + Add User
        </button>
      </div>

      
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <div className="text-xs text-gray-500 uppercase font-semibold">
            Total Users
          </div>
          <div className="mt-3 text-3xl font-bold">{stats.total}</div>
        </Card>

        <Card>
          <div className="text-xs text-gray-500 uppercase font-semibold">
            Admins
          </div>
          <div className="mt-3 text-2xl font-bold text-indigo-600">
            {stats.admins}
          </div>
        </Card>

        <Card>
          <div className="text-xs text-gray-500 uppercase font-semibold">
            Staff
          </div>
          <div className="mt-3 text-2xl font-bold text-sky-600">
            {stats.staff}
          </div>
        </Card>

        <Card>
          <div className="text-xs text-gray-500 uppercase font-semibold">
            Active Accounts
          </div>
          <div className="mt-3 text-2xl font-bold text-emerald-600">
            {stats.active}
          </div>
        </Card>
      </section>

     
      <Card title="User Directory">
        <div className="flex flex-wrap gap-3 mb-4 items-center">
          <input
            value={search}
            onChange={function (e) {
              setSearch(e.target.value);
            }}
            placeholder="Search by name or email..."
            className="flex-1 min-w-[220px] border px-3 py-2 rounded text-sm"
          />

          <select
            value={roleFilter}
            onChange={function (e) {
              setRoleFilter(e.target.value);
            }}
            className="border px-3 py-2 rounded text-sm"
          >
            <option value="all">All roles</option>
            <option value="Admin">Admin</option>
            <option value="Staff">Staff</option>
          </select>

          <select
            value={statusFilter}
            onChange={function (e) {
              setStatusFilter(e.target.value);
            }}
            className="border px-3 py-2 rounded text-sm"
          >
            <option value="all">All status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-xs text-gray-500 border-b">
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">Email</th>
                <th className="px-3 py-2">Role</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Created</th>
                <th className="px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(function (u) {
                const isAdmin = (u.role || "").toLowerCase() === "admin";

                return (
                  <tr key={u._id || u.email} className="border-b">
                    <td className="px-3 py-3">{u.name || "-"}</td>
                    <td className="px-3 py-3">{u.email || "-"}</td>
                    <td className="px-3 py-3">
                      <span
                        className={
                          "inline-flex px-2 py-1 rounded-full text-[11px] font-semibold " +
                          (isAdmin
                            ? "bg-indigo-50 text-indigo-700"
                            : "bg-sky-50 text-sky-700")
                        }
                      >
                        {u.role || "Staff"}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <StatusPill status={u.status} />
                    </td>
                    <td className="px-3 py-3">
                      {formatDate(u.createdAt)}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={function () {
                            openEdit(u);
                          }}
                          className="px-2 py-1 text-xs rounded bg-sky-50 text-sky-700"
                        >
                          Edit
                        </button>

                        <button
                          onClick={function () {
                            toggleStatus(u);
                          }}
                          className={
                            "px-2 py-1 text-xs rounded " +
                            ((u.status || "").toLowerCase() === "active"
                              ? "bg-amber-50 text-amber-700"
                              : "bg-emerald-50 text-emerald-700")
                          }
                        >
                          {(u.status || "").toLowerCase() === "active"
                            ? "Deactivate"
                            : "Activate"}
                        </button>

                        <button
                          onClick={function () {
                            openDeleteConfirm(u);
                          }}
                          className="px-2 py-1 text-xs rounded bg-rose-50 text-rose-700"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan="6"
                    className="py-6 text-center text-gray-500 text-sm"
                  >
                    No users found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

     
      {showAdd && (
        <div className="fixed inset-0 z-40 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-slate-900/40" />
          <div className="relative z-10 w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900">
                Add User
              </h3>
              <button
                onClick={function () {
                  setShowAdd(false);
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form
              className="space-y-3 text-sm"
              onSubmit={submitAdd}
              autoComplete="off"
            >
              <div>
                <label className="block text-xs text-slate-500 mb-1">
                  Name
                </label>
                <input
                  value={addForm.name}
                  onChange={function (e) {
                    setAddForm(
                      Object.assign({}, addForm, { name: e.target.value })
                    );
                  }}
                  className="w-full border rounded px-3 py-2"
                  required
                />
              </div>

              <div>
                <label className="block text-xs text-slate-500 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={addForm.email}
                  onChange={function (e) {
                    setAddForm(
                      Object.assign({}, addForm, { email: e.target.value })
                    );
                  }}
                  className="w-full border rounded px-3 py-2"
                  required
                />
              </div>

              <div>
                <label className="block text-xs text-slate-500 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={addForm.password}
                  onChange={function (e) {
                    setAddForm(
                      Object.assign({}, addForm, { password: e.target.value })
                    );
                  }}
                  className="w-full border rounded px-3 py-2"
                  required
                />
                <p className="mt-1 text-[11px] text-slate-400">
                  Use at least 6 characters with a mix of letters and numbers.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-500 mb-1">
                    Role
                  </label>
                  <select
                    value={addForm.role}
                    onChange={function (e) {
                      setAddForm(
                        Object.assign({}, addForm, { role: e.target.value })
                      );
                    }}
                    className="w-full border rounded px-3 py-2"
                  >
                    <option>Admin</option>
                    <option>Staff</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-slate-500 mb-1">
                    Status
                  </label>
                  <select
                    value={addForm.status}
                    onChange={function (e) {
                      setAddForm(
                        Object.assign({}, addForm, { status: e.target.value })
                      );
                    }}
                    className="w-full border rounded px-3 py-2"
                  >
                    <option>Active</option>
                    <option>Inactive</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-4">
                <button
                  type="button"
                  onClick={function () {
                    setShowAdd(false);
                  }}
                  className="px-3 py-1.5 text-sm border rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 text-sm rounded bg-emerald-600 text-white"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      
      {showEdit && (
        <div className="fixed inset-0 z-40 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-slate-900/40" />
          <div className="relative z-10 w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900">
                Edit User
              </h3>
              <button
                onClick={function () {
                  setShowEdit(false);
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form
              className="space-y-3 text-sm"
              onSubmit={submitEdit}
              autoComplete="off"
            >
              <div>
                <label className="block text-xs text-slate-500 mb-1">
                  Name
                </label>
                <input
                  value={editForm.name}
                  onChange={function (e) {
                    setEditForm(
                      Object.assign({}, editForm, { name: e.target.value })
                    );
                  }}
                  className="w-full border rounded px-3 py-2"
                  required
                />
              </div>

              <div>
                <label className="block text-xs text-slate-500 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={function (e) {
                    setEditForm(
                      Object.assign({}, editForm, { email: e.target.value })
                    );
                  }}
                  className="w-full border rounded px-3 py-2"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-500 mb-1">
                    Role
                  </label>
                  <select
                    value={editForm.role}
                    onChange={function (e) {
                      setEditForm(
                        Object.assign({}, editForm, { role: e.target.value })
                      );
                    }}
                    className="w-full border rounded px-3 py-2"
                  >
                    <option>Admin</option>
                    <option>Staff</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-slate-500 mb-1">
                    Status
                  </label>
                  <select
                    value={editForm.status}
                    onChange={function (e) {
                      setEditForm(
                        Object.assign({}, editForm, { status: e.target.value })
                      );
                    }}
                    className="w-full border rounded px-3 py-2"
                  >
                    <option>Active</option>
                    <option>Inactive</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-4">
                <button
                  type="button"
                  onClick={function () {
                    setShowEdit(false);
                  }}
                  className="px-3 py-1.5 text-sm border rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 text-sm rounded bg-emerald-600 text-white"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

     
      <StatusModal
        open={modalOpen}
        type={modalType}
        message={modalMessage}
        onClose={function () {
          setModalOpen(false);
        }}
      />

  
      <StatusModal
        open={confirmOpen}
        type="warning"
        message={
          "Are you sure you want to delete the account for " +
          (confirmUser && (confirmUser.name || confirmUser.email || "this user")) +
          "?\nThis action cannot be undone."
        }
        onClose={function () {
          setConfirmOpen(false);
          setConfirmUser(null);
        }}
        onConfirm={confirmDelete}
        confirmLabel="Delete"
        cancelLabel="Cancel"
      />
    </main>
  );
}
