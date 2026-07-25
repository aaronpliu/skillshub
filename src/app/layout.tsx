"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import superjson from "superjson";
import { trpc } from "@/lib/trpc";
import { AuthProvider, useAuth } from "@/lib/auth/session";
import { Sidebar } from "@/components/layout/Sidebar";
import { CommandPalette } from "@/components/shared/CommandPalette";
import "@/styles/globals.css";

function getAuthHeaders(): Record<string, string> {
  try {
    const stored = sessionStorage.getItem("skills-hub-auth");
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.token) return { Authorization: `Bearer ${parsed.token}` };
    }
  } catch { /* ignore */ }
  return {};
}

function TRPCProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        refetchOnWindowFocus: false,
        retry: false,
      },
      mutations: { retry: false },
    },
  }));

  const [trpcClient] = useState(() =>
    trpc.createClient({
      transformer: superjson,
      links: [
        httpBatchLink({
          url: "/api/trpc",
          headers() {
            return getAuthHeaders();
          },
        }),
      ],
    })
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  );
}

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const pathname = typeof window !== "undefined" ? window.location.pathname : "";
  const isAuthPage = pathname === "/login" || pathname === "/register";

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated && !isAuthPage) {
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
    return null;
  }

  if (isAuthenticated && isAuthPage) {
    if (typeof window !== "undefined") {
      window.location.href = "/";
    }
    return null;
  }

  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <>
      <CommandPalette />
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto max-w-7xl p-6">{children}</div>
        </main>
      </div>
    </>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">
        <TRPCProvider>
          <AuthProvider>
            <AuthGuard>{children}</AuthGuard>
          </AuthProvider>
        </TRPCProvider>
      </body>
    </html>
  );
}
