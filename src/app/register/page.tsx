"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/lib/auth/session";
import { Puzzle, UserPlus, AlertCircle, Loader2 } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const { login, isAuthenticated } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [orgSlug, setOrgSlug] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Redirect if already logged in (handled by AuthGuard, but just in case)
  if (isAuthenticated) {
    router.replace("/");
    return null;
  }

  // Fetch available organizations
  const { data: organizations, isLoading: loadingOrgs } = trpc.auth.listOrganizations.useQuery();
  const registerMutation = trpc.auth.register.useMutation();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await registerMutation.mutateAsync({
        email,
        password,
        name,
        orgSlug,
      });

      // Auto-login after registration
      await login(email, password, result.org.slug);
      router.replace("/");
    } catch (err: any) {
      const message = err?.message || "Registration failed";
      setError(message);
      console.error("Registration error:", err);
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
            <h1 className="text-2xl font-bold">Create Account</h1>
            <p className="text-sm text-muted-foreground">Join an organization on Skills Hub</p>
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
            <label className="text-sm font-medium">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
              required
              className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="john@example.com"
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
              placeholder="Minimum 8 characters"
              required
              minLength={8}
              className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

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
                    {org.name} ({org.memberCount} members)
                  </option>
                ))}
              </select>
            ) : (
              <div className="mt-1 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
                No organizations available. Contact your admin to set up an organization first.
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || !organizations?.length}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            <UserPlus className="h-4 w-4" />
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        {/* Login link */}
        <div className="text-center text-sm">
          <span className="text-muted-foreground">Already have an account? </span>
          <a href="/login" className="font-medium text-primary hover:underline">
            Sign in
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
