"use client";

import { BarChart3, TrendingUp, Download, Puzzle, Users } from "lucide-react";

export default function AnalyticsPage() {
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

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border bg-card p-4">
          <Puzzle className="h-5 w-5 text-muted-foreground" />
          <div className="mt-2 text-2xl font-bold">47</div>
          <div className="text-xs text-muted-foreground">Total Skills</div>
          <div className="mt-1 text-xs text-green-600">+3 this week</div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <Download className="h-5 w-5 text-muted-foreground" />
          <div className="mt-2 text-2xl font-bold">1,284</div>
          <div className="text-xs text-muted-foreground">Total Installs</div>
          <div className="mt-1 text-xs text-green-600">+12% vs last period</div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <Users className="h-5 w-5 text-muted-foreground" />
          <div className="mt-2 text-2xl font-bold">89</div>
          <div className="text-xs text-muted-foreground">Active Users</div>
          <div className="mt-1 text-xs text-green-600">+5 this month</div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <BarChart3 className="h-5 w-5 text-muted-foreground" />
          <div className="mt-2 text-2xl font-bold">4.2</div>
          <div className="text-xs text-muted-foreground">Avg Rating</div>
          <div className="mt-1 text-xs text-green-600">+0.1 vs last period</div>
        </div>
      </div>

      {/* Charts Placeholder */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Installs Trend */}
        <div className="rounded-lg border bg-card p-6">
          <h2 className="text-lg font-semibold mb-4">Install Trends</h2>
          <div className="h-64 flex items-end gap-2">
            {[40, 55, 35, 70, 60, 80, 75, 90, 85, 95, 88, 100].map((h, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full rounded-t bg-primary/80 hover:bg-primary transition-colors"
                  style={{ height: `${h}%` }}
                />
                <span className="text-xs text-muted-foreground">{["J","F","M","A","M","J","J","A","S","O","N","D"][i]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Skills */}
        <div className="rounded-lg border bg-card p-6">
          <h2 className="text-lg font-semibold mb-4">Top Skills by Installs</h2>
          <div className="space-y-3">
            {[
              { name: "data-analyzer", installs: 156, pct: 100 },
              { name: "pdf-processor", installs: 98, pct: 63 },
              { name: "api-integration", installs: 87, pct: 56 },
              { name: "code-reviewer", installs: 72, pct: 46 },
              { name: "report-generator", installs: 64, pct: 41 },
            ].map((skill) => (
              <div key={skill.name}>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{skill.name}</span>
                  <span className="text-muted-foreground">{skill.installs}</span>
                </div>
                <div className="mt-1 h-2 rounded-full bg-secondary">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${skill.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Usage by Team */}
        <div className="rounded-lg border bg-card p-6">
          <h2 className="text-lg font-semibold mb-4">Usage by Team</h2>
          <div className="space-y-3">
            {[
              { team: "Platform Team", skills: 12, installs: 340 },
              { team: "AI Team", skills: 8, installs: 210 },
              { team: "Frontend Team", skills: 6, installs: 180 },
              { team: "Data Science", skills: 5, installs: 150 },
              { team: "Product", skills: 3, installs: 90 },
            ].map((item) => (
              <div key={item.team} className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <div className="text-sm font-medium">{item.team}</div>
                  <div className="text-xs text-muted-foreground">{item.skills} skills published</div>
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
    </div>
  );
}
