import { createContext, useContext, useMemo, useState } from "react";
import { api } from "./client";
import type { User } from "../types/domain";

type AuthContextValue = {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  persistSession: (response: { token: string; user: User }) => Promise<void>;
  updateUser: (user: User) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function getStoredUser() {
  const value = localStorage.getItem("bolao.user");
  return value ? (JSON.parse(value) as User) : null;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState(() => localStorage.getItem("bolao.token"));
  const [user, setUser] = useState<User | null>(() => getStoredUser());

  async function persistSession(response: { token: string; user: User }) {
    localStorage.setItem("bolao.token", response.token);
    localStorage.setItem("bolao.user", JSON.stringify(response.user));
    setToken(response.token);
    setUser(response.user);
  }

  async function login(email: string, password: string) {
    const { data } = await api.post("/auth/login", { email, password });
    await persistSession(data);
  }

  function updateUser(nextUser: User) {
    localStorage.setItem("bolao.user", JSON.stringify(nextUser));
    setUser(nextUser);
  }

  function logout() {
    localStorage.removeItem("bolao.token");
    localStorage.removeItem("bolao.user");
    setToken(null);
    setUser(null);
  }

  const value = useMemo(
    () => ({ user, token, login, persistSession, updateUser, logout }),
    [user, token]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}
