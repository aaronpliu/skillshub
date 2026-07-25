"use client";

import { useState } from "react";
import { Shield, AlertTriangle, CheckCircle, XCircle, Search, Lock, Eye } from "lucide-react";

const MOCK_SECURITY_EVENTS = [
  { id: "1", timestamp: "2026-07-22 14:32:01", event: "Vulnerability Detected", severity: "high", skill: "data-analyzer v1.2.0", details: "SQL injection risk in query builder", status: "open" },
  { id: "2", timestamp: "2026-07-22 14:15:22", event: "DLP Block", severity: "critical", skill: "pdf-processor v1.1.0", details: "Attempted to access PII data", status: "blocked" },
  { id: "3", timestamp: "2026-07-22 13:55:10", event: "Scan Completed", severity: "info", skill: "api-integration v1.0.0", details: "No vulnerabilities found", status: "resolved" },
  { id: "4", timestamp: "2026-07-22 13:42:33", event: "Compliance Check", severity: "medium", skill: "code-reviewer v1.0.0", details: "Missing license header", status: "open" },
  { id: "5", timestamp: "2026-07-22 13:30:18", event: "DLP Block", severity: "critical", skill: "report-generator v2.0.0", details: "Unauthorized data export attempt", status: "blocked" },
  { id: "6", timestamp: "2026-07-22 12:15:00", event: "Vulnerability Detected", severity: "low", skill: "email-draft v1.0.0", details: "Outdated dependency detected", status: "resolved" },
];

export default function SecurityDashboardPage() {
  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState("");

  const filtered = MOCK_SECURITY_EVENTS.filter((event) => {
    const matchesSearch = !search || event.skill.includes(search) || event.details.includes(search);
    const matchesSeverity = !severityFilter || event.severity === severityFilter;
    return matchesSearch && matchesSeverity;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Security Dashboard</h1>
          <p className="text-muted-foreground">Monitor security scans, DLP findings, and threat alerts</p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium hover:bg-accent">
          <Shield className="h-4 w-4" /> Run Scan
        </button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Shield className="h-3.5 w-3.5 text-blue-500" /> Skills Scanned
          </div>
          <div className="mt-1 text-2xl font-bold">247</div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <AlertTriangle className="h-3.5 w-3.5 text-orange-500" /> Vulnerabilities
          </div>
          <div className="mt-1 text-2xl font-bold">18</div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Lock className="h-3.5 w-3.5 text-red-500" /> DLP Blocks
          </div>
          <div className="mt-1 text-2xl font-bold">7</div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <CheckCircle className="h-3.5 w-3.5 text-green-500" /> Compliance Score
          </div>
          <div className="mt-1 text-2xl font-bold">94%</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search security events..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border bg-background py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <select
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value)}
          className="rounded-lg border bg-background px-3 py-2 text-sm"
        >
          <option value="">All Severities</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
          <option value="info">Info</option>
        </select>
      </div>

      {/* Security Events Table */}
      <div className="rounded-lg border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Timestamp</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Event</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Severity</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Skill</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Details</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtered.map((event) => (
              <tr key={event.id} className="hover:bg-accent/50">
                <td className="px-4 py-3 font-mono text-xs">{event.timestamp}</td>
                <td className="px-4 py-3">{event.event}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    event.severity === "critical" ? "bg-red-100 text-red-700" :
                    event.severity === "high" ? "bg-orange-100 text-orange-700" :
                    event.severity === "medium" ? "bg-yellow-100 text-yellow-700" :
                    event.severity === "low" ? "bg-blue-100 text-blue-700" :
                    "bg-gray-100 text-gray-700"
                  }`}>
                    {event.severity}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{event.skill}</td>
                <td className="px-4 py-3 text-muted-foreground">{event.details}</td>
                <td className="px-4 py-3">
                  {event.status === "resolved" ? (
                    <span className="inline-flex items-center gap-1 text-green-600">
                      <CheckCircle className="h-3.5 w-3.5" /> {event.status}
                    </span>
                  ) : event.status === "blocked" ? (
                    <span className="inline-flex items-center gap-1 text-red-600">
                      <XCircle className="h-3.5 w-3.5" /> {event.status}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-orange-600">
                      <AlertTriangle className="h-3.5 w-3.5" /> {event.status}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
