"use client";

import { useState } from "react";
import { User, Key, Bell, Plus, Trash2, Mail, MessageSquare } from "lucide-react";

const MOCK_TOKENS = [
  { id: "1", name: "CI/CD Pipeline", created: "2026-06-15", lastUsed: "2026-07-22", status: "active" },
  { id: "2", name: "Local Development", created: "2026-05-20", lastUsed: "2026-07-21", status: "active" },
  { id: "3", name: "Testing Environment", created: "2026-04-10", lastUsed: "2026-06-30", status: "revoked" },
];

export default function ProfileSettingsPage() {
  const [emailNotif, setEmailNotif] = useState(true);
  const [slackNotif, setSlackNotif] = useState(false);
  const [inAppNotif, setInAppNotif] = useState(true);

  const [reviewNotif, setReviewNotif] = useState(true);
  const [publishNotif, setPublishNotif] = useState(true);
  const [securityNotif, setSecurityNotif] = useState(true);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Profile Settings</h1>
        <p className="text-muted-foreground">Manage your account and preferences</p>
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
              <User className="h-8 w-8 text-primary" />
            </div>
            <div>
              <div className="text-lg font-semibold">Alice Chen</div>
              <div className="text-sm text-muted-foreground">alice@acme.com</div>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Full Name</label>
            <input
              type="text"
              defaultValue="Alice Chen"
              className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Email</label>
            <input
              type="email"
              defaultValue="alice@acme.com"
              className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Team</label>
            <input
              type="text"
              defaultValue="Data Platform"
              className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

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

          <div className="space-y-2">
            {MOCK_TOKENS.map((token) => (
              <div key={token.id} className="rounded-lg border p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Key className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="text-sm font-medium">{token.name}</div>
                      <div className="text-xs text-muted-foreground">
                        Created {token.created} · Last used {token.lastUsed}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      token.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
                    }`}>
                      {token.status}
                    </span>
                    <button className="text-red-600 hover:text-red-700">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Notification Preferences */}
      <div className="rounded-lg border bg-card p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Notification Preferences</h2>
        </div>

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
