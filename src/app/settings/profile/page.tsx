"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { User, Key, Bell, Plus, Trash2, Mail, MessageSquare, LogOut } from "lucide-react";
import { useAuth } from "@/lib/auth/session";

export default function ProfileSettingsPage() {
  const { user, org, role, logout } = useAuth();
  const router = useRouter();

  // Notification preferences — kept as local state until backend support is added.
  // TODO: Persist notification preferences via a dedicated user preferences endpoint.
  const [emailNotif, setEmailNotif] = useState(true);
  const [slackNotif, setSlackNotif] = useState(false);
  const [inAppNotif, setInAppNotif] = useState(true);

  const [reviewNotif, setReviewNotif] = useState(true);
  const [publishNotif, setPublishNotif] = useState(true);
  const [securityNotif, setSecurityNotif] = useState(true);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Profile Settings</h1>
          <p className="text-muted-foreground">Manage your account and preferences</p>
        </div>
        <button
          onClick={handleLogout}
          className="inline-flex items-center gap-2 rounded-lg border border-destructive/50 px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/10"
        >
          <LogOut className="h-4 w-4" /> Sign Out
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* User Info */}
        <div className="rounded-lg border bg-card p-6 space-y-4">
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">User Information</h2>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.name}
                  className="h-16 w-16 rounded-full object-cover"
                />
              ) : (
                <User className="h-8 w-8 text-primary" />
              )}
            </div>
            <div>
              <div className="text-lg font-semibold">{user?.name ?? "Unknown User"}</div>
              <div className="text-sm text-muted-foreground">{user?.email ?? ""}</div>
              {role && (
                <div className="mt-1 inline-block rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                  {role}
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Full Name</label>
            <input
              type="text"
              defaultValue={user?.name ?? ""}
              className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Email</label>
            <input
              type="email"
              defaultValue={user?.email ?? ""}
              className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Organization</label>
            <input
              type="text"
              defaultValue={org?.name ?? ""}
              disabled
              className="mt-1 w-full rounded-lg border bg-muted px-3 py-2 text-sm text-muted-foreground"
            />
          </div>

          {/* TODO: Profile update requires a dedicated user profile mutation endpoint. */}
          <button className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            Update Profile
          </button>
        </div>

        {/* API Tokens */}
        <div className="rounded-lg border bg-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Key className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">API Tokens</h2>
            </div>
            <button className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90">
              <Plus className="h-3 w-3" /> Create Token
            </button>
          </div>

          {/*
            TODO: API token management (list, create, revoke) requires a dedicated
            endpoint (e.g. trpc.user.listTokens / createToken / revokeToken).
            The current backend does not expose token CRUD. This section is a
            placeholder until that endpoint is available.
          */}
          <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
            <Key className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" />
            <p>API token management is not yet available.</p>
            <p className="mt-1 text-xs">
              A dedicated token management endpoint is needed to create, list, and revoke
              personal access tokens.
            </p>
          </div>
        </div>
      </div>

      {/* Notification Preferences */}
      <div className="rounded-lg border bg-card p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Notification Preferences</h2>
        </div>

        {/*
          TODO: Notification preferences are currently stored as local component state
          only. A dedicated user preferences endpoint is needed to persist these settings
          to the backend and sync across sessions/devices.
        */}
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Channels</h3>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-sm font-medium">Email Notifications</div>
                  <p className="text-xs text-muted-foreground">Receive updates via email</p>
                </div>
              </div>
              <button
                onClick={() => setEmailNotif(!emailNotif)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  emailNotif ? "bg-primary" : "bg-gray-300"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    emailNotif ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-sm font-medium">Slack Notifications</div>
                  <p className="text-xs text-muted-foreground">Receive updates in Slack</p>
                </div>
              </div>
              <button
                onClick={() => setSlackNotif(!slackNotif)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  slackNotif ? "bg-primary" : "bg-gray-300"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    slackNotif ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-sm font-medium">In-App Notifications</div>
                  <p className="text-xs text-muted-foreground">Show notifications in the app</p>
                </div>
              </div>
              <button
                onClick={() => setInAppNotif(!inAppNotif)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  inAppNotif ? "bg-primary" : "bg-gray-300"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    inAppNotif ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Notification Types</h3>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <div className="text-sm font-medium">Review Requests</div>
                <p className="text-xs text-muted-foreground">When a skill needs your review</p>
              </div>
              <button
                onClick={() => setReviewNotif(!reviewNotif)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  reviewNotif ? "bg-primary" : "bg-gray-300"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    reviewNotif ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <div className="text-sm font-medium">Skill Publishments</div>
                <p className="text-xs text-muted-foreground">When skills are published or updated</p>
              </div>
              <button
                onClick={() => setPublishNotif(!publishNotif)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  publishNotif ? "bg-primary" : "bg-gray-300"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    publishNotif ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <div className="text-sm font-medium">Security Alerts</div>
                <p className="text-xs text-muted-foreground">Critical security notifications</p>
              </div>
              <button
                onClick={() => setSecurityNotif(!securityNotif)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  securityNotif ? "bg-primary" : "bg-gray-300"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    securityNotif ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
