import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { apiLogin, apiRegister, apiMe } from "../api/auth";

const AuthContext = createContext(null);

export function useAuth() {
  return useContext(AuthContext);
}

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  
  const [token, setToken] = useState(() => {
    try {
      return localStorage.getItem("token") || "";
    } catch {
      return "";
    }
  });

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setReady(false);

      const storedToken = (() => {
        try {
          return localStorage.getItem("token");
        } catch {
          return null;
        }
      })();

      if (!storedToken) {
        if (!cancelled) {
          setUser(null);
          setToken("");
          setReady(true);
        }
        return;
      }

      try {
        const data = await apiMe(storedToken);
        if (!cancelled && data && data.ok && data.user) {
          setUser(data.user);
          setToken(storedToken);
        } else {
          try { localStorage.removeItem("token"); } catch (e) {}
          if (!cancelled) {
            setUser(null);
            setToken("");
          }
        }
      } catch (err) {
        console.warn("AuthProvider: token validation failed:", err);
        try { localStorage.removeItem("token"); } catch (e) {}
        if (!cancelled) {
          setUser(null);
          setToken("");
        }
      } finally {
        if (!cancelled) setReady(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async ({ email, password }) => {
    try {
      const data = await apiLogin(email, password);

      if (data && data.ok && data.token) {
        try {
          localStorage.setItem("token", data.token);
        } catch (e) {}
        setToken(data.token);            
        setUser(data.user || null);      
      }

      return data;
    } catch (err) {
      console.error("AuthProvider.login error:", err);
      return {
        ok: false,
        error: err?.error || err?.message || "Login failed",
      };
    }
  }, []);

  const register = useCallback(
    async (creds, options = { autoLogin: true }) => {
      try {
        const data = await apiRegister(creds.name, creds.email, creds.password);

        if (options && options.autoLogin === false) {
          try {
            localStorage.removeItem("token");
          } catch (e) {}
          setToken("");
          return data;
        }

        if (data && data.ok && data.token) {
          try {
            localStorage.setItem("token", data.token);
          } catch (e) {}
          setToken(data.token);         
          setUser(data.user || null);
        }

        return data;
      } catch (err) {
        console.error("AuthProvider.register error:", err);
        return {
          ok: false,
          error: err?.error || err?.message || "Registration failed",
        };
      }
    },
    []
  );

  function logout() {
    try { localStorage.removeItem("token"); } catch (e) {}
    setUser(null);
    setToken("");
  }

 
  const value = { user, ready, login, register, logout, token };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
