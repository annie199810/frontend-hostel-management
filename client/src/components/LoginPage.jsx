
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("test@hostel.com");
  const [password, setPassword] = useState("test123");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handle(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login({ email, password });
      navigate("/", { replace: true });
    } catch (err) {
      setError(err?.error || err?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#083b9a] via-[#0e57c7] to-[#275fd6] p-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
        <h1 className="text-3xl font-extrabold text-slate-900 text-center">Hostel Manager</h1>
        <p className="text-center text-sm text-slate-500 mb-6">Management System</p>

        <form onSubmit={handle} className="space-y-4">
          <div>
            <label className="block text-sm text-slate-600 mb-1">Email Address</label>
            <input
              className="w-full border border-slate-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-300"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              placeholder="admin@hostel.com"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-600 mb-1">Password</label>
            <input
              className="w-full border border-slate-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-300"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              placeholder="password"
            />
          </div>

          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 text-slate-600">
              <input type="checkbox" />
              Remember me
            </label>
            <Link to="/forgot" className="text-blue-600 hover:underline">Forgot password?</Link>
          </div>

          {error && <div className="text-sm text-red-600">{error}</div>}

          <button type="submit" className="w-full bg-[#1976ff] text-white py-3 rounded-lg font-semibold shadow" disabled={loading}>
            {loading ? "Signing..." : "Sign In"}
          </button>
        </form>

        <div className="mt-6 border-t pt-4 text-center text-sm text-slate-500">
          Don't have an account? <Link to="/register" className="text-blue-600 hover:underline">Register here</Link>
        </div>

        <div className="mt-6 text-center text-xs text-slate-400">
          <div>Demo Credentials:</div>
          <div>Email: test@hostel.com | Password: test123</div>
        </div>
      </div>
    </div>
  );
}
