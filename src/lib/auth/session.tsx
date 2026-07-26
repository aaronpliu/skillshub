"use client";

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { trpc } from "@/lib/trpc";
import { setAuthToken } from "@/lib/auth/token";

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
  const queryClient = useQueryClient();
  const [state, setState] = useState<AuthState>({
    user: null,
    org: null,
    role: null,
    token: null,
    isLoading: true,
  });

  const loginMutation = trpc.auth.login.useMutation();

  const login = useCallback(async (email: string, password: string, orgSlug: string) => {
    const result = await loginMutation.mutateAsync({ email, password, orgSlug });

    const newState: AuthState = {
      user: result.user,
      org: result.org,
      role: result.role,
      token: result.accessToken,
      isLoading: false,
    };

    setAuthToken(result.accessToken);
    setState(newState);
    queryClient.invalidateQueries();
  }, [loginMutation, queryClient]);

  const logout = useCallback(() => {
    setAuthToken(null);
    setState({
      user: null,
      org: null,
      role: null,
      token: null,
      isLoading: false,
    });
    queryClient.clear();
  }, [queryClient]);

  // On mount, restore session from localStorage (persists across tabs & restarts)
  useEffect(() => {
    try {
      const stored = localStorage.getItem("skills-hub-auth");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.token) {
          setAuthToken(parsed.token);

          // Check if token is expired by decoding its JWT payload
          try {
            const payload = JSON.parse(atob(parsed.token.split(".")[1]));
            if (payload.exp && payload.exp * 1000 < Date.now()) {
              // Token expired — clear session
              setAuthToken(null);
              localStorage.removeItem("skills-hub-auth");
              setState((s) => ({ ...s, isLoading: false }));
              return;
            }
          } catch {
            // If we can't decode, just try using it — server will reject if invalid
          }

          setState({ ...parsed, isLoading: false });
        } else {
          setState((s) => ({ ...s, isLoading: false }));
        }
      } else {
        setState((s) => ({ ...s, isLoading: false }));
      }
    } catch {
      setState((s) => ({ ...s, isLoading: false }));
    }
  }, []);

  // Persist full session state to localStorage on change
  useEffect(() => {
    if (state.token) {
      localStorage.setItem("skills-hub-auth", JSON.stringify(state));
    } else {
      localStorage.removeItem("skills-hub-auth");
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
