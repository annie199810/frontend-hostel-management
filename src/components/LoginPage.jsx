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
        navigate("/", { replace: true, state: { justLoggedIn: true } });
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
    <>
      <style>
        {`
          input:-webkit-autofill {
            -webkit-box-shadow: 0 0 0 1000px white inset !important;
            -webkit-text-fill-color: #111 !important;
          }
        `}
      </style>

      <div
        className="min-h-screen flex items-center justify-center px-4"
        style={{ background: "linear-gradient(135deg, #4F46E5, #6366F1)" }}
      >
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h1 className="text-center text-xl font-semibold text-gray-800">
              Hostel Manager — Sign In
            </h1>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              
              <input type="text" style={{ display: "none" }} />
              <input type="password" style={{ display: "none" }} />

              
              <div>
                <label className="block text-sm text-gray-600 mb-1">Email</label>
                <input
                  type="email"
                  required
                  autoComplete="off"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border bg-white border-gray-300 
                            focus:ring focus:ring-indigo-200 outline-none"
                />
              </div>

              
              <div>
                <label className="block text-sm text-gray-600 mb-1">Password</label>
                <input
                  type="password"
                  required
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border bg-white border-gray-300 
                             focus:ring focus:ring-indigo-200 outline-none"
                />
              </div>

              
              <div className="flex items-center justify-between text-sm text-gray-700">
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                  />
                  Remember me
                </label>

                <button
                  type="button"
                  onClick={() => navigate("/forgot")}
                  className="text-indigo-600 hover:underline"
                >
                  Forgot?
                </button>
              </div>

              {error && (
                <div className="text-sm text-red-600 text-center">{error}</div>
              )}

              
              <div className="flex gap-2 items-center justify-between">
                <div className="text-sm text-gray-600">Or try demo account</div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEmail("admin@hostel.com");
                      setPassword("admin123");
                    }}
                    className="px-3 py-1 rounded bg-indigo-600 text-white text-xs"
                  >
                    Use Admin
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setEmail("staff@hostel.com");
                      setPassword("staff1234");
                    }}
                    className="px-3 py-1 rounded bg-sky-600 text-white text-xs"
                  >
                    Use Staff
                  </button>
                </div>
              </div>

              
              <button
                type="submit"
                disabled={loading}
                className="w-full px-4 py-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium"
              >
                {loading ? "Signing in…" : "Sign In"}
              </button>

              <div className="text-center mt-3 text-sm text-gray-700">
                New here?{" "}
                <button
                  type="button"
                  onClick={goToRegister}
                  className="text-indigo-600 hover:underline"
                >
                  Create an account
                </button>
              </div>
            </form>

            <div className="px-6 py-3 text-center text-xs text-gray-600">
              Demo: admin@hostel.com / admin123
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
