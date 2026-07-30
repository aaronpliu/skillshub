"use client";

import { Download, Terminal, Copy, Check } from "lucide-react";
import { useState } from "react";

export default function CliPage() {
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const CodeBlock = ({ code, id }: { code: string; id: string }) => (
    <div className="relative group">
      <pre className="bg-muted rounded-lg p-4 text-sm overflow-x-auto">
        <code>{code}</code>
      </pre>
      <button
        onClick={() => copyToClipboard(code, id)}
        className="absolute top-2 right-2 p-1.5 rounded-md bg-background border opacity-0 group-hover:opacity-100 transition-opacity"
        title="Copy to clipboard"
      >
        {copied === id ? (
          <Check className="h-4 w-4 text-green-600" />
        ) : (
          <Copy className="h-4 w-4" />
        )}
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-4xl px-6 py-12">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Terminal className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Skills Hub CLI</h1>
          </div>
          <p className="text-muted-foreground">
            Install and manage skills from the command line. The CLI works on any system with Node.js 18+.
          </p>
        </div>

        {/* Download */}
        <div className="bg-card border rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Download className="h-5 w-5" />
            Download the CLI
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            Download the CLI script and make it executable:
          </p>
          <CodeBlock
            id="download"
            code={`curl -o skills-hub ${typeof window !== "undefined" ? window.location.origin : "http://localhost:3000"}/api/cli
chmod +x skills-hub
sudo mv skills-hub /usr/local/bin/`}
          />
          <p className="text-xs text-muted-foreground mt-3">
            Or move it to any directory in your PATH (e.g., <code className="bg-muted px-1 rounded">~/.local/bin</code>).
          </p>
        </div>

        {/* Authentication */}
        <div className="bg-card border rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">1. Authenticate</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Log in with your organization credentials:
          </p>
          <CodeBlock
            id="login"
            code={`skills-hub auth login \\
  -u ${typeof window !== "undefined" ? window.location.origin : "http://localhost:3000"} \\
  -o your-org-slug \\
  -e your@email.com \\
  -p your-password`}
          />
          <p className="text-xs text-muted-foreground mt-3">
            Credentials are stored in <code className="bg-muted px-1 rounded">~/.skills-hub/config.json</code>.
          </p>
        </div>

        {/* Usage */}
        <div className="bg-card border rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">2. Browse and install skills</h2>

          <h3 className="text-sm font-semibold mt-4 mb-2">List available skills:</h3>
          <CodeBlock id="list" code="skills-hub skill list" />

          <h3 className="text-sm font-semibold mt-4 mb-2">Search for skills:</h3>
          <CodeBlock id="search" code='skills-hub skill list -q "code review"' />

          <h3 className="text-sm font-semibold mt-4 mb-2">View skill details:</h3>
          <CodeBlock id="info" code="skills-hub skill info <skill-id>" />

          <h3 className="text-sm font-semibold mt-4 mb-2">Install a skill:</h3>
          <CodeBlock id="install" code="skills-hub skill install <skill-id> -o ~/.skills" />
          <p className="text-xs text-muted-foreground mt-3">
            This creates a <code className="bg-muted px-1 rounded">SKILL.md</code> file in the output directory.
          </p>
        </div>

        {/* All commands */}
        <div className="bg-card border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">All commands</h2>
          <div className="space-y-3 text-sm">
            <div>
              <code className="font-mono bg-muted px-2 py-1 rounded">skills-hub auth login</code>
              <span className="text-muted-foreground ml-2">— Log in to Skills Hub</span>
            </div>
            <div>
              <code className="font-mono bg-muted px-2 py-1 rounded">skills-hub auth status</code>
              <span className="text-muted-foreground ml-2">— Show authentication status</span>
            </div>
            <div>
              <code className="font-mono bg-muted px-2 py-1 rounded">skills-hub auth logout</code>
              <span className="text-muted-foreground ml-2">— Clear stored credentials</span>
            </div>
            <div>
              <code className="font-mono bg-muted px-2 py-1 rounded">skills-hub skill list</code>
              <span className="text-muted-foreground ml-2">— List available skills</span>
            </div>
            <div>
              <code className="font-mono bg-muted px-2 py-1 rounded">skills-hub skill info &lt;id&gt;</code>
              <span className="text-muted-foreground ml-2">— Show skill details</span>
            </div>
            <div>
              <code className="font-mono bg-muted px-2 py-1 rounded">skills-hub skill install &lt;id&gt;</code>
              <span className="text-muted-foreground ml-2">— Install a skill locally</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
