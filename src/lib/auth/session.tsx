"use client";

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import { trpc } from "@/lib/trpc";

interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string | null;
}

interface AuthState {
  user: User | null;
  org: { id: string; name: string; slug: string } | null;
  role: string | null;
  token: string | null;
  isLoading: boolean;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string, orgSlug: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    org: null,
    role: null,
    token: null,
    isLoading: true,
  });

  const login = useCallback(async (email: string, password: string, orgSlug: string) => {
    const res = await fetch("/api/trpc/auth.login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        json: { email, password, orgSlug },
      }),
    });

    const data = await res.json();

    if (data.error) {
      throw new Error(data.error.message || "Login failed");
    }

    const result = data.result?.data;
    if (!result) {
      throw new Error("Invalid login response");
    }

    setState({
      user: result.user,
      org: result.org,
      role: result.role,
      token: result.accessToken,
      isLoading: false,
    });
  }, []);

  const logout = useCallback(() => {
    setState({
      user: null,
      org: null,
      role: null,
      token: null,
      isLoading: false,
    });
  }, []);

  // On mount, check if we have a stored session
  useEffect(() => {
    // Try to restore session from sessionStorage (survives page refresh, cleared on tab close)
    try {
      const stored = sessionStorage.getItem("skills-hub-auth");
      if (stored) {
        const parsed = JSON.parse(stored);
        setState({ ...parsed, isLoading: false });
      } else {
        setState((s) => ({ ...s, isLoading: false }));
      }
    } catch {
      setState((s) => ({ ...s, isLoading: false }));
    }
  }, []);

  // Persist session on change
  useEffect(() => {
    if (state.token) {
      sessionStorage.setItem("skills-hub-auth", JSON.stringify(state));
    } else {
      sessionStorage.removeItem("skills-hub-auth");
    }
  }, [state]);

  return (
    <AuthContext.Provider value={{ ...state, login, logout, isAuthenticated: !!state.token }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
