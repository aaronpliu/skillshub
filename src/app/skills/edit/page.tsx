"use client";

import { useState, Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Save, Send, Eye } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

function SkillEditContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = searchParams.get("id") || "";
  const [showPreview, setShowPreview] = useState(false);

  const { data: skill, isPending, error } = trpc.skill.getById.useQuery(
    { id },
    { enabled: !!id }
  );

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [version, setVersion] = useState("");
  const [visibility, setVisibility] = useState("team");
  const [classification, setClassification] = useState("internal");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");
  const [category, setCategory] = useState("");
  const [initialized, setInitialized] = useState(false);

  const updateMutation = trpc.skill.update.useMutation({
    onSuccess: () => {
      router.push(`/skills/detail?id=${id}`);
    },
  });

  // Pre-populate form when skill data loads
  useEffect(() => {
    if (skill && !initialized) {
      setName(skill.name);
      setDescription(skill.description);
      setVersion(skill.versions?.[0]?.version || "1.0.0");
      setVisibility(skill.visibility);
      setClassification(skill.classification);
      setContent(skill.versions?.[0]?.content || "");
      setTags(skill.tags?.join(", ") || "");
      setCategory(skill.category || "");
      setInitialized(true);
    }
  }, [skill, initialized]);

  const handleSave = () => {
    if (!name || !description) {
      alert("Please fill in all required fields");
      return;
    }

    updateMutation.mutate({
      id,
      description,
      visibility: visibility as any,
      classification: classification as any,
      tags: tags ? tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
      category: category || undefined,
    });
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/skills/detail?id=${id}`} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Edit Skill</h1>
            <p className="text-muted-foreground">Update skill metadata and SKILL.md content</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium hover:bg-accent"
          >
            <Eye className="h-4 w-4" /> {showPreview ? "Edit" : "Preview"}
          </button>
          <button className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium hover:bg-accent">
            <Save className="h-4 w-4" /> Save Draft
          </button>
          <button
            onClick={handleSave}
            disabled={updateMutation.isPending}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="h-4 w-4" /> {updateMutation.isPending ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>

      {/* Error message */}
      {updateMutation.error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-800">Error: {updateMutation.error.message}</p>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left: Form */}
        <div className="space-y-6">
          {/* Metadata */}
          <div className="rounded-lg border bg-card p-6 space-y-4">
            <h2 className="text-lg font-semibold">Skill Metadata</h2>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium">Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <p className="mt-1 text-xs text-muted-foreground">Lowercase, hyphens only. Max 64 chars.</p>
              </div>
              <div>
                <label className="text-sm font-medium">Version</label>
                <input
                  type="text"
                  value={version}
                  onChange={(e) => setVersion(e.target.value)}
                  className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Description *</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <p className="mt-1 text-xs text-muted-foreground">Third-person voice. Include WHAT and WHEN. Max 1024 chars.</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium">Visibility</label>
                <select
                  value={visibility}
                  onChange={(e) => setVisibility(e.target.value)}
                  className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="private">Private (only you)</option>
                  <option value="team">Team</option>
                  <option value="department">Department</option>
                  <option value="business_unit">Business Unit</option>
                  <option value="organization">Organization</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Classification</label>
                <select
                  value={classification}
                  onChange={(e) => setClassification(e.target.value)}
                  className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="public">Public</option>
                  <option value="internal">Internal</option>
                  <option value="confidential">Confidential</option>
                  <option value="restricted">Restricted</option>
                </select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium">Category</label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Tags</label>
                <input
                  type="text"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right: SKILL.md Editor / Preview */}
        <div className="rounded-lg border bg-card">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <h2 className="text-sm font-semibold">SKILL.md</h2>
            <span className="text-xs text-muted-foreground">{content.length} chars</span>
          </div>
          {showPreview ? (
            <div className="prose prose-sm max-w-none p-6 dark:prose-invert">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{content || "*No content to preview*"}</ReactMarkdown>
            </div>
          ) : (
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="h-[600px] w-full resize-none rounded-b-lg bg-background p-4 font-mono text-sm focus:outline-none"
              spellCheck={false}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default function SkillEditPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-12"><div className="animate-pulse text-muted-foreground">Loading...</div></div>}>
      <SkillEditContent />
    </Suspense>
  );
}
