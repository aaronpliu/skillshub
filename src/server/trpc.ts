import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { db } from "@/lib/db";
import { verifyToken, type TokenPayload } from "@/lib/auth/crypto";

// =============================================================================
// tRPC Context
// =============================================================================

export async function createContext(opts: { req: Request; res?: any }) {
  const req = opts.req;
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");

  let user: TokenPayload | null = null;

  if (token) {
    user = await verifyToken<TokenPayload>(token);
  }

  // Resolve member info if authenticated
  let member = null;
  if (user) {
    member = await db.member.findUnique({
      where: { orgId_userId: { orgId: user.orgId, userId: user.sub } },
      include: { user: true },
    });
  }

  return {
    user,
    member,
    db,
    ip: req.headers.get("x-forwarded-for") || "unknown",
    req,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;

// =============================================================================
// tRPC Initialization
// =============================================================================

const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape }) {
    return shape;
  },
});

export const router = t.router;
export const publicProcedure = t.procedure;
export const middleware = t.middleware;

// =============================================================================
// Auth Middleware
// =============================================================================

const isAuthenticated = middleware(async ({ ctx, next }) => {
  if (!ctx.user || !ctx.member) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Not authenticated" });
  }

  if (!ctx.member.active) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Account deactivated" });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user!,
      member: ctx.member!,
    },
  });
});

export const protectedProcedure = t.procedure.use(isAuthenticated);

// =============================================================================
// Role-Based Middleware
// =============================================================================

const ROLE_HIERARCHY: Record<string, number> = {
  owner: 100,
  admin: 90,
  bu_admin: 70,
  dept_admin: 50,
  team_admin: 30,
  member: 10,
  viewer: 1,
};

function hasMinRole(userRole: string, requiredRole: string): boolean {
  return (ROLE_HIERARCHY[userRole] ?? 0) >= (ROLE_HIERARCHY[requiredRole] ?? 0);
}

export function requireRole(minRole: string) {
  return middleware(async ({ ctx, next }) => {
    if (!ctx.user || !ctx.member) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }

    if (!hasMinRole(ctx.member.role, minRole)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: `Requires role: ${minRole} or higher`,
      });
    }

    return next({ ctx });
  });
}

// =============================================================================
// Permission Check Helper
// =============================================================================

export async function checkPermission(
  orgId: string,
  userId: string,
  action: string,
  resourceId?: string
): Promise<boolean> {
  // Get member
  const member = await db.member.findUnique({
    where: { orgId_userId: { orgId, userId } },
  });

  if (!member || !member.active) return false;

  // Owner/admin have all permissions
  if (["owner", "admin"].includes(member.role)) return true;

  // Check ABAC policies
  const policies = await db.accessPolicy.findMany({
    where: { orgId, active: true },
    orderBy: { priority: "desc" },
  });

  let allowed = false;

  for (const policy of policies) {
    const conditions = policy.conditions as Record<string, unknown>[];
    const conditionsMet = evaluateConditions(conditions, {
      user: { role: member.role, id: userId, teamIds: member.teamIds, deptId: member.deptId, buId: member.buId },
      resource: resourceId ? { id: resourceId } : undefined,
    });

    if (conditionsMet) {
      if (policy.effect === "deny") return false; // Deny always wins
      if (policy.actions.includes(action) || policy.actions.includes("*")) {
        allowed = true;
      }
    }
  }

  return allowed;
}

function evaluateConditions(
  conditions: Record<string, unknown>[],
  context: { user: Record<string, unknown>; resource?: Record<string, unknown> }
): boolean {
  if (!conditions || conditions.length === 0) return true;

  return conditions.every((condition) => {
    const { attribute, operator, value } = condition as {
      attribute: string;
      operator: string;
      value: unknown;
    };

    // Resolve attribute path (e.g., "user.role")
    const parts = attribute.split(".");
    let resolved: unknown = context;
    for (const part of parts) {
      resolved = (resolved as Record<string, unknown>)?.[part];
    }

    switch (operator) {
      case "eq":
        return resolved === value;
      case "ne":
        return resolved !== value;
      case "in":
        return Array.isArray(value) && value.includes(resolved);
      case "contains":
        return Array.isArray(resolved) && resolved.includes(value);
      default:
        return false;
    }
  });
}
