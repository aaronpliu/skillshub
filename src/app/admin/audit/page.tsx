"use client";

import { useState } from "react";
import { Search, Download, AlertTriangle, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function AuditLogPage() {
  const [actionFilter, setActionFilter] = useState("");
  const [page, setPage] = useState(1);

  // Queries
  const { data: logsData, isLoading: logsLoading, error: logsError } = trpc.audit.list.useQuery(
    { action: actionFilter || undefined, page, pageSize: 50 },
    { keepPreviousData: true }
  );
  const { data: stats, isLoading: statsLoading } = trpc.audit.getStats.useQuery({ period: "7d" });

  // Export mutation
  const exportMutation = trpc.audit.export.useMutation();

  const logs = logsData?.logs ?? [];
  const total = logsData?.total ?? 0;
  const pageSize = logsData?.pageSize ?? 50;
  const totalPages = Math.ceil(total / pageSize);

  const handleExport = () => {
    const endDate = new Date();
    const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    exportMutation.mutate(
      { startDate, endDate, format: "csv" },
      {
        onSuccess: (result) => {
          // Download the CSV file
          const blob = new Blob([result.data as string], { type: "text/csv" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `audit-logs-${new Date().toISOString().split("T")[0]}.csv`;
          a.click();
          URL.revokeObjectURL(url);
        },
      }
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Audit Logs</h1>
          <p className="text-muted-foreground">Immutable record of all system activities</p>
        </div>
        <button
          onClick={handleExport}
          disabled={exportMutation.isPending}
          className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium hover:bg-accent disabled:opacity-50"
        >
          {exportMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          Export CSV
        </button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border bg-card p-4">
          <div className="text-sm text-muted-foreground">Total Events (7d)</div>
          <div className="mt-1 text-2xl font-bold">
            {statsLoading ? "..." : stats?.totalLogs?.toLocaleString() ?? 0}
          </div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <AlertTriangle className="h-3.5 w-3.5 text-red-500" /> Failed Logins
          </div>
          <div className="mt-1 text-2xl font-bold">
            {statsLoading ? "..." : stats?.failedLogins ?? 0}
          </div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="text-sm text-muted-foreground">Skill Actions</div>
          <div className="mt-1 text-2xl font-bold">
            {statsLoading
              ? "..."
              : stats?.skillActions?.reduce((sum, a) => sum + a._count, 0) ?? 0}
          </div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="text-sm text-muted-foreground">Top Actors</div>
          <div className="mt-1 text-2xl font-bold">
            {statsLoading ? "..." : stats?.topActors?.length ?? 0}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <select
          value={actionFilter}
          onChange={(e) => {
            setActionFilter(e.target.value);
            setPage(1);
          }}
          className="rounded-lg border bg-background px-3 py-2 text-sm"
        >
          <option value="">All Actions</option>
          <option value="auth.login">Login</option>
          <option value="auth.failed">Failed Login</option>
          <option value="skill.create">Skill Created</option>
          <option value="skill.publish">Skill Published</option>
          <option value="skill.download">Skill Downloaded</option>
          <option value="review.approve">Review Approved</option>
          <option value="review.reject">Review Rejected</option>
          <option value="user.invite">User Invited</option>
          <option value="user.role_change">Role Changed</option>
          <option value="org.settings_update">Settings Updated</option>
        </select>
      </div>

      {/* Log Table */}
      <div className="rounded-lg border bg-card">
        {logsLoading && (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {logsError && (
          <div className="p-4 text-center text-sm text-red-600">
            Failed to load audit logs: {logsError.message}
          </div>
        )}

        {!logsLoading && !logsError && (
          <>
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
                {logs.map((log) => {
                  const resource = log.resource as Record<string, unknown> | undefined;
                  return (
                    <tr key={log.id} className="hover:bg-accent/50">
                      <td className="px-4 py-3 font-mono text-xs">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">{log.actorEmail}</td>
                      <td className="px-4 py-3">
                        <code className="rounded bg-secondary px-1.5 py-0.5 text-xs">{log.action}</code>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {resource
                          ? `${resource.type ?? ""}${resource.name ? ` - ${resource.name}` : ""}${resource.id ? ` (${resource.id})` : ""}`
                          : "-"}
                      </td>
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
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{log.actorIp}</td>
                    </tr>
                  );
                })}
                {logs.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-sm text-muted-foreground">
                      No audit logs found for the selected filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t p-4">
                <div className="text-sm text-muted-foreground">
                  Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, total)} of {total} results
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="rounded-lg border px-3 py-1.5 text-sm disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    className="rounded-lg border px-3 py-1.5 text-sm disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
