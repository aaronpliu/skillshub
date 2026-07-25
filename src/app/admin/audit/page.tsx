"use client";

import { useState } from "react";
import { Search, Download, Shield, AlertTriangle, CheckCircle, XCircle } from "lucide-react";

const MOCK_LOGS = [
  { id: "1", timestamp: "2026-07-22 14:32:01", actor: "alice@acme.com", action: "skill.publish", resource: "data-analyzer v1.2.0", result: "success", ip: "192.168.1.100" },
  { id: "2", timestamp: "2026-07-22 14:28:45", actor: "bob@acme.com", action: "review.approve", resource: "pdf-processor v1.1.0", result: "success", ip: "192.168.1.101" },
  { id: "3", timestamp: "2026-07-22 14:15:22", actor: "carol@acme.com", action: "skill.create", resource: "api-integration", result: "success", ip: "192.168.1.102" },
  { id: "4", timestamp: "2026-07-22 13:55:10", actor: "unknown", action: "auth.failed", resource: "login", result: "failure", ip: "10.0.0.55" },
  { id: "5", timestamp: "2026-07-22 13:42:33", actor: "dave@acme.com", action: "skill.download", resource: "code-reviewer v1.0.0", result: "success", ip: "192.168.1.103" },
  { id: "6", timestamp: "2026-07-22 13:30:18", actor: "alice@acme.com", action: "user.invite", resource: "frank@acme.com", result: "success", ip: "192.168.1.100" },
  { id: "7", timestamp: "2026-07-22 12:15:00", actor: "eve@acme.com", action: "skill.install", resource: "data-analyzer", result: "success", ip: "192.168.1.104" },
  { id: "8", timestamp: "2026-07-22 11:45:33", actor: "unknown", action: "auth.failed", resource: "login", result: "failure", ip: "10.0.0.88" },
];

export default function AuditLogPage() {
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("");

  const filtered = MOCK_LOGS.filter((log) => {
    const matchesSearch = !search || log.actor.includes(search) || log.resource.includes(search);
    const matchesAction = !actionFilter || log.action === actionFilter;
    return matchesSearch && matchesAction;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Audit Logs</h1>
          <p className="text-muted-foreground">Immutable record of all system activities</p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium hover:bg-accent">
          <Download className="h-4 w-4" /> Export CSV
        </button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border bg-card p-4">
          <div className="text-sm text-muted-foreground">Total Events (24h)</div>
          <div className="mt-1 text-2xl font-bold">1,247</div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <AlertTriangle className="h-3.5 w-3.5 text-red-500" /> Failed Logins
          </div>
          <div className="mt-1 text-2xl font-bold">12</div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="text-sm text-muted-foreground">Skill Actions</div>
          <div className="mt-1 text-2xl font-bold">89</div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="text-sm text-muted-foreground">Unique Actors</div>
          <div className="mt-1 text-2xl font-bold">34</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by actor or resource..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border bg-background py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="rounded-lg border bg-background px-3 py-2 text-sm"
        >
          <option value="">All Actions</option>
          <option value="auth.login">Login</option>
          <option value="auth.failed">Failed Login</option>
          <option value="skill.create">Skill Created</option>
          <option value="skill.publish">Skill Published</option>
          <option value="skill.download">Skill Downloaded</option>
          <option value="review.approve">Review Approved</option>
          <option value="user.invite">User Invited</option>
        </select>
      </div>

      {/* Log Table */}
      <div className="rounded-lg border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Timestamp</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Actor</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Action</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Resource</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Result</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">IP</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtered.map((log) => (
              <tr key={log.id} className="hover:bg-accent/50">
                <td className="px-4 py-3 font-mono text-xs">{log.timestamp}</td>
                <td className="px-4 py-3">{log.actor}</td>
                <td className="px-4 py-3">
                  <code className="rounded bg-secondary px-1.5 py-0.5 text-xs">{log.action}</code>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{log.resource}</td>
                <td className="px-4 py-3">
                  {log.result === "success" ? (
                    <span className="inline-flex items-center gap-1 text-green-600">
                      <CheckCircle className="h-3.5 w-3.5" /> success
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-red-600">
                      <XCircle className="h-3.5 w-3.5" /> failure
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{log.ip}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
