"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Download, Star, GitBranch, Shield, Clock, User, Tag } from "lucide-react";
import Link from "next/link";

function SkillDetailContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id") || "1";
  const [activeTab, setActiveTab] = useState<"readme" | "versions" | "reviews">("readme");

  // Mock data
  const skill = {
    id: id,
    name: "data-analyzer",
    description: "Analyze CSV/Excel data and generate insights with charts and statistical analysis.",
    author: { name: "Alice Chen", email: "alice@acme.com" },
    team: "Data Platform",
    department: "Engineering",
    category: "Analytics",
    classification: "internal",
    visibility: "organization",
    tags: ["data", "csv", "excel", "analytics"],
    installs: 156,
    rating: 4.5,
    ratingCount: 23,
    version: "1.2.0",
    status: "approved",
    createdAt: "2026-06-15",
    updatedAt: "2026-07-22",
    versions: [
      { version: "1.2.0", changelog: "Added JSON support", date: "2026-07-22", author: "Alice Chen", status: "approved" },
      { version: "1.1.0", changelog: "Performance improvements", date: "2026-07-10", author: "Alice Chen", status: "approved" },
      { version: "1.0.0", changelog: "Initial release", date: "2026-06-15", author: "Alice Chen", status: "approved" },
    ],
    reviews: [
      { id: "1", rating: 5, comment: "Excellent skill, very useful for data analysis!", author: "Bob Smith", date: "2026-07-20" },
      { id: "2", rating: 4, comment: "Good, but could use more chart types.", author: "Carol Lee", date: "2026-07-18" },
    ],
  };

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Link href="/skills" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to Skills
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">{skill.name}</h1>
            <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
              {skill.status}
            </span>
          </div>
          <p className="text-lg text-muted-foreground">{skill.description}</p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1"><User className="h-3.5 w-3.5" /> {skill.author.name}</span>
            <span className="flex items-center gap-1"><GitBranch className="h-3.5 w-3.5" /> v{skill.version}</span>
            <span className="flex items-center gap-1"><Download className="h-3.5 w-3.5" /> {skill.installs} installs</span>
            <span className="flex items-center gap-1"><Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> {skill.rating} ({skill.ratingCount})</span>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            <Download className="h-4 w-4" /> Install
          </button>
          <Link href={`/skills/${skill.id}/edit`} className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium hover:bg-accent">
            Edit
          </Link>
        </div>
      </div>

      {/* Metadata */}
      <div className="flex flex-wrap gap-3">
        <span className="inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs">
          <Shield className="h-3 w-3" /> {skill.classification}
        </span>
        <span className="inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs">
          {skill.visibility}
        </span>
        <span className="inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs">
          <Clock className="h-3 w-3" /> Updated {skill.updatedAt}
        </span>
        {skill.tags.map((tag) => (
          <span key={tag} className="inline-flex items-center gap-1 rounded-lg bg-secondary px-3 py-1.5 text-xs">
            <Tag className="h-3 w-3" /> {tag}
          </span>
        ))}
      </div>

      {/* Tabs */}
      <div className="border-b">
        <div className="flex gap-6">
          {(["readme", "versions", "reviews"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`border-b-2 pb-3 text-sm font-medium transition-colors ${
                activeTab === tab
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
              {tab === "versions" && ` (${skill.versions.length})`}
              {tab === "reviews" && ` (${skill.reviews.length})`}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === "readme" && (
        <div className="prose prose-sm max-w-none dark:prose-invert">
          <h2>data-analyzer</h2>
          <p>Analyze CSV/Excel data and generate insights with charts and statistical analysis.</p>
          <h3>Steps</h3>
          <ol>
            <li>Read the input file (CSV, Excel, or JSON)</li>
            <li>Validate data format and structure</li>
            <li>Perform analysis based on user instructions</li>
            <li>Generate charts and summary statistics</li>
            <li>Output results as markdown or data file</li>
          </ol>
          <h3>Supported Formats</h3>
          <ul>
            <li>CSV (.csv)</li>
            <li>Excel (.xlsx, .xls)</li>
            <li>JSON (.json)</li>
          </ul>
          <h3>Configuration</h3>
          <ul>
            <li><code>MAX_ROWS</code>: Maximum rows to process (default: 100,000)</li>
            <li><code>CHART_FORMAT</code>: Output chart format (default: png)</li>
          </ul>
        </div>
      )}

      {activeTab === "versions" && (
        <div className="space-y-3">
          {skill.versions.map((v) => (
            <div key={v.version} className="rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm font-semibold">v{v.version}</span>
                  <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">{v.status}</span>
                </div>
                <span className="text-xs text-muted-foreground">{v.date}</span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{v.changelog}</p>
              <p className="mt-1 text-xs text-muted-foreground">by {v.author}</p>
            </div>
          ))}
        </div>
      )}

      {activeTab === "reviews" && (
        <div className="space-y-4">
          {skill.reviews.map((review) => (
            <div key={review.id} className="rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${i < review.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground"}`}
                      />
                    ))}
                  </div>
                  <span className="text-sm font-medium">{review.author}</span>
                </div>
                <span className="text-xs text-muted-foreground">{review.date}</span>
              </div>
              <p className="mt-2 text-sm">{review.comment}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function SkillDetailPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-12"><div className="animate-pulse text-muted-foreground">Loading...</div></div>}>
      <SkillDetailContent />
    </Suspense>
  );
}
