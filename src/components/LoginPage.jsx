import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, logout } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (loading) return;
    setLoading(true);

    try {
      const res = await login({ email, password });

      if (res && res.ok && res.token) {
        navigate("/", { replace: true });
      } else {
        setError(res?.error || "Invalid credentials");
      }
    } catch (err) {
      setError(err?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  function goToRegister() {
    try {
      logout();
    } catch (e) {}

    localStorage.removeItem("token");
    navigate("/register");
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 relative"
      style={{
        backgroundImage:
          "linear-gradient(180deg, rgba(8,15,30,0.28), rgba(6,10,24,0.36)), url('/hostel-bg.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className="absolute inset-0 pointer-events-none bg-black/10 backdrop-blur-sm" />

      <div className="relative w-full max-w-md z-10">
        <div className="bg-white/8 backdrop-blur-md border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
          <div className="p-6 sm:p-8">
            <h1 className="text-center text-xl font-semibold text-white/95">
              Hostel Manager — Sign in
            </h1>

            <form
              onSubmit={handleSubmit}
              autoComplete="off"
              className="mt-6 space-y-4"
            >
              
              <input
                type="text"
                name="fakeUsername"
                autoComplete="username"
                style={{ display: "none" }}
              />
              <input
                type="password"
                name="fakePassword"
                autoComplete="new-password"
                style={{ display: "none" }}
              />

              <div>
                <label className="block text-sm text-white/80 mb-2">Email</label>
                <input
                  type="email"
                  required
                  autoComplete="off"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@hostel.com"
                  className="w-full px-4 py-2 rounded-lg bg-white/18 border border-white/12 text-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>

              <div>
                <label className="block text-sm text-white/80 mb-2">Password</label>
                <input
                  type="password"
                  required
                  autoComplete="new-password"
                  value={password}
                  placeholder="Choose a Password"
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg bg-white/18 border border-white/12 text-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>

              <div className="flex items-center justify-between text-sm text-white/80">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="h-4 w-4 rounded bg-white/20 border-white/20 checked:bg-indigo-500"
                  />
                  <span>Remember me</span>
                </label>
                <button
                  type="button"
                  onClick={() => alert("Forgot password flow not implemented")}
                  className="text-indigo-200 hover:underline"
                >
                  Forgot?
                </button>
              </div>

              {error && <div className="text-sm text-rose-400">{error}</div>}

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-gradient-to-r from-indigo-500 to-indigo-600 text-white font-medium transition-transform hover:scale-[1.01] disabled:opacity-70"
                >
                  {loading ? "Signing in…" : "Sign In"}
                </button>

                <div className="text-center mt-3 text-sm text-white/80">
                  New here?{" "}
                  <button onClick={goToRegister} className="text-indigo-200 hover:underline">
                    Create an account
                  </button>
                </div>
              </div>
            </form>
          </div>

          <div className="px-6 py-3 bg-white/6 border-t border-white/8 text-center text-xs text-white/70">
            Demo: admin@hostel.com / admin123
          </div>
        </div>
      </div>
    </div>
  );
}
