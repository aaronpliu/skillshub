"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { BarChart3, TrendingUp, Download, Puzzle, Users } from "lucide-react";

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<"7d" | "30d" | "90d" | "12m">("12m");

  const { data, isPending, isError } = trpc.analytics.getDashboard.useQuery({ period });

  const dashboard = data ?? {
    installTrends: [],
    teamUsage: [],
    categories: [],
    summary: { totalSkills: 0, totalInstalls: 0, totalMembers: 0, avgRating: 0 },
  };

  const maxTrend = dashboard.installTrends.length > 0
    ? Math.max(...dashboard.installTrends.map((t) => t.count), 1)
    : 1;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground">Skill usage metrics and adoption tracking</p>
        </div>
        <div className="flex gap-2">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as typeof period)}
            className="rounded-lg border bg-background px-3 py-2 text-sm"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="12m">Last 12 months</option>
          </select>
        </div>
      </div>

      {/* Loading state */}
      {isPending && (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <span className="ml-3 text-sm text-muted-foreground">Loading analytics...</span>
        </div>
      )}

      {/* Error state */}
      {isError && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          Failed to load analytics data. Please try again later.
        </div>
      )}

      {!isPending && !isError && (
        <>
          {/* Summary Stats */}
          <div className="grid gap-4 md:grid-cols-4">
            <div className="rounded-lg border bg-card p-4">
              <Puzzle className="h-5 w-5 text-muted-foreground" />
              <div className="mt-2 text-2xl font-bold">{dashboard.summary.totalSkills}</div>
              <div className="text-xs text-muted-foreground">Total Skills</div>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <Download className="h-5 w-5 text-muted-foreground" />
              <div className="mt-2 text-2xl font-bold">{dashboard.summary.totalInstalls.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">Total Installs</div>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <Users className="h-5 w-5 text-muted-foreground" />
              <div className="mt-2 text-2xl font-bold">{dashboard.summary.totalMembers}</div>
              <div className="text-xs text-muted-foreground">Active Members</div>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <BarChart3 className="h-5 w-5 text-muted-foreground" />
              <div className="mt-2 text-2xl font-bold">{dashboard.summary.avgRating.toFixed(1)}</div>
              <div className="text-xs text-muted-foreground">Avg Rating</div>
            </div>
          </div>

          {/* Charts */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Install Trends */}
            <div className="rounded-lg border bg-card p-6">
              <h2 className="text-lg font-semibold mb-4">Install Trends</h2>
              {dashboard.installTrends.length === 0 ? (
                <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
                  No install data for this period
                </div>
              ) : (
                <div className="h-64 flex items-end gap-2">
                  {dashboard.installTrends.map((t, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <div
                        className="w-full rounded-t bg-primary/80 hover:bg-primary transition-colors"
                        style={{ height: `${Math.max((t.count / maxTrend) * 100, 2)}%` }}
                        title={`${t.month}: ${t.count} installs`}
                      />
                      <span className="text-xs text-muted-foreground">
                        {t.month.slice(0, 1)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Top Skills by Installs */}
            <div className="rounded-lg border bg-card p-6">
              <h2 className="text-lg font-semibold mb-4">Top Skills by Installs</h2>
              {dashboard.teamUsage.length === 0 && dashboard.installTrends.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  No skill data available
                </div>
              ) : (
                <TopSkillsList period={period} />
              )}
            </div>

            {/* Usage by Team */}
            <div className="rounded-lg border bg-card p-6">
              <h2 className="text-lg font-semibold mb-4">Usage by Team</h2>
              {dashboard.teamUsage.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  No team usage data available
                </div>
              ) : (
                <div className="space-y-3">
                  {dashboard.teamUsage.map((item) => (
                    <div
                      key={item.team}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div>
                        <div className="text-sm font-medium">{item.team}</div>
                        <div className="text-xs text-muted-foreground">
                          {item.skills} skills published
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold">{item.installs}</div>
                        <div className="text-xs text-muted-foreground">installs</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Category Distribution */}
            <div className="rounded-lg border bg-card p-6">
              <h2 className="text-lg font-semibold mb-4">Skills by Category</h2>
              {dashboard.categories.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  No category data available
                </div>
              ) : (
                <div className="space-y-3">
                  {dashboard.categories.map((item) => (
                    <div key={item.category} className="flex items-center gap-3">
                      <div className={`h-3 w-3 rounded-full ${item.color}`} />
                      <span className="flex-1 text-sm">{item.category}</span>
                      <span className="text-sm font-medium">{item.count}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/** Sub-component that fetches top skills for the bar chart */
function TopSkillsList({ period }: { period: string }) {
  const { data } = trpc.skill.search.useQuery({
    sortBy: "installCount",
    sortOrder: "desc",
    pageSize: 5,
  });

  const topSkills = data?.skills ?? [];
  const maxInstalls = topSkills.length > 0 ? topSkills[0].installCount : 1;

  if (topSkills.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-muted-foreground">
        No skills found
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {topSkills.map((skill) => (
        <div key={skill.id}>
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">{skill.name}</span>
            <span className="text-muted-foreground">{skill.installCount}</span>
          </div>
          <div className="mt-1 h-2 rounded-full bg-secondary">
            <div
              className="h-full rounded-full bg-primary"
              style={{
                width: `${maxInstalls > 0 ? (skill.installCount / maxInstalls) * 100 : 0}%`,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
