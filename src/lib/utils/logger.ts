// =============================================================================
// Structured JSON Logger
// =============================================================================

export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
}

// =============================================================================
// Sensitive Field Redaction
// =============================================================================

const SENSITIVE_KEYS = new Set([
  "password",
  "token",
  "secret",
  "apiKey",
  "api_key",
  "access_token",
  "refresh_token",
  "authorization",
  "cookie",
  "session",
  "credit_card",
  "ssn",
  "enckey",
  "enc_key",
  "private_key",
]);

const REDACTED = "[REDACTED]";

function redactFields(obj: Record<string, unknown>, depth = 0): Record<string, unknown> {
  if (depth > 5) return obj; // prevent stack overflow on circular-ish objects

  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (SENSITIVE_KEYS.has(key.toLowerCase())) {
      result[key] = REDACTED;
    } else if (value !== null && typeof value === "object" && !Array.isArray(value)) {
      result[key] = redactFields(value as Record<string, unknown>, depth + 1);
    } else {
      result[key] = value;
    }
  }

  return result;
}

// =============================================================================
// Log Level Priority
// =============================================================================

const LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

function getMinLevel(): LogLevel {
  const envLevel = (process.env.LOG_LEVEL ?? "info").toLowerCase() as LogLevel;
  return LEVEL_PRIORITY[envLevel] !== undefined ? envLevel : "info";
}

function shouldLog(level: LogLevel): boolean {
  return LEVEL_PRIORITY[level] >= LEVEL_PRIORITY[getMinLevel()];
}

// =============================================================================
// Logger
// =============================================================================

export class Logger {
  private readonly defaultContext: Record<string, unknown>;

  constructor(defaultContext: Record<string, unknown> = {}) {
    this.defaultContext = defaultContext;
  }

  // ---------------------------------------------------------------------------
  // Public methods
  // ---------------------------------------------------------------------------

  debug(message: string, context?: Record<string, unknown>): void {
    this.log("debug", message, context);
  }

  info(message: string, context?: Record<string, unknown>): void {
    this.log("info", message, context);
  }

  warn(message: string, context?: Record<string, unknown>): void {
    this.log("warn", message, context);
  }

  error(message: string, context?: Record<string, unknown>): void {
    this.log("error", message, context);
  }

  // ---------------------------------------------------------------------------
  // Child logger with merged context
  // ---------------------------------------------------------------------------

  child(context: Record<string, unknown>): Logger {
    return new Logger({ ...this.defaultContext, ...context });
  }

  // ---------------------------------------------------------------------------
  // Core log method
  // ---------------------------------------------------------------------------

  private log(level: LogLevel, message: string, context?: Record<string, unknown>): void {
    if (!shouldLog(level)) return;

    const mergedContext = { ...this.defaultContext, ...context };
    const redactedContext = Object.keys(mergedContext).length > 0
      ? redactFields(mergedContext)
      : undefined;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...(redactedContext && { context: redactedContext }),
    };

    const line = JSON.stringify(entry);

    switch (level) {
      case "error":
        console.error(line);
        break;
      case "warn":
        console.warn(line);
        break;
      case "debug":
        console.debug(line);
        break;
      default:
        console.log(line);
        break;
    }
  }
}

// =============================================================================
// Default singleton
// =============================================================================

export const logger = new Logger({
  service: "enterprise-skills-hub",
  env: process.env.NODE_ENV ?? "unknown",
});
