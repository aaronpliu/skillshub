"use client";

import { useState } from "react";
import { Shield, AlertTriangle, CheckCircle, XCircle, Search, Lock } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function SecurityDashboardPage() {
  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState("");

  // Pull real audit stats for the dashboard header
  const { data: stats, isPending: statsLoading } = trpc.audit.getStats.useQuery({ period: "7d" });

  // Pull real audit logs for the security events table
  const { data: auditData, isPending: logsLoading } = trpc.audit.list.useQuery({
    pageSize: 50,
  });

  // Map audit log actions to security event types and severities
  const securityEvents = (auditData?.logs ?? []).map((log) => {
    const resource = log.resource as Record<string, unknown>;
    const details = log.details as Record<string, unknown> | null;

    // Map audit action to security event type
    let eventType = "Audit Event";
    let severity = "info";

    if (log.action === "auth.login" && log.result === "failure") {
      eventType = "Failed Login";
      severity = "medium";
    } else if (log.action === "auth.login" && log.result === "success") {
      eventType = "Successful Login";
      severity = "info";
    } else if (log.action === "skill.create") {
      eventType = "Skill Created";
      severity = "info";
    } else if (log.action === "skill.publish") {
      eventType = "Skill Published";
      severity = "info";
    } else if (log.action === "skill.delete") {
      eventType = "Skill Removed";
      severity = "medium";
    } else if (log.action === "review.approve") {
      eventType = "Review Approved";
      severity = "info";
    } else if (log.action === "review.reject") {
      eventType = "Review Rejected";
      severity = "medium";
    } else if (log.action.startsWith("skill.") && log.result === "failure") {
      eventType = "Skill Action Failed";
      severity = "high";
    }

    // Check details for scan-related info
    if (details?.scanResults) {
      const scan = details.scanResults as Record<string, unknown>;
      if (scan.passed === false) {
        eventType = "Security Scan Failed";
        severity = "high";
      } else if (scan.passed === true) {
        eventType = "Security Scan Passed";
        severity = "info";
      }
      const findings = scan.findings as Array<{ severity: string }> | undefined;
      if (findings?.some((f) => f.severity === "critical")) {
        eventType = "Critical Vulnerability";
        severity = "critical";
      }
    }

    return {
      id: log.id,
      timestamp: new Date(log.timestamp).toLocaleString(),
      event: eventType,
      severity,
      skill: resource.name ? String(resource.name) : resource.type ? String(resource.type) : "-",
      details: log.action,
      status: log.result === "success" ? "resolved" : log.result === "failure" ? "open" : "resolved",
    };
  });

  const filtered = securityEvents.filter((event) => {
    const matchesSearch = !search || event.skill.includes(search) || event.details.includes(search) || event.event.includes(search);
    const matchesSeverity = !severityFilter || event.severity === severityFilter;
    return matchesSearch && matchesSeverity;
  });

  // Count blocked/failed events from real data
  const failedCount = securityEvents.filter((e) => e.status === "open").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Security Dashboard</h1>
          <p className="text-muted-foreground">Monitor security scans, audit events, and threat alerts</p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium hover:bg-accent">
          <Shield className="h-4 w-4" /> Run Scan
        </button>
      </div>

      {/* Stats - using real audit data */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Shield className="h-3.5 w-3.5 text-blue-500" /> Total Events (7d)
          </div>
          <div className="mt-1 text-2xl font-bold">
            {statsLoading ? "..." : stats?.totalLogs?.toLocaleString() ?? 0}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">From audit logs</div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <AlertTriangle className="h-3.5 w-3.5 text-orange-500" /> Failed Logins (7d)
          </div>
          <div className="mt-1 text-2xl font-bold">
            {statsLoading ? "..." : stats?.failedLogins ?? 0}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">From audit logs</div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Lock className="h-3.5 w-3.5 text-red-500" /> Open Issues
          </div>
          <div className="mt-1 text-2xl font-bold">{failedCount}</div>
          <div className="mt-1 text-xs text-muted-foreground">From audit logs</div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <CheckCircle className="h-3.5 w-3.5 text-green-500" /> Skill Actions (7d)
          </div>
          <div className="mt-1 text-2xl font-bold">
            {statsLoading
              ? "..."
              : stats?.skillActions?.reduce((sum, a) => sum + a._count, 0) ?? 0}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">From audit logs</div>
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
        {logsLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-pulse text-muted-foreground">Loading events...</div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Shield className="h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-medium">No security events</h3>
            <p className="text-sm text-muted-foreground">
              {search || severityFilter ? "Try adjusting your filters" : "Security events from audit logs will appear here"}
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Timestamp</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Event</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Severity</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Resource</th>
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
                      event.severity === "critical" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" :
                      event.severity === "high" ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" :
                      event.severity === "medium" ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" :
                      event.severity === "low" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" :
                      "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400"
                    }`}>
                      {event.severity}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{event.skill}</td>
                  <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{event.details}</td>
                  <td className="px-4 py-3">
                    {event.status === "resolved" ? (
                      <span className="inline-flex items-center gap-1 text-green-600 dark:text-green-400">
                        <CheckCircle className="h-3.5 w-3.5" /> {event.status}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-orange-600 dark:text-orange-400">
                        <AlertTriangle className="h-3.5 w-3.5" /> {event.status}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
