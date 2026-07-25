import { TRPCError } from "@trpc/server";
import { middleware } from "@/server/trpc";
import { checkRateLimit } from "@/lib/cache/redis";

// =============================================================================
// Types
// =============================================================================

export interface RateLimitConfig {
  /** Maximum number of requests allowed in the window */
  limit: number;
  /** Window duration in milliseconds */
  windowMs: number;
  /** Custom key resolver — defaults to IP + procedure path */
  getKey?: (ctx: { userId?: string; ip: string; path: string }) => string;
}

// =============================================================================
// Default configs per endpoint category
// =============================================================================

export const RATE_LIMITS = {
  auth: { limit: 10, windowMs: 60_000 } satisfies RateLimitConfig,         // 10/min
  mutation: { limit: 30, windowMs: 60_000 } satisfies RateLimitConfig,     // 30/min
  query: { limit: 120, windowMs: 60_000 } satisfies RateLimitConfig,       // 120/min
  upload: { limit: 5, windowMs: 60_000 } satisfies RateLimitConfig,        // 5/min
  default: { limit: 60, windowMs: 60_000 } satisfies RateLimitConfig,      // 60/min
} as const;

// =============================================================================
// Rate Limit Middleware Factory
// =============================================================================

/**
 * Creates a tRPC rate-limiting middleware using a Redis sliding window.
 *
 * Usage:
 * ```ts
 * export const myProcedure = router({
 *   myEndpoint: protectedProcedure
 *     .use(rateLimit({ limit: 20, windowMs: 60_000 }))
 *     .mutation(...)
 * });
 * ```
 */
export function rateLimit(config: RateLimitConfig) {
  return middleware(async ({ ctx, path, next }) => {
    const userId = ctx.user?.sub;
    const ip = ctx.ip;

    // Build the rate-limit key
    const key = config.getKey
      ? config.getKey({ userId, ip, path })
      : userId
        ? `user:${userId}:${path}`
        : `ip:${ip}:${path}`;

    const { allowed, remaining, resetAt } = await checkRateLimit(
      key,
      config.limit,
      config.windowMs
    );

    if (!allowed) {
      throw new TRPCError({
        code: "TOO_MANY_REQUESTS",
        message: "Rate limit exceeded. Please try again later.",
        cause: {
          limit: config.limit,
          windowMs: config.windowMs,
          resetAt,
        },
      });
    }

    // Attach rate-limit headers to the response context
    // (Next.js handler can read these from the context)
    return next({
      ctx: {
        ...ctx,
        rateLimit: {
          limit: config.limit,
          remaining,
          resetAt,
          windowMs: config.windowMs,
        },
      },
    });
  });
}

// =============================================================================
// Rate Limit Headers Helper
// =============================================================================

/**
 * Build standard rate-limit response headers from the rate limit context.
 * Attach these in your Next.js response handler.
 */
export function buildRateLimitHeaders(rl: {
  limit: number;
  remaining: number;
  resetAt: number;
  windowMs: number;
}): Record<string, string> {
  return {
    "X-RateLimit-Limit": String(rl.limit),
    "X-RateLimit-Remaining": String(rl.remaining),
    "X-RateLimit-Reset": String(rl.resetAt),
    "X-RateLimit-Window": `${rl.windowMs}ms`,
  };
}
