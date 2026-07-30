#!/usr/bin/env tsx
import { Command } from "commander";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import * as https from "https";
import * as http from "http";

// =============================================================================
// Config Management
// =============================================================================

interface CliConfig {
  serverUrl: string;
  token: string | null;
  orgSlug: string | null;
}

const CONFIG_DIR = path.join(os.homedir(), ".skills-hub");
const CONFIG_FILE = path.join(CONFIG_DIR, "config.json");

function loadConfig(): CliConfig {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      return JSON.parse(fs.readFileSync(CONFIG_FILE, "utf-8"));
    }
  } catch { /* ignore */ }
  return { serverUrl: "http://localhost:3000", token: null, orgSlug: null };
}

function saveConfig(config: CliConfig): void {
  fs.mkdirSync(CONFIG_DIR, { recursive: true });
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

// =============================================================================
// tRPC HTTP Client
// =============================================================================

async function trpcQuery<T>(baseUrl: string, token: string | null, procedure: string, input?: Record<string, unknown>): Promise<T> {
  const encodedInput = encodeURIComponent(JSON.stringify(input ?? {}));
  const url = `${baseUrl}/api/trpc/${procedure}?input=${encodedInput}`;

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(url, { headers });
  const body = await res.json() as any;

  if (!res.ok) {
    const msg = body?.error?.message || `Request failed (${res.status})`;
    throw new Error(msg);
  }

  return body.result?.data as T;
}

async function trpcMutation<T>(baseUrl: string, token: string | null, procedure: string, input?: Record<string, unknown>): Promise<T> {
  const url = `${baseUrl}/api/trpc/${procedure}`;

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(input ?? {}),
  });
  const body = await res.json() as any;

  if (!res.ok) {
    const msg = body?.error?.message || `Request failed (${res.status})`;
    throw new Error(msg);
  }

  return body.result?.data as T;
}

// =============================================================================
// Helper
// =============================================================================

function requireAuth(config: CliConfig): string {
  if (!config.token) {
    console.error("Error: Not authenticated. Run 'skills-hub auth login' first.");
    process.exit(1);
  }
  return config.token;
}

function printTable(rows: Record<string, string | number>[]): void {
  if (rows.length === 0) {
    console.log("  (no results)");
    return;
  }
  const cols = Object.keys(rows[0]);
  const widths = cols.map(c => Math.max(c.length, ...rows.map(r => String(r[c]).length)));
  const header = cols.map((c, i) => c.padEnd(widths[i])).join("  ");
  console.log(`  ${header}`);
  console.log(`  ${widths.map(w => "─".repeat(w)).join("  ")}`);
  for (const row of rows) {
    const line = cols.map((c, i) => String(row[c]).padEnd(widths[i])).join("  ");
    console.log(`  ${line}`);
  }
}

// =============================================================================
// CLI Definition
// =============================================================================

const program = new Command();

program
  .name("skills-hub")
  .description("Enterprise Skills Hub CLI — manage and install skills from the command line")
  .version("0.3.0");

// ---------------------------------------------------------------------------
// Auth commands
// ---------------------------------------------------------------------------

const auth = program.command("auth").description("Authentication management");

auth
  .command("login")
  .description("Log in to Skills Hub and store an API token")
  .requiredOption("-u, --url <url>", "Skills Hub server URL", "http://localhost:3000")
  .requiredOption("-o, --org <slug>", "Organization slug")
  .requiredOption("-e, --email <email>", "Email address")
  .requiredOption("-p, --password <password>", "Password")
  .action(async (opts) => {
    try {
      const result = await trpcMutation<{ accessToken: string; user: { name: string; email: string }; org: { name: string; slug: string } }>(
        opts.url, null, "auth.login",
        { email: opts.email, password: opts.password, orgSlug: opts.org }
      );

      const config: CliConfig = {
        serverUrl: opts.url,
        token: result.accessToken,
        orgSlug: result.org.slug,
      };
      saveConfig(config);

      console.log(`✓ Logged in as ${result.user.name} (${result.user.email})`);
      console.log(`  Organization: ${result.org.name}`);
      console.log(`  Server: ${opts.url}`);
      console.log(`  Config saved to ${CONFIG_FILE}`);
    } catch (err: any) {
      console.error(`✗ Login failed: ${err.message}`);
      process.exit(1);
    }
  });

auth
  .command("status")
  .description("Show current authentication status")
  .action(() => {
    const config = loadConfig();
    if (config.token) {
      console.log(`✓ Authenticated`);
      console.log(`  Server: ${config.serverUrl}`);
      console.log(`  Organization: ${config.orgSlug || "(unknown)"}`);
    } else {
      console.log("✗ Not authenticated. Run 'skills-hub auth login' to log in.");
    }
  });

auth
  .command("logout")
  .description("Clear stored credentials")
  .action(() => {
    saveConfig({ serverUrl: loadConfig().serverUrl, token: null, orgSlug: null });
    console.log("✓ Logged out. Credentials cleared.");
  });

// ---------------------------------------------------------------------------
// Skill commands
// ---------------------------------------------------------------------------

const skill = program.command("skill").description("Skill management");

skill
  .command("list")
  .description("List available published skills")
  .option("-q, --query <search>", "Search query")
  .option("--page <n>", "Page number", "1")
  .option("--limit <n>", "Results per page", "20")
  .action(async (opts) => {
    const config = loadConfig();
    try {
      // Use public search if not authenticated, authenticated search otherwise
      const procedure = config.token ? "skill.search" : "skill.publicSearch";
      const input: Record<string, unknown> = {
        page: parseInt(opts.page),
        pageSize: parseInt(opts.limit),
      };
      if (opts.query) input.q = opts.query;

      const result = await trpcQuery<{
        skills: Array<{ id: string; name: string; description: string; status: string; visibility: string; installCount: number; versionCount: number }>;
        total: number;
      }>(config.serverUrl, config.token, procedure, input);

      console.log(`\n  Skills (${result.total} total)\n`);
      printTable(
        result.skills.map((s) => ({
          ID: s.id.slice(0, 8),
          Name: s.name,
          Status: s.status,
          Installs: s.installCount,
          Versions: s.versionCount,
        }))
      );
      console.log();
    } catch (err: any) {
      console.error(`✗ Failed to list skills: ${err.message}`);
      process.exit(1);
    }
  });

skill
  .command("info")
  .description("Show detailed information about a skill")
  .argument("<id>", "Skill ID")
  .action(async (id: string) => {
    const config = loadConfig();
    try {
      const procedure = config.token ? "skill.getById" : "skill.publicGetById";
      const result = await trpcQuery<{
        id: string; name: string; description: string; status: string;
        visibility: string; installCount: number; category: string | null;
        tags: string[]; authorId: string; createdAt: string; updatedAt: string;
      }>(config.serverUrl, config.token, procedure, { id });

      console.log(`\n  Skill: ${result.name}`);
      console.log(`  ${"─".repeat(40)}`);
      console.log(`  ID:           ${result.id}`);
      console.log(`  Description:  ${result.description}`);
      console.log(`  Status:       ${result.status}`);
      console.log(`  Visibility:   ${result.visibility}`);
      console.log(`  Category:     ${result.category || "(none)"}`);
      console.log(`  Tags:         ${result.tags?.join(", ") || "(none)"}`);
      console.log(`  Installs:     ${result.installCount}`);
      console.log(`  Created:      ${new Date(result.createdAt).toLocaleDateString()}`);
      console.log(`  Updated:      ${new Date(result.updatedAt).toLocaleDateString()}`);
      console.log();
    } catch (err: any) {
      console.error(`✗ Failed to get skill info: ${err.message}`);
      process.exit(1);
    }
  });

skill
  .command("download")
  .description("Download and install a skill package")
  .argument("<id>", "Skill ID")
  .option("-o, --output <path>", "Output directory", ".")
  .action(async (id: string, opts) => {
    const config = loadConfig();
    const token = requireAuth(config);

    try {
      console.log(`  Fetching skill...`);

      const result = await trpcMutation<{ downloadUrl: string; packageHash: string }>(
        config.serverUrl, token, "skill.getDownloadUrl", { id }
      );

      console.log(`  ✓ Skill install recorded`);
      console.log(`  Download URL: ${result.downloadUrl}`);
      console.log(`  Package hash: ${result.packageHash}`);

      // If the download URL is a relative path, construct full URL
      const fullUrl = result.downloadUrl.startsWith("http")
        ? result.downloadUrl
        : `${config.serverUrl}${result.downloadUrl}`;

      // Download the content
      const res = await fetch(fullUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const content = await res.text();
        const outputPath = path.resolve(opts.output, `${id}.skill`);
        fs.writeFileSync(outputPath, content);
        console.log(`  ✓ Saved to ${outputPath}`);
      } else {
        console.log(`  ⚠ Could not download package (${res.status}). Install was recorded server-side.`);
      }
      console.log();
    } catch (err: any) {
      console.error(`✗ Failed to download skill: ${err.message}`);
      process.exit(1);
    }
  });

skill
  .command("install")
  .description("Install a skill (alias for download)")
  .argument("<id>", "Skill ID")
  .option("-o, --output <path>", "Output directory", ".")
  .action(async (id: string, opts) => {
    // Delegate to download
    await program.commands
      .find(c => c.name() === "skill")!
      .commands
      .find(c => c.name() === "download")!
      .parseAsync([id, "--output", opts.output]);
  });

// ---------------------------------------------------------------------------
// Parse and run
// ---------------------------------------------------------------------------

program.parse();
