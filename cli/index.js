#!/usr/bin/env node
// Enterprise Skills Hub CLI — zero dependencies, runs with node 18+
"use strict";

const fs = require("fs");
const path = require("path");
const os = require("os");

// =============================================================================
// Config
// =============================================================================

const CONFIG_DIR = path.join(os.homedir(), ".skills-hub");
const CONFIG_FILE = path.join(CONFIG_DIR, "config.json");
const VERSION = "0.3.0";

function loadConfig() {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      return JSON.parse(fs.readFileSync(CONFIG_FILE, "utf-8"));
    }
  } catch { /* ignore */ }
  return { serverUrl: "http://localhost:3000", token: null, orgSlug: null };
}

function saveConfig(config) {
  fs.mkdirSync(CONFIG_DIR, { recursive: true });
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

// =============================================================================
// tRPC HTTP helpers (uses built-in fetch, Node 18+)
// =============================================================================

async function trpcQuery(baseUrl, token, procedure, input) {
  const encoded = encodeURIComponent(JSON.stringify(input || {}));
  const url = `${baseUrl}/api/trpc/${procedure}?input=${encoded}`;
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(url, { headers });
  const body = await res.json();
  if (!res.ok) throw new Error(body?.error?.message || `Request failed (${res.status})`);
  return body.result?.data;
}

async function trpcMutation(baseUrl, token, procedure, input) {
  const url = `${baseUrl}/api/trpc/${procedure}`;
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(url, { method: "POST", headers, body: JSON.stringify(input || {}) });
  const body = await res.json();
  if (!res.ok) throw new Error(body?.error?.message || `Request failed (${res.status})`);
  return body.result?.data;
}

// =============================================================================
// Arg parsing helpers
// =============================================================================

function getFlag(args, ...names) {
  for (const name of names) {
    const idx = args.indexOf(name);
    if (idx !== -1 && idx + 1 < args.length) return args[idx + 1];
  }
  return null;
}

function hasFlag(args, ...names) {
  return names.some((n) => args.includes(n));
}

function getPositional(args, index) {
  const positional = args.filter((a) => !a.startsWith("-") && (index === 0 || !args.slice(0, args.indexOf(a)).some((p) => ["-u","--url","-o","--output","-e","--email","-p","--password","-q","--query","--page","--limit","--version"].includes(args[args.indexOf(a) - 1]))));
  return positional[index] || null;
}

function printTable(rows) {
  if (rows.length === 0) { console.log("  (no results)"); return; }
  const cols = Object.keys(rows[0]);
  const widths = cols.map((c) => Math.max(c.length, ...rows.map((r) => String(r[c]).length)));
  console.log(`  ${cols.map((c, i) => c.padEnd(widths[i])).join("  ")}`);
  console.log(`  ${widths.map((w) => "─".repeat(w)).join("  ")}`);
  for (const row of rows) {
    console.log(`  ${cols.map((c, i) => String(row[c]).padEnd(widths[i])).join("  ")}`);
  }
}

// =============================================================================
// Commands
// =============================================================================

async function cmdAuthLogin(args) {
  const url = getFlag(args, "-u", "--url") || "http://localhost:3000";
  const org = getFlag(args, "-o", "--org");
  const email = getFlag(args, "-e", "--email");
  const password = getFlag(args, "-p", "--password");

  if (!org || !email || !password) {
    console.error("Usage: skills-hub auth login -u <url> -o <org> -e <email> -p <password>");
    process.exit(1);
  }

  try {
    const result = await trpcMutation(url, null, "auth.login", { email, password, orgSlug: org });
    saveConfig({ serverUrl: url, token: result.accessToken, orgSlug: result.org.slug });
    console.log(`✓ Logged in as ${result.user.name} (${result.user.email})`);
    console.log(`  Organization: ${result.org.name}`);
    console.log(`  Server: ${url}`);
    console.log(`  Config saved to ${CONFIG_FILE}`);
  } catch (err) {
    console.error(`✗ Login failed: ${err.message}`);
    process.exit(1);
  }
}

function cmdAuthStatus() {
  const config = loadConfig();
  if (config.token) {
    console.log("✓ Authenticated");
    console.log(`  Server: ${config.serverUrl}`);
    console.log(`  Organization: ${config.orgSlug || "(unknown)"}`);
  } else {
    console.log("✗ Not authenticated. Run 'skills-hub auth login' to log in.");
  }
}

function cmdAuthLogout() {
  saveConfig({ serverUrl: loadConfig().serverUrl, token: null, orgSlug: null });
  console.log("✓ Logged out. Credentials cleared.");
}

async function cmdSkillList(args) {
  const config = loadConfig();
  const query = getFlag(args, "-q", "--query");
  const page = parseInt(getFlag(args, "--page") || "1");
  const limit = parseInt(getFlag(args, "--limit") || "20");

  try {
    const procedure = config.token ? "skill.search" : "skill.publicSearch";
    const input = { page, pageSize: limit };
    if (query) input.q = query;

    const result = await trpcQuery(config.serverUrl, config.token, procedure, input);
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
  } catch (err) {
    console.error(`✗ Failed to list skills: ${err.message}`);
    process.exit(1);
  }
}

async function cmdSkillInfo(args) {
  const config = loadConfig();
  // First non-flag arg is the ID
  const id = args.find((a) => !a.startsWith("-"));
  if (!id) {
    console.error("Usage: skills-hub skill info <id>");
    process.exit(1);
  }

  try {
    const procedure = config.token ? "skill.getById" : "skill.publicGetById";
    const result = await trpcQuery(config.serverUrl, config.token, procedure, { id });
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
  } catch (err) {
    console.error(`✗ Failed to get skill info: ${err.message}`);
    process.exit(1);
  }
}

async function cmdSkillInstall(args) {
  const config = loadConfig();
  if (!config.token) {
    console.error("Error: Not authenticated. Run 'skills-hub auth login' first.");
    process.exit(1);
  }

  const id = args.find((a) => !a.startsWith("-"));
  if (!id) {
    console.error("Usage: skills-hub skill install <id> [-o <dir>] [--version <v>]");
    process.exit(1);
  }

  const output = getFlag(args, "-o", "--output") || ".skills";
  const version = getFlag(args, "--version");

  try {
    console.log("  Fetching skill...");
    const result = await trpcMutation(config.serverUrl, config.token, "skill.getDownloadUrl", { id, version });

    if (result.content) {
      const skillDir = path.resolve(output, result.skillName || id);
      fs.mkdirSync(skillDir, { recursive: true });
      fs.writeFileSync(path.join(skillDir, "SKILL.md"), result.content);
      console.log(`  ✓ Skill installed to ${skillDir}`);
      console.log(`  Version: ${result.version}`);
      console.log(`  Package hash: ${result.packageHash || "n/a"}`);
    } else if (result.downloadUrl) {
      const fullUrl = result.downloadUrl.startsWith("http")
        ? result.downloadUrl
        : `${config.serverUrl}${result.downloadUrl}`;
      const res = await fetch(fullUrl, { headers: { Authorization: `Bearer ${config.token}` } });
      if (!res.ok) {
        console.error(`  ✗ Failed to download (${res.status})`);
        process.exit(1);
      }
      const content = await res.text();
      const skillDir = path.resolve(output, result.skillName || id);
      fs.mkdirSync(skillDir, { recursive: true });
      fs.writeFileSync(path.join(skillDir, "SKILL.md"), content);
      console.log(`  ✓ Skill installed to ${skillDir}`);
      console.log(`  Version: ${result.version}`);
    } else {
      console.error("  ✗ No content or download URL available");
      process.exit(1);
    }
    console.log("  Install recorded ✓\n");
  } catch (err) {
    console.error(`✗ Failed to install skill: ${err.message}`);
    process.exit(1);
  }
}

// =============================================================================
// Help text
// =============================================================================

const HELP = `
  skills-hub v${VERSION} — Enterprise Skills Hub CLI

  Usage: skills-hub <command> [options]

  Commands:
    auth login     Log in to Skills Hub
      -u, --url <url>        Server URL (default: http://localhost:3000)
      -o, --org <slug>       Organization slug
      -e, --email <email>    Email address
      -p, --password <pass>  Password

    auth status    Show authentication status
    auth logout    Clear stored credentials

    skill list     List available skills
      -q, --query <search>   Search query
      --page <n>             Page number (default: 1)
      --limit <n>            Results per page (default: 20)

    skill info <id>          Show skill details

    skill install <id>       Install a skill locally
      -o, --output <dir>     Output directory (default: .skills)
      --version <v>          Specific version

  Examples:
    skills-hub auth login -u https://hub.example.com -o acme -e user@acme.com -p secret
    skills-hub skill list
    skills-hub skill list -q "code review"
    skills-hub skill info abc123
    skills-hub skill install abc123 -o ~/.skills
`;

// =============================================================================
// Router
// =============================================================================

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const subcommand = args[1];
  const rest = args.slice(2);

  if (!command || hasFlag(args, "-h", "--help")) {
    console.log(HELP);
    return;
  }
  if (hasFlag(args, "-V", "--version")) {
    console.log(VERSION);
    return;
  }

  if (command === "auth") {
    if (subcommand === "login") return cmdAuthLogin(rest);
    if (subcommand === "status") return cmdAuthStatus();
    if (subcommand === "logout") return cmdAuthLogout();
  }

  if (command === "skill") {
    if (subcommand === "list") return cmdSkillList(rest);
    if (subcommand === "info") return cmdSkillInfo(rest);
    if (subcommand === "install" || subcommand === "download") return cmdSkillInstall(rest);
  }

  console.error(`Unknown command: ${command} ${subcommand || ""}`);
  console.log(HELP);
  process.exit(1);
}

main();
