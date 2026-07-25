"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { CheckCircle, XCircle, AlertCircle, Clock, Shield, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function ReviewPage() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<"pending" | "approved" | "rejected" | "changes_requested">("pending");

  // Queries
  const { data: reviewsData, isPending: reviewsLoading, error: reviewsError } = trpc.review.listPending.useQuery(
    { status: filter }
  );
  const { data: stats, isPending: statsLoading } = trpc.review.getStats.useQuery();

  // Mutations
  const approveMutation = trpc.review.approve.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["review", "listPending"] });
      queryClient.invalidateQueries({ queryKey: ["review", "getStats"] });
    },
  });
  const rejectMutation = trpc.review.reject.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["review", "listPending"] });
      queryClient.invalidateQueries({ queryKey: ["review", "getStats"] });
    },
  });

  const reviews = reviewsData?.reviews ?? [];

  const handleApprove = (reviewId: string) => {
    if (confirm("Approve this skill?")) {
      approveMutation.mutate({ reviewId });
    }
  };

  const handleReject = (reviewId: string) => {
    const comment = prompt("Rejection reason (required):");
    if (comment) {
      rejectMutation.mutate({ reviewId, comment });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Review Queue</h1>
        <p className="text-muted-foreground">Review and approve skills before they are published</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" /> Pending
          </div>
          <div className="mt-1 text-2xl font-bold">
            {statsLoading ? "..." : stats?.pending ?? 0}
          </div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CheckCircle className="h-4 w-4 text-green-600" /> Approved
          </div>
          <div className="mt-1 text-2xl font-bold">
            {statsLoading ? "..." : stats?.approved ?? 0}
          </div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <XCircle className="h-4 w-4 text-red-600" /> Rejected
          </div>
          <div className="mt-1 text-2xl font-bold">
            {statsLoading ? "..." : stats?.rejected ?? 0}
          </div>
        </div>
      </div>

      {/* Review List */}
      <div className="rounded-lg border bg-card">
        <div className="border-b p-4">
          <div className="flex gap-2">
            {(["pending", "approved", "rejected", "changes_requested"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  filter === f ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent"
                }`}
              >
                {f === "changes_requested" ? "Changes Requested" : f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="divide-y">
          {reviewsLoading && (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}

          {reviewsError && (
            <div className="p-4 text-center text-sm text-red-600">
              Failed to load reviews: {reviewsError.message}
            </div>
          )}

          {!reviewsLoading && !reviewsError && reviews.length === 0 && (
            <div className="p-8 text-center text-sm text-muted-foreground">
              No reviews found for this status.
            </div>
          )}

          {reviews.map((review) => (
            <div
              key={review.id}
              className="flex items-center gap-4 p-4 hover:bg-accent/50"
            >
              {/* Status Icon */}
              <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
                review.status === "approved" ? "bg-green-100" :
                review.status === "rejected" ? "bg-red-100" :
                review.status === "changes_requested" ? "bg-amber-100" : "bg-blue-100"
              }`}>
                {review.status === "approved" ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : review.status === "rejected" ? (
                  <XCircle className="h-5 w-5 text-red-600" />
                ) : review.status === "changes_requested" ? (
                  <AlertCircle className="h-5 w-5 text-amber-600" />
                ) : (
                  <Clock className="h-5 w-5 text-blue-600" />
                )}
              </div>

              {/* Skill Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{review.skill.name}</span>
                  {review.skill.classification && (
                    <span className="rounded bg-secondary px-1.5 py-0.5 text-xs">{review.skill.classification}</span>
                  )}
                </div>
                <div className="mt-0.5 text-sm text-muted-foreground">
                  by {review.skill.author?.name ?? "Unknown"} &middot; {review.skill.team?.name ?? "Unassigned"} &middot; {review.skill.visibility}
                </div>
                {review.skill.description && (
                  <div className="mt-0.5 text-xs text-muted-foreground line-clamp-1">{review.skill.description}</div>
                )}
              </div>

              {/* Classification Badge */}
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  review.skill.classification === "public" ? "bg-green-100 text-green-700" :
                  review.skill.classification === "confidential" ? "bg-orange-100 text-orange-700" :
                  review.skill.classification === "restricted" ? "bg-red-100 text-red-700" :
                  "bg-blue-100 text-blue-700"
                }`}>
                  {review.skill.classification ?? "internal"}
                </span>
              </div>

              {/* Time */}
              <div className="text-xs text-muted-foreground w-24 text-right">
                {new Date(review.createdAt).toLocaleDateString()}
              </div>

              {/* Actions */}
              <div className="flex gap-1">
                {review.status === "pending" && (
                  <>
                    <button
                      onClick={() => handleApprove(review.id)}
                      disabled={approveMutation.isPending}
                      className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
                    >
                      {approveMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : "Approve"}
                    </button>
                    <button
                      onClick={() => handleReject(review.id)}
                      disabled={rejectMutation.isPending}
                      className="rounded-lg border px-3 py-1.5 text-xs font-medium hover:bg-accent disabled:opacity-50"
                    >
                      Reject
                    </button>
                  </>
                )}
                {review.status !== "pending" && (
                  <span className="rounded-lg bg-secondary px-3 py-1.5 text-xs font-medium">
                    {review.status.replace("_", " ")}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
