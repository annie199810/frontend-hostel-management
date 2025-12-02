import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { apiLogin, apiRegister, apiMe } from "../api/auth";
const AuthContext = createContext(null);
export function useAuth() {
  return useContext(AuthContext);
}

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setReady(false);
      const token = localStorage.getItem("token");
      if (!token) {
        if (!cancelled) setUser(null);
        if (!cancelled) setReady(true);
        return;
      }
      try {
        const data = await apiMe(token);
        if (!cancelled && data && data.ok && data.user) {
          setUser(data.user);
        } else {
          localStorage.removeItem("token");
          if (!cancelled) setUser(null);
        }
      } catch (err) {
        console.warn("AuthProvider: token validation failed:", err);
        localStorage.removeItem("token");
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const login = useCallback(async ({ email, password }) => {
    try {
      const data = await apiLogin(email, password);
      if (data && data.ok && data.token) {
        localStorage.setItem("token", data.token);
        setUser(data.user || null);
      }
      return data;
    } catch (err) {
      console.error("AuthProvider.login error:", err);
      return { ok: false, error: err?.error || err?.message || "Login failed" };
    }
  }, []);

  const register = useCallback(async (creds, options = { autoLogin: true }) => {
    try {
      const data = await apiRegister(creds.name, creds.email, creds.password);

      
      if (options && options.autoLogin === false) {
        try { localStorage.removeItem("token"); } catch(e) {}
        return data;
      }

      if (data && data.ok && data.token) {
        localStorage.setItem("token", data.token);
        setUser(data.user || null);
      }
      return data;
    } catch (err) {
      console.error("AuthProvider.register error:", err);
      return { ok: false, error: err?.error || err?.message || "Registration failed" };
    }
  }, []);

  function logout() {
    try { localStorage.removeItem("token"); } catch(e) {}
    setUser(null);
  }

  const value = { user, ready, login, register, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
