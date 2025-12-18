import React, { useEffect, useState, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Card from "../components/Card";
import StatusModal from "../components/StatusModal";
import { useAuth } from "../auth/AuthProvider";

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

function formatCurrency(amount) {
  if (!amount) return "₹0";
  return "₹" + (Number(amount) || 0).toLocaleString("en-IN");
}

export default function DashboardPage() {
  const { user } = useAuth();

  const location = useLocation();
  const navigate = useNavigate();

  const initialWelcome =
    (location.state && location.state.justLoggedIn) || false;

  const [welcomeOpen, setWelcomeOpen] = useState(initialWelcome);

  useEffect(
    function () {
      if (initialWelcome) {
        navigate(location.pathname, { replace: true, state: {} });
      }
    },
    [initialWelcome, location.pathname, navigate]
  );

  const welcomeMessage =
    user && user.name
      ? "Welcome, " + user.name + "! You are now signed in."
      : "Welcome to the dashboard!";

  const [rooms, setRooms] = useState([]);
  const [residents, setResidents] = useState([]);
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(function () {
    loadData();
  }, []);

  function loadData() {
    setLoading(true);
    setError("");

    // ❌ OLD CODE (do not delete, just commented)
    // const roomsPromise = fetch(API_BASE + "/api/rooms").then(function (r) {
    //   return r.json();
    // });

    // ✅ NEW CODE (ONLY ADDITION – Authorization header added)
    const roomsPromise = fetch(API_BASE + "/api/rooms", {
      method: "GET",
      headers: getAuthHeaders(false),
    }).then(function (r) {
      return r.json();
    });

    const residentsPromise = fetch(API_BASE + "/api/residents", {
      method: "GET",
      headers: getAuthHeaders(false),
    }).then(function (r) {
      return r.json();
    });

    const billingPromise = fetch(API_BASE + "/api/billing", {
      method: "GET",
      headers: getAuthHeaders(false),
    }).then(function (r) {
      return r.json();
    });

    Promise.all([roomsPromise, residentsPromise, billingPromise])
      .then(function (results) {
        var roomsRes = results[0] || {};
        var resRes = results[1] || {};
        var billRes = results[2] || {};

        if (!roomsRes.ok) throw new Error("Rooms API error");
        if (!resRes.ok) throw new Error("Residents API error");
        if (!billRes.ok) throw new Error("Billing API error");

        setRooms(roomsRes.rooms || []);
        setResidents(resRes.residents || []);
        setBills(billRes.payments || []);
      })
      .catch(function (err) {
        console.error("Dashboard load error:", err);
        if (
          String(err.message || "").indexOf("401") !== -1 ||
          String(err.message || "").toLowerCase().indexOf("unauthorized") !== -1
        ) {
          setError("Session expired or unauthorized. Please log in again.");
        } else {
          setError("Failed to load dashboard data.");
        }
      })
      .finally(function () {
        setLoading(false);
      });
  }

  /* ----- BELOW CODE IS 100% UNCHANGED ----- */

  var totalRooms = rooms.length;

  var occupiedRooms = useMemo(
    function () {
      return rooms.filter(function (r) {
        return String(r.status || "")
          .toLowerCase()
          .indexOf("occupied") !== -1;
      }).length;
    },
    [rooms]
  );

  var availableRooms = useMemo(
    function () {
      return rooms.filter(function (r) {
        return String(r.status || "")
          .toLowerCase()
          .indexOf("available") !== -1;
      }).length;
    },
    [rooms]
  );

  var maintenanceRooms = useMemo(
    function () {
      return rooms.filter(function (r) {
        return String(r.status || "")
          .toLowerCase()
          .indexOf("maintenance") !== -1;
      }).length;
    },
    [rooms]
  );

  var occupancyRate = totalRooms
    ? Math.round((occupiedRooms * 100) / totalRooms)
    : 0;

  /* UI PART REMAINS SAME – NO CHANGE */
}
