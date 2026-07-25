import { db } from "@/lib/db";
import { env } from "@/lib/env";

// =============================================================================
// Audit Logger (L4 Security - Tamper-evident)
// =============================================================================

export interface AuditLogInput {
  orgId: string;
  actorId: string;
  actorEmail: string;
  actorIp: string;
  action: string;
  resource: { type: string; id: string; name?: string; version?: string };
  details?: Record<string, unknown>;
  result?: "success" | "failure";
}

export async function createAuditLog(input: AuditLogInput): Promise<void> {
  const entry = {
    orgId: input.orgId,
    timestamp: new Date(),
    actorId: input.actorId,
    actorEmail: input.actorEmail,
    actorIp: input.actorIp,
    action: input.action,
    resource: input.resource,
    details: input.details ?? null,
    result: input.result ?? "success",
  };

  // Generate HMAC signature for tamper detection
  const signature = await signAuditEntry(entry);

  await db.auditLog.create({
    data: {
      orgId: input.orgId,
      timestamp: entry.timestamp,
      actorId: input.actorId,
      actorEmail: input.actorEmail,
      actorIp: input.actorIp,
      action: input.action,
      resource: input.resource as any,
      details: (input.details ?? undefined) as any,
      result: input.result ?? "success",
      signature,
    },
  });
}

async function signAuditEntry(entry: { orgId: string; timestamp: Date; actorId: string; action: string; resource: unknown }): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(env.AUDIT_HMAC_KEY),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const data = JSON.stringify({
    orgId: entry.orgId,
    timestamp: entry.timestamp.toISOString(),
    actorId: entry.actorId,
    action: entry.action,
    resource: entry.resource,
  });

  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// Audit action constants
export const AUDIT_ACTIONS = {
  // Auth
  AUTH_LOGIN: "auth.login",
  AUTH_LOGOUT: "auth.logout",
  AUTH_FAILED: "auth.failed",

  // User management
  USER_INVITE: "user.invite",
  USER_REMOVE: "user.remove",
  USER_ROLE_CHANGE: "user.role.change",

  // Skill lifecycle
  SKILL_CREATE: "skill.create",
  SKILL_UPDATE: "skill.update",
  SKILL_DELETE: "skill.delete",
  SKILL_PUBLISH: "skill.publish",
  SKILL_DOWNLOAD: "skill.download",
  SKILL_INSTALL: "skill.install",

  // Review
  REVIEW_SUBMIT: "review.submit",
  REVIEW_APPROVE: "review.approve",
  REVIEW_REJECT: "review.reject",
  REVIEW_REQUEST_CHANGES: "review.request_changes",

  // Admin
  ORG_SETTINGS_UPDATE: "org.settings.update",
  POLICY_CREATE: "policy.create",
  POLICY_UPDATE: "policy.update",
} as const;
