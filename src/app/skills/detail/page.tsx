"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft, Download, Star, GitBranch, Shield, Clock, User, Tag,
  Copy, Check, Package, FileText, Terminal, BookOpen, ChevronDown, ChevronUp,
} from "lucide-react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import JSZip from "jszip";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/lib/auth/session";

// =============================================================================
// Star Rating Component
// =============================================================================
function StarRating({
  value,
  onChange,
  readonly = false,
  size = "md",
}: {
  value: number;
  onChange?: (rating: number) => void;
  readonly?: boolean;
  size?: "sm" | "md";
}) {
  const [hover, setHover] = useState(0);
  const iconSize = size === "sm" ? "h-4 w-4" : "h-5 w-5";

  return (
    <div className="inline-flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= (hover || value);
        return (
          <button
            key={star}
            type="button"
            disabled={readonly}
            onClick={() => onChange?.(star)}
            onMouseEnter={() => !readonly && setHover(star)}
            onMouseLeave={() => !readonly && setHover(0)}
            className={`${readonly ? "cursor-default" : "cursor-pointer hover:scale-110"} transition-transform`}
          >
            <Star className={`${iconSize} ${filled ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40"}`} />
          </button>
        );
      })}
    </div>
  );
}

// =============================================================================
// Main Component
// =============================================================================
function SkillDetailContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id") || "";
  const { isAuthenticated, user } = useAuth();
  const [activeTab, setActiveTab] = useState<"readme" | "install" | "versions" | "reviews">("readme");
  const [copied, setCopied] = useState(false);
  const [copiedInstall, setCopiedInstall] = useState(false);
  const [downloading, setDownloading] = useState(false);

  // Rating state
  const [userRating, setUserRating] = useState(0);
  const [ratingSubmitting, setRatingSubmitting] = useState(false);
  const [ratingSuccess, setRatingSuccess] = useState(false);

  // Use public or protected endpoint based on auth status
  const publicQuery = trpc.skill.publicGetById.useQuery({ id }, { enabled: !isAuthenticated && !!id });
  const authQuery = trpc.skill.getById.useQuery({ id }, { enabled: isAuthenticated && !!id });

  const query = isAuthenticated ? authQuery : publicQuery;
  const skill = query.data;
  const isPending = query.isPending;
  const error = query.error;

  // Mutations
  const downloadMutation = trpc.skill.getDownloadUrl.useMutation();
  const rateMutation = trpc.skill.rate.useMutation();
  const submitMutation = trpc.skill.submitForReview.useMutation();

  const latestVersion = skill?.versions?.[0];
  const skillContent = latestVersion?.content ?? null;

  // Install command for this skill
  const installCommand = skill ? `skillshub install ${skill.name}` : "";

  // ---- Handlers ----
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

  const handleCopyInstall = async () => {
    if (!installCommand) return;
    try {
      await navigator.clipboard.writeText(installCommand);
      setCopiedInstall(true);
      setTimeout(() => setCopiedInstall(false), 2000);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = installCommand;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopiedInstall(true);
      setTimeout(() => setCopiedInstall(false), 2000);
    }
  };

  const handleDownload = async () => {
    if (!skill) return;
    if (isAuthenticated && skillContent) {
      setDownloading(true);
      try {
        try { await downloadMutation.mutateAsync({ id: skill.id }); } catch { /* non-critical */ }

        const zip = new JSZip();
        zip.file("SKILL.md", skillContent);
        zip.file("manifest.json", JSON.stringify({
          name: skill.name,
          version: latestVersion?.version ?? "1.0.0",
          description: skill.description,
          author: skill.author?.name ?? "Unknown",
          category: skill.category ?? "",
          tags: skill.tags ?? [],
          generatedAt: new Date().toISOString(),
        }, null, 2));

        const blob = await zip.generateAsync({ type: "blob" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${skill.name}-${latestVersion?.version ?? "1.0.0"}.zip`;
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

  const handleRate = async (rating: number) => {
    if (!skill || !isAuthenticated) return;
    setUserRating(rating);
    setRatingSubmitting(true);
    try {
      await rateMutation.mutateAsync({ skillId: skill.id, rating });
      setRatingSuccess(true);
      setTimeout(() => setRatingSuccess(false), 3000);
      // Refresh skill data to show updated rating
      await query.refetch();
    } catch (err) {
      console.error("Rating failed:", err);
    } finally {
      setRatingSubmitting(false);
    }
  };

  const handleSubmitForReview = async () => {
    if (!skill) return;
    try {
      await submitMutation.mutateAsync({ id: skill.id });
      await query.refetch();
    } catch (err) {
      console.error("Submit for review failed:", err);
    }
  };

  // ---- Render states ----
  if (!id) return <div className="flex items-center justify-center py-12"><div className="text-red-600">No skill ID provided</div></div>;
  if (isPending) return <div className="flex items-center justify-center py-12"><div className="animate-pulse text-muted-foreground">Loading...</div></div>;
  if (error || !skill) return <div className="flex items-center justify-center py-12"><div className="text-red-600">Error: {error?.message || "Skill not found"}</div></div>;

  return (
    <div className="space-y-6">
      {/* Back */}
      <Link href="/skills" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to Skills
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-3xl font-bold tracking-tight">{skill.name}</h1>
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
              skill.status === "published" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
              skill.status === "pending_review" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" :
              skill.status === "draft" ? "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400" :
              skill.status === "rejected" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" :
              "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
            }`}>
              {skill.status === "pending_review" ? "Pending Review" : skill.status}
            </span>
          </div>
          <p className="text-lg text-muted-foreground">{skill.description}</p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1"><User className="h-3.5 w-3.5" /> {skill.author?.name}</span>
            <span className="flex items-center gap-1"><GitBranch className="h-3.5 w-3.5" /> {skill.versions?.[0]?.version || "N/A"}</span>
            <span className="flex items-center gap-1"><Download className="h-3.5 w-3.5" /> {skill._count?.installs || 0} installs</span>
            <span className="flex items-center gap-1">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              {skill.rating.toFixed(1)} ({skill.ratingCount})
            </span>
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          {skillContent && (
            <button onClick={handleCopyPrompt} className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium hover:bg-accent transition-colors">
              {copied ? <><Check className="h-4 w-4 text-green-600" /> Copied!</> : <><Copy className="h-4 w-4" /> Copy Prompt</>}
            </button>
          )}
          {isAuthenticated ? (
            <button onClick={handleDownload} disabled={downloading} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
              <Package className="h-4 w-4" /> {downloading ? "Packaging..." : "Download .zip"}
            </button>
          ) : (
            <Link href="/login" className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
              <Download className="h-4 w-4" /> Sign In to Download
            </Link>
          )}
          {isAuthenticated && user?.id === skill.author?.id && (
            <Link href={`/skills/edit?id=${skill.id}`} className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium hover:bg-accent">
              Edit
            </Link>
          )}
          {/* Submit for Review — shown for author's draft/rejected skills */}
          {isAuthenticated && user?.id === skill.author?.id && (skill.status === "draft" || skill.status === "rejected") && (
            <button
              onClick={handleSubmitForReview}
              disabled={submitMutation.isPending}
              className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50"
            >
              {submitMutation.isPending ? "Submitting..." : "Submit for Review"}
            </button>
          )}
        </div>
      </div>

      {/* Metadata */}
      <div className="flex flex-wrap gap-3">
        <span className="inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs">
          <Shield className="h-3 w-3" /> {skill.classification}
        </span>
        <span className="inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs">{skill.visibility}</span>
        <span className="inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs">
          <Clock className="h-3 w-3" /> Updated {new Date(skill.updatedAt).toLocaleDateString()}
        </span>
        {skill.tags?.map((tag) => (
          <span key={tag} className="inline-flex items-center gap-1 rounded-lg bg-secondary px-3 py-1.5 text-xs">
            <Tag className="h-3 w-3" /> {tag}
          </span>
        ))}
      </div>

      {/* Rating (authenticated users) */}
      {isAuthenticated && (
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium">Rate this skill</span>
              <StarRating value={userRating} onChange={handleRate} />
              {ratingSubmitting && <span className="text-xs text-muted-foreground">Submitting...</span>}
              {ratingSuccess && <span className="text-xs text-green-600">Rating saved!</span>}
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <StarRating value={skill.rating} readonly size="sm" />
              <span>{skill.rating.toFixed(1)} ({skill.ratingCount} ratings)</span>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b">
        <div className="flex gap-6">
          {(["readme", "install", "versions", "reviews"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`border-b-2 pb-3 text-sm font-medium transition-colors ${
                activeTab === tab ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab === "readme" && "Readme"}
              {tab === "install" && "Install"}
              {tab === "versions" && `Versions (${skill.versions?.length || 0})`}
              {tab === "reviews" && `Reviews (${skill.reviews?.length || 0})`}
            </button>
          ))}
        </div>
      </div>

      {/* Tab: Readme */}
      {activeTab === "readme" && (
        <div className="space-y-4">
          {skillContent ? (
            <div className="rounded-lg border bg-card">
              <div className="flex items-center justify-between border-b px-6 py-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground"><FileText className="h-4 w-4" /> SKILL.md</div>
                <button onClick={handleCopyPrompt} className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-accent transition-colors">
                  {copied ? <><Check className="h-3 w-3 text-green-600" /> Copied</> : <><Copy className="h-3 w-3" /> Copy</>}
                </button>
              </div>
              <div className="prose prose-sm max-w-none p-6 dark:prose-invert">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{skillContent}</ReactMarkdown>
              </div>
            </div>
          ) : (
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <h2>{skill.name}</h2>
              <p>{skill.description}</p>
            </div>
          )}
        </div>
      )}

      {/* Tab: Install */}
      {activeTab === "install" && (
        <div className="space-y-6">
          {/* Quick Install */}
          <div className="rounded-lg border bg-card p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Terminal className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">Quick Install</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              Install this skill directly from Skills Hub using the CLI:
            </p>
            <div className="relative rounded-lg bg-muted p-4">
              <code className="text-sm font-mono">{installCommand}</code>
              <button
                onClick={handleCopyInstall}
                className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-md border bg-background px-2.5 py-1 text-xs font-medium hover:bg-accent transition-colors"
              >
                {copiedInstall ? <><Check className="h-3 w-3 text-green-600" /> Copied</> : <><Copy className="h-3 w-3" /> Copy</>}
              </button>
            </div>
          </div>

          {/* Manual Install */}
          <div className="rounded-lg border bg-card p-6 space-y-4">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">Manual Installation</h2>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">1</span>
                <div>
                  <p className="font-medium">Download the skill package</p>
                  <p className="text-muted-foreground">Click the "Download .zip" button above to get the skill package containing SKILL.md and manifest.json.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">2</span>
                <div>
                  <p className="font-medium">Extract to your skills directory</p>
                  <p className="text-muted-foreground">Unzip the package and place the SKILL.md file in your agent's skills directory:</p>
                  <div className="mt-2 rounded-md bg-muted p-3 font-mono text-xs">
                    <p>~/.qoderworkcn/skills/{skill.name}/SKILL.md</p>
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">3</span>
                <div>
                  <p className="font-medium">Verify installation</p>
                  <p className="text-muted-foreground">The skill should now be available to your agent. You can check by asking your agent to list available skills.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Copy Prompt */}
          {skillContent && (
            <div className="rounded-lg border bg-card p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Copy className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-semibold">Copy Prompt</h2>
                </div>
                <button onClick={handleCopyPrompt} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
                  {copied ? <><Check className="h-4 w-4" /> Copied!</> : <><Copy className="h-4 w-4" /> Copy SKILL.md</>}
                </button>
              </div>
              <p className="text-sm text-muted-foreground">
                Copy the raw SKILL.md content and paste it directly into your agent's configuration or prompt.
              </p>
            </div>
          )}

          {/* Download for offline use */}
          {isAuthenticated && (
            <div className="rounded-lg border bg-card p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-semibold">Download Package</h2>
                </div>
                <button onClick={handleDownload} disabled={downloading} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
                  <Download className="h-4 w-4" /> {downloading ? "Packaging..." : "Download .zip"}
                </button>
              </div>
              <p className="text-sm text-muted-foreground">
                Download the complete skill package as a .zip file for offline use or sharing.
                Includes SKILL.md and manifest.json.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Tab: Versions */}
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

      {/* Tab: Reviews */}
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
