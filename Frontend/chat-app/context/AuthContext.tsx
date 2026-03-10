"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { loginUser } from "../services/authService";
import { connectSocket } from "../socket/socket";
import { jwtDecode } from "jwt-decode";

type AuthContextType = {
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(
    typeof window !== "undefined" ? localStorage.getItem("token") : null
  );

  const login = async (email: string, password: string) => {
    const data = await loginUser({ email, password });

    localStorage.setItem("token", data.token);
    setToken(data.token);

    const decoded: { id: string } = jwtDecode(data.token);

    connectSocket(decoded.id);
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ token, login, logout }}>
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