"use client";

import { useState } from "react";
import { CheckCircle, XCircle, AlertCircle, Clock, Shield, Puzzle } from "lucide-react";

const MOCK_REVIEWS = [
  { id: "1", skillName: "report-generator", submitter: "Eve Wang", team: "Business Intelligence", classification: "internal", visibility: "organization", version: "2.0.0", submittedAt: "2026-07-22 10:30", scanStatus: "passed", priority: "normal" },
  { id: "2", skillName: "email-draft", submitter: "Frank Liu", team: "Communications", classification: "internal", visibility: "team", version: "1.1.0", submittedAt: "2026-07-22 08:15", scanStatus: "passed", priority: "normal" },
  { id: "3", skillName: "meeting-notes", submitter: "Grace Kim", team: "Product", classification: "public", visibility: "organization", version: "1.0.0", submittedAt: "2026-07-21 16:45", scanStatus: "warning", priority: "low" },
  { id: "4", skillName: "secret-scanner", submitter: "Henry Zhang", team: "Security", classification: "confidential", visibility: "department", version: "3.0.0", submittedAt: "2026-07-21 14:20", scanStatus: "passed", priority: "high" },
  { id: "5", skillName: "data-migrator", submitter: "Iris Patel", team: "Data Platform", classification: "restricted", visibility: "team", version: "1.0.0", submittedAt: "2026-07-20 11:00", scanStatus: "failed", priority: "high" },
];

export default function ReviewPage() {
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending");
  const [selectedReview, setSelectedReview] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Review Queue</h1>
        <p className="text-muted-foreground">Review and approve skills before they are published</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" /> Pending
          </div>
          <div className="mt-1 text-2xl font-bold">5</div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CheckCircle className="h-4 w-4 text-green-600" /> Approved (30d)
          </div>
          <div className="mt-1 text-2xl font-bold">23</div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <XCircle className="h-4 w-4 text-red-600" /> Rejected (30d)
          </div>
          <div className="mt-1 text-2xl font-bold">2</div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <AlertCircle className="h-4 w-4 text-amber-600" /> Avg Review Time
          </div>
          <div className="mt-1 text-2xl font-bold">4.2h</div>
        </div>
      </div>

      {/* Review List */}
      <div className="rounded-lg border bg-card">
        <div className="border-b p-4">
          <div className="flex gap-2">
            {(["pending", "approved", "rejected", "all"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  filter === f ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent"
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="divide-y">
          {MOCK_REVIEWS.map((review) => (
            <div
              key={review.id}
              className="flex items-center gap-4 p-4 hover:bg-accent/50 cursor-pointer"
              onClick={() => setSelectedReview(review.id)}
            >
              {/* Scan Status */}
              <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
                review.scanStatus === "passed" ? "bg-green-100" :
                review.scanStatus === "warning" ? "bg-amber-100" : "bg-red-100"
              }`}>
                {review.scanStatus === "passed" ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : review.scanStatus === "warning" ? (
                  <AlertCircle className="h-5 w-5 text-amber-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600" />
                )}
              </div>

              {/* Skill Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{review.skillName}</span>
                  <span className="rounded bg-secondary px-1.5 py-0.5 text-xs">v{review.version}</span>
                  {review.priority === "high" && (
                    <span className="rounded bg-red-100 px-1.5 py-0.5 text-xs text-red-700">High Priority</span>
                  )}
                </div>
                <div className="mt-0.5 text-sm text-muted-foreground">
                  by {review.submitter} &middot; {review.team} &middot; {review.visibility}
                </div>
              </div>

              {/* Classification Badge */}
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  review.classification === "public" ? "bg-green-100 text-green-700" :
                  review.classification === "confidential" ? "bg-orange-100 text-orange-700" :
                  review.classification === "restricted" ? "bg-red-100 text-red-700" :
                  "bg-blue-100 text-blue-700"
                }`}>
                  {review.classification}
                </span>
              </div>

              {/* Time */}
              <div className="text-xs text-muted-foreground w-24 text-right">{review.submittedAt}</div>

              {/* Actions */}
              <div className="flex gap-1">
                <button className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700">
                  Approve
                </button>
                <button className="rounded-lg border px-3 py-1.5 text-xs font-medium hover:bg-accent">
                  Review
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
