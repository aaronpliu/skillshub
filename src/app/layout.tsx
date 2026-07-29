"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import superjson from "superjson";
import { trpc } from "@/lib/trpc";
import { AuthProvider, useAuth } from "@/lib/auth/session";
import { Sidebar } from "@/components/layout/Sidebar";
import { CommandPalette } from "@/components/shared/CommandPalette";
import { getAuthToken } from "@/lib/auth/token";
import { ThemeProvider } from "@/components/layout/ThemeProvider";
import "@/styles/globals.css";

function getAuthHeaders(): Record<string, string> {
  const token = getAuthToken();
  if (token) return { Authorization: `Bearer ${token}` };
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
      links: [
        httpBatchLink({
          url: "/api/trpc",
          transformer: superjson,
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
  const { isAuthenticated, isLoading, role } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const isAuthPage = pathname === "/login" || pathname === "/register";
  const isPublicSkillPage = pathname === "/skills" || pathname === "/skills/detail";

  // Admin-only routes — redirect non-admin users to dashboard
  const adminRoutes = ["/admin/", "/analytics", "/review", "/org/policies", "/org/members"];
  const isAdminRoute = adminRoutes.some((r) => pathname === r || pathname.startsWith(r));
  const adminRoles = ["owner", "admin"];
  const isAllowed = !isAdminRoute || (role && adminRoles.includes(role));

  // Redirect logic via useEffect for smooth client-side navigation
  useEffect(() => {
    if (isLoading) return;

    // Already authenticated on auth pages → go to dashboard
    if (isAuthPage && isAuthenticated) {
      router.replace("/");
      return;
    }

    // Not authenticated on protected pages → go to login
    if (!isAuthenticated && !isAuthPage && !isPublicSkillPage) {
      router.replace("/login");
      return;
    }

    // Non-admin on admin route → go to dashboard
    if (isAuthenticated && !isAllowed && pathname !== "/") {
      router.replace("/");
      return;
    }
  }, [isLoading, isAuthenticated, isAllowed, isAuthPage, isPublicSkillPage, pathname, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  // Auth pages (login/register) — bare layout, no sidebar
  if (isAuthPage) {
    if (isAuthenticated) return null;
    return <>{children}</>;
  }

  // Public skill pages — accessible without login, no sidebar
  if (!isAuthenticated && isPublicSkillPage) {
    return <>{children}</>;
  }

  // Protected pages — redirecting handled by useEffect
  if (!isAuthenticated) {
    return null;
  }

  // Admin routes — redirecting handled by useEffect
  if (!isAllowed) {
    return null;
  }

  // Authenticated layout with sidebar
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
          <ThemeProvider>
            <AuthProvider>
              <AuthGuard>{children}</AuthGuard>
            </AuthProvider>
          </ThemeProvider>
        </TRPCProvider>
      </body>
    </html>
  );
}
