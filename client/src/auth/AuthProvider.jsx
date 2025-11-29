
import React, { createContext, useContext, useEffect, useState } from "react";
import { apiLogin, apiMe, apiRegister } from "../api/auth";

const AuthContext = createContext(null);

export function useAuth() {
  return useContext(AuthContext);
}

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      
      apiMe(token)
        .then(({ user }) => {
          setUser(user);
        })
        .catch((err) => {
          console.warn("Failed to validate token:", err);
          localStorage.removeItem("token");
          setUser(null);
        })
        .finally(() => setReady(true));
    } else {
      setReady(true);
    }
  }, []);

  async function login({ email, password }) {
   
    const data = await apiLogin(email, password);
    
    if (data && data.token) {
      localStorage.setItem("token", data.token);
    }
    setUser(data.user);
    return data;
  }

  async function register({ name, email, password }) {
    const data = await apiRegister(name, email, password);
    if (data && data.token) {
      localStorage.setItem("token", data.token);
    }
    setUser(data.user);
    return data;
  }

  function logout() {
    localStorage.removeItem("token");
    setUser(null);
  }

  const value = {
    user,
    ready,
    login,      
    register,   
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
