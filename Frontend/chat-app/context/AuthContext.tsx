"use client";

import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { loginUser, registerUser } from "../services/authService";
import { connectSocket } from "../socket/socket";
import { jwtDecode } from "jwt-decode";

type AuthContextType = {
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(
    typeof window !== "undefined" ? localStorage.getItem("token") : null
  );

  // Re-connect socket on initial load if token exists
  useEffect(() => {
    if (token) {
      try {
        const decoded: { id: string } = jwtDecode(token);
        connectSocket(decoded.id);
      } catch (e) {
        console.error("Failed to decode token on load", e);
      }
    }
  }, [token]);

  const login = async (email: string, password: string) => {
    const data = await loginUser({ email, password });

    localStorage.setItem("token", data.token);
    setToken(data.token);

    const decoded: { id: string } = jwtDecode(data.token);

    connectSocket(decoded.id);
  };

  const register = async (name: string, email: string, password: string) => {
    await registerUser({ name, email, password });
    // after successul registration, log them in automatically
    await login(email, password);
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ token, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}