"use client";

import { Puzzle, Download, Users, CheckSquare, TrendingUp, Clock } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/lib/auth/session";

export default function DashboardPage() {
  const { user } = useAuth();
  
  // Fetch recent skills
  const { data: recentData, isPending: recentLoading, error: recentError } = trpc.skill.search.useQuery({
    sortBy: "updatedAt",
    sortOrder: "desc",
    pageSize: 4,
  });

  // Fetch trending skills (by install count)
  const { data: trendingData, isPending: trendingLoading, error: trendingError } = trpc.skill.search.useQuery({
    sortBy: "installCount",
    sortOrder: "desc",
    pageSize: 3,
  });

  // Fetch review stats
  const { data: reviewStats, isPending: statsLoading, error: statsError } = trpc.review.getStats.useQuery();

  // Fetch pending reviews list
  const { data: pendingReviewsData, isPending: pendingLoading } = trpc.review.listPending.useQuery({
    status: "pending",
    pageSize: 3,
  });

  const isPending = recentLoading || trendingLoading || statsLoading || pendingLoading;
  const hasError = recentError || trendingError || statsError;

  if (isPending) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-red-600">Error loading dashboard data</div>
      </div>
    );
  }

  const totalSkills = recentData?.total || 0;
  const pendingCount = reviewStats?.pending || 0;
  const recentSkills = recentData?.skills || [];
  const trendingSkills = trendingData?.skills || [];
  const pendingReviews = pendingReviewsData?.reviews || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, {user?.name || "User"}. Here&apos;s what&apos;s happening.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Skills" value={totalSkills.toString()} change="" icon={Puzzle} trend="neutral" />
        <StatCard title="Pending Reviews" value={pendingCount.toString()} change="" icon={CheckSquare} trend="neutral" />
        <StatCard title="Trending Skills" value={trendingSkills.length.toString()} change="" icon={TrendingUp} trend="up" />
        <StatCard title="Recent Activity" value={recentSkills.length.toString()} change="" icon={Clock} trend="neutral" />
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
            {recentSkills.map((skill) => (
              <div key={skill.id} className="flex items-center gap-3 rounded-lg p-2 hover:bg-accent">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                  <Puzzle className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">{skill.name}</div>
                  <div className="text-xs text-muted-foreground truncate">{skill.description}</div>
                </div>
                <div className="text-xs text-muted-foreground">
                  {new Date(skill.updatedAt).toLocaleDateString()}
                </div>
              </div>
            ))}
            {recentSkills.length === 0 && (
              <div className="text-center py-4 text-sm text-muted-foreground">No recent skills</div>
            )}
          </div>
        </div>

        {/* Pending Reviews */}
        <div className="rounded-lg border bg-card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Pending Reviews</h2>
            <a href="/review" className="text-sm text-primary hover:underline">View all</a>
          </div>
          <div className="space-y-3">
            {pendingReviews.map((review) => (
              <div key={review.id} className="flex items-center gap-3 rounded-lg p-2 hover:bg-accent">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100">
                  <Clock className="h-4 w-4 text-amber-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">{review.skill.name}</div>
                  <div className="text-xs text-muted-foreground">
                    by {review.skill.author.name} &middot; {review.skill.classification}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  {new Date(review.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}
            {pendingReviews.length === 0 && (
              <div className="text-center py-4 text-sm text-muted-foreground">No pending reviews</div>
            )}
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
          {trendingSkills.map((skill) => (
            <div key={skill.id} className="rounded-lg border p-4">
              <div className="text-sm font-medium">{skill.name}</div>
              <div className="mt-1 flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{skill.installCount} installs</span>
              </div>
            </div>
          ))}
          {trendingSkills.length === 0 && (
            <div className="col-span-3 text-center py-4 text-sm text-muted-foreground">No trending skills</div>
          )}
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
