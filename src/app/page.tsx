"use client";

import { Puzzle, Download, Users, CheckSquare, TrendingUp, Clock } from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, Alice. Here&apos;s what&apos;s happening.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Skills" value="47" change="+3 this week" icon={Puzzle} trend="up" />
        <StatCard title="Total Installs" value="1,284" change="+12% vs last month" icon={Download} trend="up" />
        <StatCard title="Active Members" value="89" change="+5 this month" icon={Users} trend="up" />
        <StatCard title="Pending Reviews" value="6" change="2 urgent" icon={CheckSquare} trend="neutral" />
      </div>

      {/* Content Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Skills */}
        <div className="rounded-lg border bg-card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Recently Published</h2>
            <a href="/skills" className="text-sm text-primary hover:underline">View all</a>
          </div>
          <div className="space-y-3">
            {[
              { name: "data-analyzer", desc: "Analyze CSV/Excel data", author: "Alice Chen", time: "2h ago" },
              { name: "pdf-processor", desc: "Process PDF documents", author: "Bob Smith", time: "5h ago" },
              { name: "api-integration", desc: "REST API integration helper", author: "Carol Lee", time: "1d ago" },
              { name: "code-reviewer", desc: "Automated code review", author: "Dave Park", time: "2d ago" },
            ].map((skill) => (
              <div key={skill.name} className="flex items-center gap-3 rounded-lg p-2 hover:bg-accent">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                  <Puzzle className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">{skill.name}</div>
                  <div className="text-xs text-muted-foreground truncate">{skill.desc}</div>
                </div>
                <div className="text-xs text-muted-foreground">{skill.time}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Pending Reviews */}
        <div className="rounded-lg border bg-card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Pending Reviews</h2>
            <a href="/review" className="text-sm text-primary hover:underline">View all</a>
          </div>
          <div className="space-y-3">
            {[
              { name: "report-generator", submitter: "Eve Wang", classification: "internal", time: "1h ago" },
              { name: "email-draft", submitter: "Frank Liu", classification: "internal", time: "3h ago" },
              { name: "meeting-notes", submitter: "Grace Kim", classification: "public", time: "6h ago" },
            ].map((review) => (
              <div key={review.name} className="flex items-center gap-3 rounded-lg p-2 hover:bg-accent">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100">
                  <Clock className="h-4 w-4 text-amber-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">{review.name}</div>
                  <div className="text-xs text-muted-foreground">
                    by {review.submitter} &middot; {review.classification}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">{review.time}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Trending Skills */}
      <div className="rounded-lg border bg-card p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Trending Skills</h2>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {[
            { name: "data-analyzer", installs: 156, growth: "+23%" },
            { name: "pdf-processor", installs: 98, growth: "+18%" },
            { name: "api-integration", installs: 87, growth: "+15%" },
          ].map((skill) => (
            <div key={skill.name} className="rounded-lg border p-4">
              <div className="text-sm font-medium">{skill.name}</div>
              <div className="mt-1 flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{skill.installs} installs</span>
                <span className="text-xs text-green-600">{skill.growth}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  change,
  icon: Icon,
  trend,
}: {
  title: string;
  value: string;
  change: string;
  icon: React.ElementType;
  trend: "up" | "down" | "neutral";
}) {
  return (
    <div className="rounded-lg border bg-card p-6">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="mt-2 text-2xl font-bold">{value}</div>
      <p
        className={`mt-1 text-xs ${
          trend === "up" ? "text-green-600" : trend === "down" ? "text-red-600" : "text-muted-foreground"
        }`}
      >
        {change}
      </p>
    </div>
  );
}
