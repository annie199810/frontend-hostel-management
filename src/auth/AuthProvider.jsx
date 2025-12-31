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

  const [token, setToken] = useState(function () {
    try {
      return localStorage.getItem("token") || "";
    } catch {
      return "";
    }
  });

  
  useEffect(function () {
    var cancelled = false;

    (async function () {
      setReady(false);

      var storedToken = null;
      try {
        storedToken = localStorage.getItem("token");
      } catch (e) {}

      if (!storedToken) {
        if (!cancelled) {
          setUser(null);
          setToken("");
          setReady(true);
        }
        return;
      }

      try {
        var data = await apiMe(storedToken);

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
        if (!cancelled) {
          setUser(null);
        }
      } finally {
        if (!cancelled) {
          setReady(true);
        }
      }
    })();

    return function () {
      cancelled = true;
    };
  }, []);

  
  const login = useCallback(async function ({ email, password }) {
    try {
      var data = await apiLogin(email, password);

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

  
  const register = useCallback(async function (
    creds,
    options = { autoLogin: true }
  ) {
    try {
      var data = await apiRegister(
        creds.name,
        creds.email,
        creds.password
      );

      if (options && options.autoLogin === false) {
        try { localStorage.removeItem("token"); } catch (e) {}
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
  }, []);

  
  function logout() {
    try { localStorage.removeItem("token"); } catch (e) {}
    setUser(null);
    setToken("");
  }

  const value = {
    user,
    ready,
    token,
    login,
    register,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
