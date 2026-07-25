// =============================================================================
// DLP Scanner - Data Loss Prevention
// =============================================================================

export interface DLPFinding {
  type: string;
  severity: "critical" | "high" | "medium" | "low" | "info";
  message: string;
  match?: string;
  position?: { line: number; column: number };
}

export interface DLPResult {
  passed: boolean;
  findings: DLPFinding[];
  scannedAt: Date;
}

// =============================================================================
// Detection Patterns
// =============================================================================

interface PatternRule {
  type: string;
  severity: DLPFinding["severity"];
  regex: RegExp;
  message: string;
}

const PATTERNS: PatternRule[] = [
  {
    type: "SSN",
    severity: "critical",
    regex: /\b\d{3}-\d{2}-\d{4}\b/,
    message: "Potential Social Security Number detected",
  },
  {
    type: "CREDIT_CARD",
    severity: "critical",
    regex: /\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|6(?:011|5[0-9]{2})[0-9]{12})\b/,
    message: "Potential credit card number detected",
  },
  {
    type: "AWS_ACCESS_KEY",
    severity: "critical",
    regex: /(?:^|[^A-Za-z0-9/+=])((?:AKIA|ABIA|ACCA|ASIA)[A-Z0-9]{16})(?:[^A-Za-z0-9/+=]|$)/,
    message: "AWS Access Key ID detected",
  },
  {
    type: "AWS_SECRET_KEY",
    severity: "critical",
    regex: /(?:aws_secret_access_key|secret_access_key)\s*[=:]\s*['"]?([A-Za-z0-9/+=]{40})['"]?/,
    message: "AWS Secret Access Key detected",
  },
  {
    type: "GITHUB_TOKEN",
    severity: "critical",
    regex: /(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{36,255}/,
    message: "GitHub token detected",
  },
  {
    type: "OPENAI_API_KEY",
    severity: "high",
    regex: /sk-[A-Za-z0-9]{20,}(?:[A-Za-z0-9-]{20,})?/,
    message: "OpenAI API key detected",
  },
  {
    type: "PRIVATE_KEY",
    severity: "critical",
    regex: /-----BEGIN\s+(?:RSA|DSA|EC|OPENSSH|PGP)?\s*PRIVATE KEY-----/,
    message: "Private key block detected",
  },
  {
    type: "EMAIL",
    severity: "low",
    regex: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/,
    message: "Email address detected",
  },
  {
    type: "GENERIC_SECRET",
    severity: "medium",
    regex: /(?:password|passwd|secret|api_key|apikey|access_token)\s*[=:]\s*['"][^\s'"]{8,}['"]/i,
    message: "Potential hardcoded secret or credential detected",
  },
];

// =============================================================================
// DLPScanner
// =============================================================================

export class DLPScanner {
  private readonly patterns: PatternRule[];

  constructor(customPatterns?: PatternRule[]) {
    this.patterns = customPatterns ?? PATTERNS;
  }

  async scan(content: string): Promise<DLPResult> {
    const findings: DLPFinding[] = [];
    const lines = content.split("\n");

    for (const rule of this.patterns) {
      for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
        const line = lines[lineIdx];
        const match = rule.regex.exec(line);

        if (match) {
          findings.push({
            type: rule.type,
            severity: rule.severity,
            message: rule.message,
            match: this.redactMatch(match[0], rule.type),
            position: {
              line: lineIdx + 1,
              column: match.index + 1,
            },
          });
        }
      }
    }

    return {
      passed: findings.length === 0,
      findings,
      scannedAt: new Date(),
    };
  }

  // Redact sensitive match values for safe logging
  private redactMatch(match: string, type: string): string {
    if (type === "EMAIL") {
      const [local, domain] = match.split("@");
      return `${local[0]}***@${domain}`;
    }

    if (match.length <= 8) return "****";
    return `${match.slice(0, 4)}${"*".repeat(Math.min(match.length - 8, 20))}${match.slice(-4)}`;
  }
}
