import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import StatusModal from "../components/StatusModal";

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register, user, ready, logout } = useAuth();

  // form fields (shared)
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState("info");
  const [modalMessage, setModalMessage] = useState("");

  // On mount: clear any login session (as you had)
  useEffect(() => {
    try { logout?.(); } catch (e) {}
    try { localStorage.removeItem("token"); } catch (e) {}
  }, []);

  function openModal(type, message) {
    setModalType(type || "info");
    setModalMessage(message || "");
    setModalOpen(true);
  }
  function closeModal() {
    setModalOpen(false);
  }

  // Self-register (normal users) - DO NOT send role or allow client to set role
  async function handleSelfRegister(e) {
    e.preventDefault();
    setError("");
    if (loading) return;
    setLoading(true);

    try {
      const res = await register({ name, email, password }, { autoLogin: false });

      // remove any token if register somehow set it
      if (localStorage.getItem("token")) {
        localStorage.removeItem("token");
      }

      if (res && res.ok) {
        openModal("success", "You have created an account successfully.");
        setName("");
        setEmail("");
        setPassword("");

        // close modal then redirect to login
        setTimeout(() => {
          closeModal();
          navigate("/login", { replace: true, state: { justRegistered: true } });
        }, 1400);
      } else {
        const errMsg = res?.error || "Registration failed";
        setError(errMsg);
        openModal("error", errMsg);
      }
    } catch (err) {
      const msg = err?.message || "Registration failed";
      setError(msg);
      openModal("error", msg);
    } finally {
      setLoading(false);
    }
  }

  // Admin: create user (calls /api/users). Admin decides role (Staff or Admin)
  async function createUserAsAdmin(e) {
    e.preventDefault();
    setError("");
    if (loading) return;
    setLoading(true);

    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({ name, email, password }), // admin may add role if you want
      });

      const data = await res.json();
      if (!res.ok) throw data;

      openModal("success", "User created successfully.");
      setName("");
      setEmail("");
      setPassword("");
    } catch (err) {
      const msg = err?.error || err?.message || "Failed to create user";
      setError(msg);
      openModal("error", msg);
    } finally {
      setLoading(false);
    }
  }

  // While auth context initializes
  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900/20">
        <div className="text-sm text-white/80">Checking session…</div>
      </div>
    );
  }

  // If logged in but not admin -> block registration creation (for admin-only features only)
  if (user && user.role && user.role !== "Admin" && user.role !== "Administrator") {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-4"
        style={{
          backgroundImage: "linear-gradient(to bottom right, #6366F1, #4F46E5)",
        }}
      >
        <div className="relative w-full max-w-md z-10">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <h2 className="text-lg font-semibold mb-3">You're already signed in</h2>
            <p className="text-sm text-gray-700 mb-6">
              Logged in as <strong>{user.name}</strong> ({user.role}). To register new account, logout first.
            </p>

            <div className="flex gap-3 justify-center">
              <button onClick={() => navigate("/")} className="px-4 py-2 rounded-md bg-indigo-600 text-white">
                Go to dashboard
              </button>

              <button onClick={() => logout()} className="px-4 py-2 rounded-md bg-gray-100">
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If Admin -> show admin create user form
  if (user && (user.role === "Admin" || user.role === "Administrator")) {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-4"
        style={{
          backgroundImage: "linear-gradient(to bottom right, #6366F1, #4F46E5)",
        }}
      >
        <div className="relative w-full max-w-md z-10">
          <div className="bg-white rounded-2xl shadow-xl p-8 overflow-hidden">
            <h1 className="text-center text-xl font-semibold text-gray-800">Create user (Admin)</h1>

            <form onSubmit={createUserAsAdmin} className="mt-6 space-y-4" autoComplete="off">
              {/* hidden fields to prevent browser autofill */}
              <input type="text" name="fakeusernameremembered" style={{ display: "none" }} />
              <input type="password" name="fakepasswordremembered" style={{ display: "none" }} />

              <div>
                <label className="block text-sm text-gray-700 mb-1">Full name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-gray-50"
                  placeholder="John Doe"
                  autoComplete="name"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-gray-50"
                  placeholder="user@example.com"
                  autoComplete="email"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-gray-50"
                  placeholder="Choose password"
                  autoComplete="new-password"
                  minLength={6}
                />
              </div>

              {error && <div className="text-sm text-red-600">{error}</div>}

              <button type="submit" disabled={loading} className="w-full px-4 py-3 rounded-lg bg-indigo-600 text-white">
                {loading ? "Creating…" : "Create user"}
              </button>

              <div className="text-center text-sm text-gray-700">
                Or{" "}
                <button onClick={() => navigate("/")} className="text-indigo-600 hover:underline">
                  return to dashboard
                </button>
              </div>
            </form>

            <div className="text-center text-xs mt-4 text-gray-500">Admin: creating a new user will not log them in automatically.</div>
          </div>

          <StatusModal open={modalOpen} type={modalType} message={modalMessage} onClose={closeModal} confirmLabel="OK" />
        </div>
      </div>
    );
  }

  // Normal self-registration form
  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{
        backgroundImage: "linear-gradient(to bottom right, #6366F1, #4F46E5)",
      }}
    >
      <div className="relative w-full max-w-md z-10">
        <div className="bg-white rounded-2xl shadow-xl p-8 overflow-hidden">
          <h1 className="text-center text-xl font-semibold text-gray-800">Create an account</h1>

          <form onSubmit={handleSelfRegister} className="mt-6 space-y-4" autoComplete="off">
            {/* hidden fields to prevent browser autofill */}
            <input type="text" name="fakeusernameremembered" style={{ display: "none" }} />
            <input type="password" name="fakepasswordremembered" style={{ display: "none" }} />

            <div>
              <label className="block text-sm text-gray-700 mb-1">Full name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-gray-50"
                placeholder="Your full name"
                autoComplete="name"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-gray-50"
                placeholder="you@hostel.com"
                autoComplete="email"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-gray-50"
                placeholder="Choose a password"
                autoComplete="new-password"
              />
            </div>

            {error && <div className="text-sm text-red-600">{error}</div>}

            <button type="submit" disabled={loading} className="w-full px-4 py-3 rounded-lg bg-indigo-600 text-white">
              {loading ? "Creating…" : "Create account"}
            </button>

            <div className="text-center mt-3 text-sm text-gray-700">
              Already registered?{" "}
              <button onClick={() => navigate("/login")} className="text-indigo-600 hover:underline">
                Sign in
              </button>
            </div>
          </form>

          <div className="text-center text-xs mt-4 text-gray-500">By registering you agree to our Terms.</div>
        </div>
      </div>

      <StatusModal open={modalOpen} type={modalType} message={modalMessage} onClose={closeModal} confirmLabel="OK" />
    </div>
  );
}
