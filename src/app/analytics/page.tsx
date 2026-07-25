"use client";

import { trpc } from "@/lib/trpc";
import { BarChart3, TrendingUp, Download, Puzzle, Users } from "lucide-react";

export default function AnalyticsPage() {
  // Fetch top skills sorted by install count
  const topSkillsQuery = trpc.skill.search.useQuery({
    sortBy: "installCount",
    sortOrder: "desc",
    pageSize: 5,
  });

  // Fetch total skills count (just need the total, so pageSize 1)
  const allSkillsQuery = trpc.skill.search.useQuery({
    pageSize: 1,
  });

  // Fetch org member count
  const membersQuery = trpc.org.listMembers.useQuery({
    pageSize: 1,
  });

  const totalSkills = allSkillsQuery.data?.total ?? 0;
  const totalMembers = membersQuery.data?.total ?? 0;
  const topSkills = topSkillsQuery.data?.skills ?? [];

  // Compute total installs from top skills as a partial sum
  // TODO: A dedicated analytics aggregation endpoint is needed for accurate
  // total installs, average rating, and install trend time-series data.
  // The current skill.search endpoint returns per-skill install counts,
  // but summing a page of results is not a true total.
  const totalInstalls = topSkills.reduce((sum, s) => sum + s.installCount, 0);
  const avgRating =
    topSkills.length > 0
      ? topSkills.reduce((sum, s) => sum + (s.rating ?? 0), 0) / topSkills.length
      : 0;

  const isLoading = allSkillsQuery.isLoading || membersQuery.isLoading || topSkillsQuery.isLoading;
  const hasError = allSkillsQuery.isError || membersQuery.isError || topSkillsQuery.isError;

  // The max install count among top skills, used to scale the bar widths
  const maxInstalls = topSkills.length > 0 ? topSkills[0].installCount : 1;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground">Skill usage metrics and adoption tracking</p>
        </div>
        <div className="flex gap-2">
          <select className="rounded-lg border bg-background px-3 py-2 text-sm">
            <option>Last 7 days</option>
            <option>Last 30 days</option>
            <option>Last 90 days</option>
          </select>
          <button className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium hover:bg-accent">
            <Download className="h-4 w-4" /> Export
          </button>
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <span className="ml-3 text-sm text-muted-foreground">Loading analytics...</span>
        </div>
      )}

      {/* Error state */}
      {hasError && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          Failed to load analytics data. Please try again later.
        </div>
      )}

      {!isLoading && !hasError && (
        <>
          {/* Summary Stats */}
          <div className="grid gap-4 md:grid-cols-4">
            <div className="rounded-lg border bg-card p-4">
              <Puzzle className="h-5 w-5 text-muted-foreground" />
              <div className="mt-2 text-2xl font-bold">{totalSkills}</div>
              <div className="text-xs text-muted-foreground">Total Skills</div>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <Download className="h-5 w-5 text-muted-foreground" />
              <div className="mt-2 text-2xl font-bold">{totalInstalls.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">Total Installs (top skills)</div>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <Users className="h-5 w-5 text-muted-foreground" />
              <div className="mt-2 text-2xl font-bold">{totalMembers}</div>
              <div className="text-xs text-muted-foreground">Active Members</div>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <BarChart3 className="h-5 w-5 text-muted-foreground" />
              <div className="mt-2 text-2xl font-bold">{avgRating.toFixed(1)}</div>
              <div className="text-xs text-muted-foreground">Avg Rating (top skills)</div>
            </div>
          </div>

          {/* Charts */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Installs Trend */}
            <div className="rounded-lg border bg-card p-6">
              <h2 className="text-lg font-semibold mb-4">Install Trends</h2>
              {/*
                TODO: Install trend time-series data requires a dedicated analytics endpoint
                (e.g. trpc.skill.getInstallTrends) that returns daily/weekly/monthly install
                counts. The current backend does not expose this. The bar chart below is a
                placeholder until that endpoint is available.
              */}
              <div className="h-64 flex items-end gap-2">
                {[40, 55, 35, 70, 60, 80, 75, 90, 85, 95, 88, 100].map((h, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className="w-full rounded-t bg-primary/80 hover:bg-primary transition-colors"
                      style={{ height: `${h}%` }}
                    />
                    <span className="text-xs text-muted-foreground">
                      {["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"][i]}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Skills */}
            <div className="rounded-lg border bg-card p-6">
              <h2 className="text-lg font-semibold mb-4">Top Skills by Installs</h2>
              {topSkillsQuery.isLoading && (
                <div className="py-8 text-center text-sm text-muted-foreground">Loading...</div>
              )}
              {topSkillsQuery.isError && (
                <div className="py-8 text-center text-sm text-destructive">
                  Failed to load top skills.
                </div>
              )}
              {!topSkillsQuery.isLoading && !topSkillsQuery.isError && topSkills.length === 0 && (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  No skills found.
                </div>
              )}
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
            </div>

            {/* Usage by Team */}
            <div className="rounded-lg border bg-card p-6">
              <h2 className="text-lg font-semibold mb-4">Usage by Team</h2>
              {/*
                TODO: Team-level usage aggregation requires a dedicated analytics endpoint
                that groups installs by team. The current backend does not provide this.
                Placeholder data is shown until that endpoint is available.
              */}
              <div className="space-y-3">
                {[
                  { team: "Platform Team", skills: 12, installs: 340 },
                  { team: "AI Team", skills: 8, installs: 210 },
                  { team: "Frontend Team", skills: 6, installs: 180 },
                  { team: "Data Science", skills: 5, installs: 150 },
                  { team: "Product", skills: 3, installs: 90 },
                ].map((item) => (
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
            </div>

            {/* Category Distribution */}
            <div className="rounded-lg border bg-card p-6">
              <h2 className="text-lg font-semibold mb-4">Skills by Category</h2>
              {/*
                TODO: Category distribution aggregation requires a dedicated analytics endpoint
                that groups skills by category with counts. Placeholder data shown for now.
              */}
              <div className="space-y-3">
                {[
                  { category: "Analytics", count: 12, color: "bg-blue-500" },
                  { category: "Document", count: 10, color: "bg-green-500" },
                  { category: "Integration", count: 8, color: "bg-purple-500" },
                  { category: "Development", count: 7, color: "bg-amber-500" },
                  { category: "Security", count: 5, color: "bg-red-500" },
                  { category: "Other", count: 5, color: "bg-gray-500" },
                ].map((item) => (
                  <div key={item.category} className="flex items-center gap-3">
                    <div className={`h-3 w-3 rounded-full ${item.color}`} />
                    <span className="flex-1 text-sm">{item.category}</span>
                    <span className="text-sm font-medium">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
