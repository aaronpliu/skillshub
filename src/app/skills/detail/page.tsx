"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Download, Star, GitBranch, Shield, Clock, User, Tag, Copy, Check, Package, FileText } from "lucide-react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import JSZip from "jszip";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/lib/auth/session";

function SkillDetailContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id") || "";
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<"readme" | "versions" | "reviews">("readme");
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  // Use public or protected endpoint based on auth status
  const publicQuery = trpc.skill.publicGetById.useQuery(
    { id },
    { enabled: !isAuthenticated && !!id }
  );
  const authQuery = trpc.skill.getById.useQuery(
    { id },
    { enabled: isAuthenticated && !!id }
  );

  const query = isAuthenticated ? authQuery : publicQuery;
  const skill = query.data;
  const isPending = query.isPending;
  const error = query.error;

  // Download mutation (only for authenticated users)
  const downloadMutation = trpc.skill.getDownloadUrl.useMutation();

  // Get the latest version content for copy
  const latestVersion = skill?.versions?.[0];
  const skillContent = latestVersion?.content ?? null;

  const handleCopyPrompt = async () => {
    if (!skillContent) return;
    try {
      await navigator.clipboard.writeText(skillContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = skillContent;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = async () => {
    if (!skill) return;

    if (isAuthenticated && skillContent) {
      setDownloading(true);
      try {
        // Record the install via the backend
        try {
          await downloadMutation.mutateAsync({ id: skill.id });
        } catch {
          // Non-critical — proceed with download even if install recording fails
        }

        // Generate .skill zip package client-side
        const zip = new JSZip();
        zip.file("SKILL.md", skillContent);

        const manifest = {
          name: skill.name,
          version: latestVersion?.version ?? "1.0.0",
          description: skill.description,
          author: skill.author?.name ?? "Unknown",
          category: skill.category ?? "",
          tags: skill.tags ?? [],
          generatedAt: new Date().toISOString(),
        };
        zip.file("manifest.json", JSON.stringify(manifest, null, 2));

        const blob = await zip.generateAsync({ type: "blob" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${skill.name}-${latestVersion?.version ?? "1.0.0"}.skill`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } catch (err) {
        console.error("Download failed:", err);
      } finally {
        setDownloading(false);
      }
    }
  };

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
      <Link
        href="/skills"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Skills
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-3xl font-bold tracking-tight">{skill.name}</h1>
            <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
              {skill.status}
            </span>
          </div>
          <p className="text-lg text-muted-foreground">{skill.description}</p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1"><User className="h-3.5 w-3.5" /> {skill.author?.name}</span>
            <span className="flex items-center gap-1"><GitBranch className="h-3.5 w-3.5" /> {skill.versions?.[0]?.version || "N/A"}</span>
            <span className="flex items-center gap-1"><Download className="h-3.5 w-3.5" /> {skill._count?.installs || 0} installs</span>
            <span className="flex items-center gap-1"><Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> {skill.rating} ({skill.ratingCount})</span>
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          {/* Copy Prompt button */}
          {skillContent && (
            <button
              onClick={handleCopyPrompt}
              className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium hover:bg-accent transition-colors"
              title="Copy SKILL.md content to clipboard"
            >
              {copied ? (
                <><Check className="h-4 w-4 text-green-600" /> Copied!</>
              ) : (
                <><Copy className="h-4 w-4" /> Copy Prompt</>
              )}
            </button>
          )}
          {/* Download button */}
          {isAuthenticated ? (
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              <Package className="h-4 w-4" />
              {downloading ? "Packaging..." : "Download .skill"}
            </button>
          ) : (
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              <Download className="h-4 w-4" /> Sign In to Download
            </Link>
          )}
          {/* Edit button (only for authenticated users) */}
          {isAuthenticated && (
            <Link
              href={`/skills/edit?id=${skill.id}`}
              className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium hover:bg-accent"
            >
              Edit
            </Link>
          )}
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
        <div className="space-y-4">
          {skillContent ? (
            <div className="rounded-lg border bg-card">
              <div className="flex items-center justify-between border-b px-6 py-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <FileText className="h-4 w-4" /> SKILL.md
                </div>
                <button
                  onClick={handleCopyPrompt}
                  className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-accent transition-colors"
                >
                  {copied ? (
                    <><Check className="h-3 w-3 text-green-600" /> Copied</>
                  ) : (
                    <><Copy className="h-3 w-3" /> Copy</>
                  )}
                </button>
              </div>
              <div className="prose prose-sm max-w-none p-6 dark:prose-invert">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {skillContent}
                </ReactMarkdown>
              </div>
            </div>
          ) : (
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <h2>{skill.name}</h2>
              <p>{skill.description}</p>
              <p className="text-sm text-muted-foreground">
                No SKILL.md content available for this skill.
              </p>
            </div>
          )}
        </div>
      )}

      {activeTab === "versions" && (
        <div className="space-y-3">
          {skill.versions?.map((v) => (
            <div key={v.version} className="rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm font-semibold">v{v.version}</span>
                  <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700 dark:bg-green-900/30 dark:text-green-400">{v.reviewStatus}</span>
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
                  <span className="rounded-full bg-secondary px-2 py-0.5 text-xs">{review.status}</span>
                </div>
                <span className="text-xs text-muted-foreground">{new Date(review.createdAt).toLocaleDateString()}</span>
              </div>
              {review.comment && <p className="mt-2 text-sm">{review.comment}</p>}
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
