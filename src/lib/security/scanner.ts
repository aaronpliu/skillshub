import { DLPScanner, type DLPResult } from "@/lib/security/dlp";

// =============================================================================
// Types
// =============================================================================

export interface ScanFinding {
  type: string;
  severity: "critical" | "high" | "medium" | "low" | "info";
  message: string;
  file?: string;
  line?: number;
}

export interface ScanResult {
  passed: boolean;
  findings: ScanFinding[];
  scannedAt: Date;
  durationMs: number;
}

export interface SkillPackage {
  skillId: string;
  version: string;
  files: SkillFile[];
  manifest?: Record<string, unknown>;
}

export interface SkillFile {
  path: string;
  content: string;
}

// =============================================================================
// Suspicious Patterns
// =============================================================================

const SUSPICIOUS_IMPORTS = [
  "child_process",
  "cluster",
  "dgram",
  "dns",
  "net",
  "tls",
  "worker_threads",
  "vm",
];

const SUSPICIOUS_GLOBALS = [
  "eval(",
  "Function(",
  "require('child_process')",
  "execSync",
  "execFile",
  "spawn(",
  "__proto__",
  "prototype.constructor",
];

const EXFIL_PATTERNS = [
  /fetch\s*\(\s*['"`]https?:\/\/(?!api\.skills-hub)/i,
  /XMLHttpRequest/i,
  /navigator\.sendBeacon/i,
  /WebSocket\s*\(\s*['"`]wss?:\/\//i,
  /\.writeFile\s*\(/i,
  /process\.env\./i,
];

const OBFUSCATION_PATTERNS = [
  /\\x[0-9a-f]{2}/i,
  /\\u[0-9a-f]{4}/i,
  /atob\s*\(/i,
  /btoa\s*\(/i,
  /Buffer\.from\s*\([^)]*,\s*['"]base64['"]\)/i,
  /String\.fromCharCode/i,
];

// =============================================================================
// SkillSecurityScanner
// =============================================================================

export class SkillSecurityScanner {
  private readonly dlpScanner: DLPScanner;

  constructor() {
    this.dlpScanner = new DLPScanner();
  }

  // ---------------------------------------------------------------------------
  // Main scan entry point
  // ---------------------------------------------------------------------------

  async scan(skillPackage: SkillPackage): Promise<ScanResult> {
    const start = Date.now();
    const findings: ScanFinding[] = [];

    const [staticResult, depResult, malwareResult, exfilResult] = await Promise.all([
      this.staticAnalysis(skillPackage),
      this.dependencyScan(skillPackage),
      this.malwareDetection(skillPackage),
      this.dataExfiltrationCheck(skillPackage),
    ]);

    findings.push(...staticResult, ...depResult, ...malwareResult, ...exfilResult);

    return {
      passed: findings.length === 0,
      findings,
      scannedAt: new Date(),
      durationMs: Date.now() - start,
    };
  }

  // ---------------------------------------------------------------------------
  // Static Analysis - syntax patterns, hardcoded secrets
  // ---------------------------------------------------------------------------

  async staticAnalysis(skillPackage: SkillPackage): Promise<ScanFinding[]> {
    const findings: ScanFinding[] = [];

    for (const file of skillPackage.files) {
      // DLP scan each file
      const dlpResult: DLPResult = await this.dlpScanner.scan(file.content);
      for (const dlpFinding of dlpResult.findings) {
        findings.push({
          type: `dlp:${dlpFinding.type}`,
          severity: dlpFinding.severity,
          message: dlpFinding.message,
          file: file.path,
          line: dlpFinding.position?.line,
        });
      }

      // Check for suspicious global usage
      const lines = file.content.split("\n");
      for (let i = 0; i < lines.length; i++) {
        for (const pattern of SUSPICIOUS_GLOBALS) {
          if (lines[i].includes(pattern)) {
            findings.push({
              type: "suspicious_code",
              severity: "high",
              message: `Suspicious code pattern "${pattern.trim()}" found`,
              file: file.path,
              line: i + 1,
            });
          }
        }
      }
    }

    return findings;
  }

  // ---------------------------------------------------------------------------
  // Dependency Scan - check for known-dangerous or unexpected packages
  // ---------------------------------------------------------------------------

  async dependencyScan(skillPackage: SkillPackage): Promise<ScanFinding[]> {
    const findings: ScanFinding[] = [];
    const BLOCKED_PACKAGES = new Set([
      "node-ipc",
      "event-stream",
      "flatmap-stream",
      "ua-parser-js", // compromised versions
      "coa",
      "rc",
    ]);

    for (const file of skillPackage.files) {
      if (!file.path.endsWith("package.json")) continue;

      try {
        const pkg = JSON.parse(file.content);
        const allDeps = {
          ...(pkg.dependencies ?? {}),
          ...(pkg.devDependencies ?? {}),
        };

        for (const depName of Object.keys(allDeps)) {
          if (BLOCKED_PACKAGES.has(depName)) {
            findings.push({
              type: "blocked_dependency",
              severity: "critical",
              message: `Blocked dependency detected: ${depName}`,
              file: file.path,
            });
          }
        }

        // Flag scripts that run arbitrary commands
        if (pkg.scripts) {
          const dangerous = ["preinstall", "postinstall", "install"];
          for (const hook of dangerous) {
            if (pkg.scripts[hook]) {
              findings.push({
                type: "dangerous_script",
                severity: "high",
                message: `Lifecycle script "${hook}" detected — may execute arbitrary code on install`,
                file: file.path,
              });
            }
          }
        }
      } catch {
        // Malformed package.json — skip
      }
    }

    return findings;
  }

  // ---------------------------------------------------------------------------
  // Malware Detection - obfuscation, suspicious imports
  // ---------------------------------------------------------------------------

  async malwareDetection(skillPackage: SkillPackage): Promise<ScanFinding[]> {
    const findings: ScanFinding[] = [];

    for (const file of skillPackage.files) {
      if (!/\.(ts|js|mjs|cjs)$/.test(file.path)) continue;

      const lines = file.content.split("\n");

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Suspicious Node imports
        for (const mod of SUSPICIOUS_IMPORTS) {
          if (line.includes(`require('${mod}')`) || line.includes(`require("${mod}")`) || line.includes(`from "${mod}"`)) {
            findings.push({
              type: "suspicious_import",
              severity: "high",
              message: `Suspicious Node.js module import: ${mod}`,
              file: file.path,
              line: i + 1,
            });
          }
        }

        // Obfuscation indicators
        for (const pattern of OBFUSCATION_PATTERNS) {
          if (pattern.test(line)) {
            findings.push({
              type: "code_obfuscation",
              severity: "medium",
              message: `Possible code obfuscation pattern detected`,
              file: file.path,
              line: i + 1,
            });
          }
        }
      }
    }

    return findings;
  }

  // ---------------------------------------------------------------------------
  // Data Exfiltration Check
  // ---------------------------------------------------------------------------

  async dataExfiltrationCheck(skillPackage: SkillPackage): Promise<ScanFinding[]> {
    const findings: ScanFinding[] = [];

    for (const file of skillPackage.files) {
      if (!/\.(ts|js|mjs|cjs)$/.test(file.path)) continue;

      const lines = file.content.split("\n");

      for (let i = 0; i < lines.length; i++) {
        for (const pattern of EXFIL_PATTERNS) {
          if (pattern.test(lines[i])) {
            findings.push({
              type: "data_exfiltration_risk",
              severity: "high",
              message: `Potential data exfiltration vector detected`,
              file: file.path,
              line: i + 1,
            });
          }
        }
      }
    }

    return findings;
  }
}
