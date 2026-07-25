"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Download, Star, GitBranch, Shield, Clock, User, Tag } from "lucide-react";
import Link from "next/link";
import { trpc } from "@/lib/trpc";

function SkillDetailContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id") || "";
  const [activeTab, setActiveTab] = useState<"readme" | "versions" | "reviews">("readme");

  const { data: skill, isPending, error } = trpc.skill.getById.useQuery(
    { id },
    { enabled: !!id }
  );

  if (!id) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-red-600">No skill ID provided</div>
      </div>
    );
  }

  if (isPending) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (error || !skill) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-red-600">Error loading skill: {error?.message || "Skill not found"}</div>
      </div>
    );
  }

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
            <span className="flex items-center gap-1"><User className="h-3.5 w-3.5" /> {skill.author?.name}</span>
            <span className="flex items-center gap-1"><GitBranch className="h-3.5 w-3.5" /> {skill.versions?.[0]?.version || "N/A"}</span>
            <span className="flex items-center gap-1"><Download className="h-3.5 w-3.5" /> {skill._count?.installs || 0} installs</span>
            <span className="flex items-center gap-1"><Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> {skill.rating} ({skill.ratingCount})</span>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            <Download className="h-4 w-4" /> Install
          </button>
          <Link href={`/skills/edit?id=${skill.id}`} className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium hover:bg-accent">
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
          <Clock className="h-3 w-3" /> Updated {new Date(skill.updatedAt).toLocaleDateString()}
        </span>
        {skill.tags?.map((tag) => (
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
              {tab === "versions" && ` (${skill.versions?.length || 0})`}
              {tab === "reviews" && ` (${skill.reviews?.length || 0})`}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === "readme" && (
        <div className="prose prose-sm max-w-none dark:prose-invert">
          <h2>{skill.name}</h2>
          <p>{skill.description}</p>
          <p className="text-sm text-muted-foreground">
            Readme content is loaded from the SKILL.md file. Full markdown rendering will be available in a future update.
          </p>
        </div>
      )}

      {activeTab === "versions" && (
        <div className="space-y-3">
          {skill.versions?.map((v) => (
            <div key={v.version} className="rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm font-semibold">v{v.version}</span>
                  <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">{v.reviewStatus}</span>
                </div>
                <span className="text-xs text-muted-foreground">{new Date(v.publishedAt).toLocaleDateString()}</span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{v.changelog}</p>
              <p className="mt-1 text-xs text-muted-foreground">by {v.publisher?.name}</p>
            </div>
          ))}
          {(!skill.versions || skill.versions.length === 0) && (
            <div className="text-center py-4 text-sm text-muted-foreground">No versions available</div>
          )}
        </div>
      )}

      {activeTab === "reviews" && (
        <div className="space-y-4">
          {skill.reviews?.map((review) => (
            <div key={review.id} className="rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{review.reviewer?.name}</span>
                </div>
                <span className="text-xs text-muted-foreground">{new Date(review.createdAt).toLocaleDateString()}</span>
              </div>
              <p className="mt-2 text-sm">{review.comment}</p>
            </div>
          ))}
          {(!skill.reviews || skill.reviews.length === 0) && (
            <div className="text-center py-4 text-sm text-muted-foreground">No reviews yet</div>
          )}
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
