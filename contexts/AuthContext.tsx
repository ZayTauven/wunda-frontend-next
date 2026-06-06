"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { login as apiLogin } from "@/lib/api";
import { saveTokens, clearTokens, getStoredUser, isAuthenticated } from "@/lib/auth";
import type { UserRole, AuthTokens } from "@/types";

interface AuthUser {
  role: UserRole;
  first_name: string;
  last_name: string;
  is_diaspora: boolean;
}

interface AuthCtx {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated()) {
      setUser(getStoredUser());
    }
    setLoading(false);
  }, []);

  async function login(email: string, password: string) {
    const data: AuthTokens = await apiLogin(email, password);
    saveTokens(data);
    setUser({ role: data.role, first_name: data.first_name, last_name: data.last_name, is_diaspora: data.is_diaspora });
    router.replace("/overview");
  }

  function logout() {
    clearTokens();
    setUser(null);
    router.push("/login");
  }

  return <Ctx.Provider value={{ user, loading, login, logout }}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
