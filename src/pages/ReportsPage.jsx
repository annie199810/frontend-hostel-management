import React, { useEffect, useMemo, useState } from "react";
import Card from "../components/Card";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";


function formatCurrency(v) {
  if (!v) return "₹0";
  return "₹" + Number(v).toLocaleString("en-IN");
}

function getAuthToken() {
  try {
    return (
      localStorage.getItem("authToken") ||
      localStorage.getItem("token") ||
      ""
    );
  } catch {
    return "";
  }
}

function withAuth(headers) {
  const token = getAuthToken();
  if (!token) return headers || {};
  return {
    ...(headers || {}),
    Authorization: "Bearer " + token,
  };
}


export default function ReportsPage() {
  const [rooms, setRooms] = useState([]);
  const [bills, setBills] = useState([]);
  const [maintenance, setMaintenance] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");


  useEffect(() => {
    async function loadReports() {
      setLoading(true);
      setError("");

      try {
        const [roomsRes, billingRes, maintRes] = await Promise.all([
          fetch(API_BASE + "/api/rooms", { headers: withAuth() }),
          fetch(API_BASE + "/api/billing", { headers: withAuth() }),
          fetch(API_BASE + "/api/maintenance", { headers: withAuth() }),
        ]);

        if (!roomsRes.ok || !billingRes.ok || !maintRes.ok) {
          throw new Error("One or more APIs failed");
        }

        const roomsJson = await roomsRes.json();
        const billingJson = await billingRes.json();
        const maintJson = await maintRes.json();

        setRooms(Array.isArray(roomsJson.rooms) ? roomsJson.rooms : roomsJson);
        setBills(
          Array.isArray(billingJson.payments)
            ? billingJson.payments
            : billingJson
        );
        setMaintenance(
          Array.isArray(maintJson.requests)
            ? maintJson.requests
            : maintJson
        );
      } catch (err) {
        console.error(err);
        setError("Unable to load reports at the moment. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    loadReports();
  }, []);

  
  const billingStats = useMemo(() => {
    let total = 0,
      paid = 0,
      pending = 0;

    bills.forEach((b) => {
      const amt = Number(b.amount || 0);
      total += amt;

      const status = (b.status || "").toLowerCase();
      if (status === "paid") paid += amt;
      else pending += amt;
    });

    return { total, paid, pending };
  }, [bills]);

 
  const monthlyRevenue = useMemo(() => {
    const map = {};
    bills.forEach((b) => {
      const key =
        b.month ||
        new Date(b.createdAt || Date.now()).toLocaleString("en-IN", {
          month: "short",
          year: "numeric",
        });

      map[key] = (map[key] || 0) + Number(b.amount || 0);
    });

    const entries = Object.entries(map).map(([k, v]) => ({
      label: k,
      value: v,
    }));

    const max = Math.max(...entries.map((e) => e.value), 1);
    return { entries, max };
  }, [bills]);

  
  const roomStats = useMemo(() => {
    let occupied = 0,
      available = 0,
      maintenanceCount = 0;

    rooms.forEach((r) => {
      const s = (r.status || "").toLowerCase();
      if (s === "occupied") occupied++;
      else if (s === "available") available++;
      else maintenanceCount++;
    });

    return {
      total: rooms.length,
      occupied,
      available,
      maintenanceCount,
    };
  }, [rooms]);

  
  const maintenanceStats = useMemo(() => {
    let open = 0,
      inProgress = 0,
      closed = 0;

    maintenance.forEach((m) => {
      const s = (m.status || "").toLowerCase();
      if (s === "open") open++;
      else if (s.includes("progress")) inProgress++;
      else if (s === "closed") closed++;
    });

    return { open, inProgress, closed };
  }, [maintenance]);

  
  if (loading) {
    return (
      <main className="p-6">
        <p className="text-sm text-gray-500">Loading financial reports…</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="p-6">
        <p className="text-sm text-red-500">{error}</p>
      </main>
    );
  }

 
  return (
    <main className="p-6 space-y-6">
     
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
          <div className="text-sm opacity-90">Total Revenue</div>
          <div className="text-2xl font-bold mt-2">
            {formatCurrency(billingStats.total)}
          </div>
        </Card>

        <Card className="bg-gradient-to-r from-green-500 to-emerald-600 text-white">
          <div className="text-sm opacity-90">Paid</div>
          <div className="text-2xl font-bold mt-2">
            {formatCurrency(billingStats.paid)}
          </div>
        </Card>

        <Card className="bg-gradient-to-r from-orange-500 to-amber-600 text-white">
          <div className="text-sm opacity-90">Pending</div>
          <div className="text-2xl font-bold mt-2">
            {formatCurrency(billingStats.pending)}
          </div>
        </Card>

        <Card className="bg-gradient-to-r from-pink-500 to-purple-600 text-white">
          <div className="text-sm opacity-90">Occupancy</div>
          <div className="text-2xl font-bold mt-2">
            {roomStats.occupied}/{roomStats.total}
          </div>
        </Card>
      </div>

      
      <Card title="Revenue Breakdown">
        {monthlyRevenue.entries.length === 0 && (
          <p className="text-xs text-gray-500 text-center py-6">
            No revenue data available
          </p>
        )}

        <div className="h-52 flex items-end gap-4">
          {monthlyRevenue.entries.map((m) => {
            const height = Math.max(
              10,
              Math.round((m.value / monthlyRevenue.max) * 100)
            );
            return (
              <div
                key={m.label}
                className="flex-1 flex flex-col items-center"
              >
                <div
                  className="w-10 rounded-t-lg bg-blue-500 hover:bg-blue-600 transition-all flex items-end justify-center text-[10px] text-white pb-1"
                  style={{ height: height + "%" }}
                  title={formatCurrency(m.value)}
                >
                  ₹{(m.value / 1000).toFixed(1)}k
                </div>
                <span className="mt-2 text-[11px] text-gray-600">
                  {m.label}
                </span>
              </div>
            );
          })}
        </div>
      </Card>

     
      <Card title="Insights">
        <ul className="space-y-2 text-sm">
          {billingStats.pending > 0 && (
            <li className="flex items-center gap-2">
              ⚠️{" "}
              <span>
                {Math.round(
                  (billingStats.pending / billingStats.total) * 100
                )}
                % revenue pending collection
              </span>
            </li>
          )}

          {maintenanceStats.open > 0 && (
            <li className="flex items-center gap-2">
              🛠️{" "}
              <span>
                {maintenanceStats.open} open maintenance requests need
                attention
              </span>
            </li>
          )}

          {roomStats.available > 0 && (
            <li className="flex items-center gap-2">
              🏠{" "}
              <span>
                {roomStats.available} rooms available for allocation
              </span>
            </li>
          )}
        </ul>
      </Card>
    </main>
  );
}
