"use client";

import { useState } from "react";
import { Search, Filter, Plus, Puzzle, Download, Star } from "lucide-react";
import Link from "next/link";

const CATEGORIES = ["All", "Analytics", "Data", "Document", "Integration", "Development", "Security"];
const CLASSIFICATIONS = ["All", "Public", "Internal", "Confidential", "Restricted"];

// Mock data for demo
const MOCK_SKILLS = [
  { id: "1", name: "data-analyzer", description: "Analyze CSV/Excel data and generate insights with charts", author: "Alice Chen", team: "Data Platform", category: "Analytics", classification: "internal", installs: 156, rating: 4.5, tags: ["data", "csv", "excel"], updatedAt: "2026-07-22" },
  { id: "2", name: "pdf-processor", description: "Process PDF documents: extract text, merge, split, watermark", author: "Bob Smith", team: "Document Services", category: "Document", classification: "internal", installs: 98, rating: 4.2, tags: ["pdf", "document"], updatedAt: "2026-07-21" },
  { id: "3", name: "api-integration", description: "Helper for integrating with REST APIs with auth and retry logic", author: "Carol Lee", team: "Platform Engineering", category: "Integration", classification: "internal", installs: 87, rating: 4.0, tags: ["api", "rest", "http"], updatedAt: "2026-07-20" },
  { id: "4", name: "code-reviewer", description: "Automated code review following team standards and best practices", author: "Dave Park", team: "Engineering Excellence", category: "Development", classification: "internal", installs: 72, rating: 4.8, tags: ["code", "review", "quality"], updatedAt: "2026-07-19" },
  { id: "5", name: "report-generator", description: "Generate weekly and monthly reports from multiple data sources", author: "Eve Wang", team: "Business Intelligence", category: "Analytics", classification: "confidential", installs: 64, rating: 3.9, tags: ["report", "analytics"], updatedAt: "2026-07-18" },
  { id: "6", name: "email-draft", description: "Draft professional emails with tone adjustment and template support", author: "Frank Liu", team: "Communications", category: "Document", classification: "internal", installs: 53, rating: 4.1, tags: ["email", "writing"], updatedAt: "2026-07-17" },
];

export default function SkillsPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [view, setView] = useState<"grid" | "list">("grid");

  const filtered = MOCK_SKILLS.filter((s) => {
    const matchesSearch = !search || s.name.includes(search) || s.description.includes(search);
    const matchesCategory = category === "All" || s.category === category;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Skills</h1>
          <p className="text-muted-foreground">Browse and install skills for your workflows</p>
        </div>
        <Link
          href="/skills/new"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          New Skill
        </Link>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search skills..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border bg-background py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Results */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((skill) => (
          <Link key={skill.id} href={`/skills/detail?id=${skill.id}`}>
            <div className="rounded-lg border bg-card p-5 transition-colors hover:border-primary/50 hover:shadow-sm">
              <div className="flex items-start justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Puzzle className="h-5 w-5 text-primary" />
                </div>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  skill.classification === "public" ? "bg-green-100 text-green-700" :
                  skill.classification === "confidential" ? "bg-orange-100 text-orange-700" :
                  skill.classification === "restricted" ? "bg-red-100 text-red-700" :
                  "bg-blue-100 text-blue-700"
                }`}>
                  {skill.classification}
                </span>
              </div>
              <h3 className="mt-3 text-sm font-semibold">{skill.name}</h3>
              <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{skill.description}</p>
              <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Download className="h-3 w-3" /> {skill.installs}
                </span>
                <span className="flex items-center gap-1">
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" /> {skill.rating}
                </span>
                <span className="ml-auto">{skill.author}</span>
              </div>
              <div className="mt-2 flex gap-1">
                {skill.tags.slice(0, 3).map((tag) => (
                  <span key={tag} className="rounded bg-secondary px-1.5 py-0.5 text-xs text-secondary-foreground">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </Link>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Puzzle className="h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-medium">No skills found</h3>
          <p className="text-sm text-muted-foreground">Try adjusting your search or filters</p>
        </div>
      )}
    </div>
  );
}
