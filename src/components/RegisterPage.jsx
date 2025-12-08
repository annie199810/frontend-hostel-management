import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register, user, ready, logout } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // When opening register page → force clear login session
  useEffect(() => {
    try { logout?.(); } catch (e) {}
    try { localStorage.removeItem("token"); } catch (e) {}
  }, []);

  async function handleSelfRegister(e) {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    if (loading) return;
    setLoading(true);

    try {
      // normal user registering (not admin create)
      const res = await register(
        { name, email, password },
        { autoLogin: false }
      );

      if (localStorage.getItem("token")) {
        localStorage.removeItem("token");
      }

      if (res && res.ok) {
        // After register → go to login page
        navigate("/login", {
          replace: true,
          state: { justRegistered: true }, // you can show message in login if needed
        });
      } else {
        setError(res?.error || "Registration failed");
      }
    } catch (err) {
      setError(err?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  async function createUserAsAdmin(e) {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    if (loading) return;
    setLoading(true);

    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/users`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: token ? `Bearer ${token}` : "",
          },
          body: JSON.stringify({ name, email, password }),
        }
      );

      const data = await res.json();
      if (!res.ok) throw data;

      setSuccessMsg("User created successfully.");
      setName("");
      setEmail("");
      setPassword("");
    } catch (err) {
      setError(err?.error || err?.message || "Failed to create user");
    } finally {
      setLoading(false);
    }
  }

  // Wait for auth context
  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900/20">
        <div className="text-sm text-white/80">Checking session…</div>
      </div>
    );
  }

  // If logged in and NOT admin → block register
  if (user && user.role !== "Administrator") {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-4 relative"
        style={{
          backgroundImage:
            "linear-gradient(180deg, rgba(8,15,30,0.28), rgba(6,10,24,0.36)), url('/hostel-bg.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-black/10 backdrop-blur-sm" />
        <div className="relative w-full max-w-md z-10">
          <div className="bg-white/8 backdrop-blur-md border border-white/10 rounded-2xl shadow-2xl p-8 text-center text-white/90">
            <h2 className="text-lg font-semibold mb-3">You're already signed in</h2>
            <p className="text-sm text-white/80 mb-6">
              Logged in as <strong>{user.name}</strong> ({user.role}).  
              To register new account, logout first.
            </p>

            <div className="flex gap-3 justify-center">
              <button
                onClick={() => navigate("/")}
                className="px-4 py-2 rounded-md bg-indigo-600 text-white"
              >
                Go to dashboard
              </button>

              <button
                onClick={() => logout()}
                className="px-4 py-2 rounded-md bg-white/10 text-white"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If admin → admin create user page
  if (user && user.role === "Administrator") {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-4 relative"
        style={{
          backgroundImage:
            "linear-gradient(180deg, rgba(8,15,30,0.28), rgba(6,10,24,0.36)), url('/hostel-bg.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-black/10 backdrop-blur-sm" />
        <div className="relative w-full max-w-md z-10">
          <div className="bg-white/8 backdrop-blur-md border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-6 sm:p-8">
              <h1 className="text-center text-xl font-semibold text-white/95">
                Create user (Admin)
              </h1>

              <form onSubmit={createUserAsAdmin} className="mt-6 space-y-4">
                <div>
                  <label className="block text-sm text-white/80 mb-2">
                    Full name
                  </label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full px-4 py-2 rounded-lg bg-white/18 border border-white/12 text-white"
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <label className="block text-sm text-white/80 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-4 py-2 rounded-lg bg-white/18 border border-white/12 text-white"
                    placeholder="user@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm text-white/80 mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full px-4 py-2 rounded-lg bg-white/18 border border-white/12 text-white"
                    placeholder="Choose password"
                  />
                </div>

                {error && <div className="text-sm text-rose-400">{error}</div>}
                {successMsg && (
                  <div className="text-sm text-emerald-300">{successMsg}</div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full px-4 py-3 rounded-lg bg-gradient-to-r from-indigo-500 to-indigo-600 text-white"
                >
                  {loading ? "Creating…" : "Create user"}
                </button>

                <div className="text-center text-sm text-white/80">
                  Or{" "}
                  <button
                    onClick={() => navigate("/")}
                    className="text-indigo-200 hover:underline"
                  >
                    return to dashboard
                  </button>
                </div>
              </form>
            </div>

            <div className="px-6 py-3 bg-white/6 border-t border-white/8 text-center text-xs text-white/70">
              Admin: creating a new user will not log them in automatically.
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Normal user self-registration
  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 relative"
      style={{
        backgroundImage:
          "linear-gradient(180deg, rgba(8,15,30,0.28), rgba(6,10,24,0.36)), url('/hostel-bg.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="absolute inset-0 bg-black/10 backdrop-blur-sm" />

      <div className="relative w-full max-w-md z-10">
        <div className="bg-white/8 backdrop-blur-md border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
          <div className="p-6 sm:p-8">
            <h1 className="text-center text-xl font-semibold text-white/95">
              Create an account
            </h1>

            <form onSubmit={handleSelfRegister} className="mt-6 space-y-4">
              <div>
                <label className="block text-sm text-white/80 mb-2">Full name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full px-4 py-2 rounded-lg bg-white/18 border border-white/12 text-white"
                  placeholder="Your full name"
                />
              </div>

              <div>
                <label className="block text-sm text-white/80 mb-2">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-2 rounded-lg bg-white/18 border border-white/12 text-white"
                  placeholder="you@hostel.com"
                />
              </div>

              <div>
                <label className="block text-sm text-white/80 mb-2">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full px-4 py-2 rounded-lg bg-white/18 border border-white/12 text-white"
                  placeholder="Choose a password"
                />
              </div>

              {error && <div className="text-sm text-rose-400">{error}</div>}
              {successMsg && (
                <div className="text-sm text-emerald-300">{successMsg}</div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full px-4 py-3 rounded-lg bg-gradient-to-r from-indigo-500 to-indigo-600 text-white"
              >
                {loading ? "Creating…" : "Create account"}
              </button>

              <div className="text-center text-sm text-white/80">
                Already registered?{" "}
                <button
                  onClick={() => navigate("/login")}
                  className="text-indigo-200 hover:underline"
                >
                  Sign in
                </button>
              </div>
            </form>
          </div>

          <div className="px-6 py-3 bg-white/6 border-t border-white/8 text-center text-xs text-white/70">
            By registering you agree to our Terms.
          </div>
        </div>
      </div>
    </div>
  );
}
