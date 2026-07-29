"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/session";
import { trpc } from "@/lib/trpc";
import { Puzzle, LogIn, AlertCircle, Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [orgSlug, setOrgSlug] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Fetch available organizations for dropdown
  const { data: organizations, isLoading: loadingOrgs } = trpc.auth.listOrganizations.useQuery();

  // Redirect if already logged in (handled by AuthGuard, but just in case)
  if (isAuthenticated) {
    router.replace("/");
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(email, password, orgSlug);
      router.replace("/");
    } catch (err: any) {
      const message = err?.message || err?.data?.message || "Login failed. Check server logs for details.";
      setError(message);
      console.error("Login error:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-md space-y-8 rounded-xl border bg-card p-8 shadow-sm">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Puzzle className="h-6 w-6" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold">Skills Hub</h1>
            <p className="text-sm text-muted-foreground">Enterprise Login</p>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium">Organization</label>
            {loadingOrgs ? (
              <div className="mt-1 flex items-center gap-2 rounded-lg border bg-background px-3 py-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading organizations...
              </div>
            ) : organizations && organizations.length > 0 ? (
              <select
                value={orgSlug}
                onChange={(e) => setOrgSlug(e.target.value)}
                required
                className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Select an organization</option>
                {organizations.map((org) => (
                  <option key={org.id} value={org.slug}>
                    {org.name}
                  </option>
                ))}
              </select>
            ) : (
              <div className="mt-1 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
                No organizations found. Please seed the database first.
              </div>
            )}
          </div>
          <div>
            <label className="text-sm font-medium">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="alice@acme.com"
              required
              className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="password123"
              required
              className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !orgSlug}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            <LogIn className="h-4 w-4" />
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        {/* Demo credentials hint */}
        <div className="rounded-lg bg-muted p-3 text-xs text-muted-foreground">
          <p className="font-medium mb-1">Demo credentials (run seed first):</p>
          <p>Org: <code className="rounded bg-background px-1">acme-corp</code></p>
          <p>Email: <code className="rounded bg-background px-1">alice@acme.com</code></p>
          <p>Password: <code className="rounded bg-background px-1">password123</code></p>
        </div>

        {/* Register link */}
        <div className="text-center text-sm">
          <span className="text-muted-foreground">Don&apos;t have an account? </span>
          <a href="/register" className="font-medium text-primary hover:underline">
            Create account
          </a>
        </div>

        {/* Browse skills link */}
        <div className="text-center">
          <a href="/skills" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            &larr; Browse Skills
          </a>
        </div>
      </div>
    </div>
  );
}
