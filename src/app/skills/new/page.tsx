"use client";

import { useState } from "react";
import { ArrowLeft, Save, Send, Eye } from "lucide-react";
import Link from "next/link";

export default function NewSkillPage() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [version, setVersion] = useState("1.0.0");
  const [visibility, setVisibility] = useState("team");
  const [classification, setClassification] = useState("internal");
  const [content, setContent] = useState("# My Skill\n\n## Steps\n1. \n");
  const [tags, setTags] = useState("");
  const [category, setCategory] = useState("");
  const [showPreview, setShowPreview] = useState(false);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/skills" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Create New Skill</h1>
            <p className="text-muted-foreground">Define your skill metadata and write SKILL.md</p>
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
          <button className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            <Send className="h-4 w-4" /> Submit for Review
          </button>
        </div>
      </div>

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
                  placeholder="my-skill-name"
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
                  placeholder="1.0.0"
                  className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Description *</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What does this skill do? When should it be used?"
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
                  placeholder="analytics, document, integration..."
                  className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Tags</label>
                <input
                  type="text"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="comma, separated, tags"
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
              <div dangerouslySetInnerHTML={{ __html: content.replace(/^# (.+)$/gm, '<h1>$1</h1>').replace(/^## (.+)$/gm, '<h2>$1</h2>').replace(/\n/g, '<br/>') }} />
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
