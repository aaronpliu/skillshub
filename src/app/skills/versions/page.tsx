"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, GitBranch, CheckCircle, XCircle, Clock, GitCompare } from "lucide-react";
import Link from "next/link";

const MOCK_VERSIONS = [
  {
    version: "1.2.0",
    date: "2026-07-22",
    author: "Alice Chen",
    changelog: "Added JSON support and improved error handling",
    scanStatus: "passed",
    reviewStatus: "approved",
    changes: [
      { type: "added", description: "JSON file format support" },
      { type: "improved", description: "Error messages for invalid data" },
      { type: "fixed", description: "Memory leak in large file processing" },
    ],
  },
  {
    version: "1.1.0",
    date: "2026-07-10",
    author: "Alice Chen",
    changelog: "Performance improvements and bug fixes",
    scanStatus: "passed",
    reviewStatus: "approved",
    changes: [
      { type: "improved", description: "50% faster CSV parsing" },
      { type: "improved", description: "Reduced memory footprint" },
      { type: "fixed", description: "Chart rendering on Safari" },
    ],
  },
  {
    version: "1.0.1",
    date: "2026-06-28",
    author: "Alice Chen",
    changelog: "Hotfix for critical bug",
    scanStatus: "passed",
    reviewStatus: "approved",
    changes: [
      { type: "fixed", description: "Critical crash on empty files" },
    ],
  },
  {
    version: "1.0.0",
    date: "2026-06-15",
    author: "Alice Chen",
    changelog: "Initial release",
    scanStatus: "passed",
    reviewStatus: "approved",
    changes: [
      { type: "added", description: "CSV and Excel file support" },
      { type: "added", description: "Basic chart generation" },
      { type: "added", description: "Statistical analysis features" },
    ],
  },
];

function SkillVersionsContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id") || "1";
  const [selectedVersions, setSelectedVersions] = useState<string[]>([]);

  const toggleVersion = (version: string) => {
    setSelectedVersions((prev) =>
      prev.includes(version) ? prev.filter((v) => v !== version) : [...prev, version]
    );
  };

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Link href={`/skills/detail?id=${id}`} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to Skill
      </Link>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Version History</h1>
          <p className="text-muted-foreground">Track all versions and changes to this skill</p>
        </div>
        {selectedVersions.length === 2 && (
          <button className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            <GitCompare className="h-4 w-4" /> Compare Versions
          </button>
        )}
      </div>

      {selectedVersions.length > 0 && selectedVersions.length !== 2 && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
          <p className="text-sm text-blue-800">
            Select exactly 2 versions to compare. Currently selected: {selectedVersions.length}
          </p>
        </div>
      )}

      {/* Timeline */}
      <div className="space-y-4">
        {MOCK_VERSIONS.map((version, index) => (
          <div key={version.version} className="relative rounded-lg border bg-card p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={selectedVersions.includes(version.version)}
                  onChange={() => toggleVersion(version.version)}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <GitBranch className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold">v{version.version}</h3>
                    {index === 0 && (
                      <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                        latest
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{version.changelog}</p>
                </div>
              </div>
              <div className="text-right text-sm text-muted-foreground">
                <div>{version.date}</div>
                <div className="text-xs">by {version.author}</div>
              </div>
            </div>

            {/* Status badges */}
            <div className="mt-4 flex gap-2">
              <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                version.scanStatus === "passed" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
              }`}>
                {version.scanStatus === "passed" ? (
                  <CheckCircle className="h-3 w-3" />
                ) : (
                  <XCircle className="h-3 w-3" />
                )}
                Scan: {version.scanStatus}
              </span>
              <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                version.reviewStatus === "approved" ? "bg-green-100 text-green-700" :
                version.reviewStatus === "pending" ? "bg-yellow-100 text-yellow-700" :
                "bg-red-100 text-red-700"
              }`}>
                {version.reviewStatus === "approved" ? (
                  <CheckCircle className="h-3 w-3" />
                ) : version.reviewStatus === "pending" ? (
                  <Clock className="h-3 w-3" />
                ) : (
                  <XCircle className="h-3 w-3" />
                )}
                Review: {version.reviewStatus}
              </span>
            </div>

            {/* Changes list */}
            <div className="mt-4 space-y-2">
              {version.changes.map((change, idx) => (
                <div key={idx} className="flex items-start gap-2 text-sm">
                  <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${
                    change.type === "added" ? "bg-green-100 text-green-700" :
                    change.type === "improved" ? "bg-blue-100 text-blue-700" :
                    change.type === "fixed" ? "bg-orange-100 text-orange-700" :
                    "bg-gray-100 text-gray-700"
                  }`}>
                    {change.type}
                  </span>
                  <span className="text-muted-foreground">{change.description}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function SkillVersionsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-12"><div className="animate-pulse text-muted-foreground">Loading...</div></div>}>
      <SkillVersionsContent />
    </Suspense>
  );
}
