import { API_BASE } from "./config";


export async function apiGetUsers() {
  const token = localStorage.getItem("token");

  const res = await fetch(`${API_BASE}/users`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  return res.json();
}


export async function apiCreateUser(data) {
  const token = localStorage.getItem("token");

  const res = await fetch(`${API_BASE}/users`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  return res.json();
}


export async function apiUpdateUser(id, data) {
  const token = localStorage.getItem("token");

  const res = await fetch(`${API_BASE}/users/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  return res.json();
}


export async function apiDeleteUser(id) {
  const token = localStorage.getItem("token");

  const res = await fetch(`${API_BASE}/users/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return res.json();
}
