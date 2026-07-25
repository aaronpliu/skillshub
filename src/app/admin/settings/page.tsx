"use client";

import { useState } from "react";
import { Save, Shield, Key, Globe } from "lucide-react";

export default function OrganizationSettingsPage() {
  const [orgName, setOrgName] = useState("Acme Corporation");
  const [domain, setDomain] = useState("acme.com");
  const [defaultVisibility, setDefaultVisibility] = useState("team");
  const [requireReview, setRequireReview] = useState(true);
  const [maxSkillSize, setMaxSkillSize] = useState("10");

  const [ssoIssuer, setSsoIssuer] = useState("https://auth.acme.com");
  const [ssoClientId, setSsoClientId] = useState("acme-skills-hub");
  const [ssoEndpoint, setSsoEndpoint] = useState("https://auth.acme.com/saml");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Organization Settings</h1>
          <p className="text-muted-foreground">Manage organization-wide configuration and security</p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
          <Save className="h-4 w-4" /> Save Changes
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* General Settings */}
        <div className="rounded-lg border bg-card p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">General Settings</h2>
          </div>

          <div>
            <label className="text-sm font-medium">Organization Name</label>
            <input
              type="text"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Domain</label>
            <input
              type="text"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="example.com"
              className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <p className="mt-1 text-xs text-muted-foreground">Used for email verification and SSO</p>
          </div>

          <div>
            <label className="text-sm font-medium">Default Skill Visibility</label>
            <select
              value={defaultVisibility}
              onChange={(e) => setDefaultVisibility(e.target.value)}
              className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="private">Private</option>
              <option value="team">Team</option>
              <option value="department">Department</option>
              <option value="organization">Organization</option>
            </select>
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <div className="text-sm font-medium">Require Review Before Publish</div>
              <p className="text-xs text-muted-foreground">All skills must be reviewed before becoming available</p>
            </div>
            <button
              onClick={() => setRequireReview(!requireReview)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                requireReview ? "bg-primary" : "bg-gray-300"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  requireReview ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          <div>
            <label className="text-sm font-medium">Max Skill Size (MB)</label>
            <input
              type="number"
              value={maxSkillSize}
              onChange={(e) => setMaxSkillSize(e.target.value)}
              className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <p className="mt-1 text-xs text-muted-foreground">Maximum size for skill packages</p>
          </div>
        </div>

        {/* SSO Configuration */}
        <div className="rounded-lg border bg-card p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">SSO Configuration</h2>
          </div>

          <div>
            <label className="text-sm font-medium">Issuer URL</label>
            <input
              type="text"
              value={ssoIssuer}
              onChange={(e) => setSsoIssuer(e.target.value)}
              placeholder="https://auth.example.com"
              className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Client ID</label>
            <input
              type="text"
              value={ssoClientId}
              onChange={(e) => setSsoClientId(e.target.value)}
              placeholder="your-client-id"
              className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="text-sm font-medium">SAML Endpoint</label>
            <input
              type="text"
              value={ssoEndpoint}
              onChange={(e) => setSsoEndpoint(e.target.value)}
              placeholder="https://auth.example.com/saml"
              className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
            <div className="flex items-start gap-2">
              <Key className="h-4 w-4 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium">SSO Configuration</p>
                <p className="mt-1 text-xs">Configure SAML 2.0 or OIDC for single sign-on. Contact support for advanced identity provider integration.</p>
              </div>
            </div>
          </div>

          <button className="w-full rounded-lg border px-4 py-2 text-sm font-medium hover:bg-accent">
            Test SSO Connection
          </button>
        </div>
      </div>
    </div>
  );
}
