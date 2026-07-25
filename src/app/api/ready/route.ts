import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { redis } from "@/lib/cache/redis";

export const dynamic = "force-dynamic";

type CheckStatus = "healthy" | "unhealthy";

export async function GET() {
  const checks: Record<string, { status: CheckStatus; latencyMs?: number }> = {};

  // Database check
  const dbStart = Date.now();
  try {
    await db.$queryRaw`SELECT 1`;
    checks.database = { status: "healthy", latencyMs: Date.now() - dbStart };
  } catch {
    checks.database = { status: "unhealthy" };
  }

  // Redis check
  const redisStart = Date.now();
  try {
    await redis.ping();
    checks.redis = { status: "healthy", latencyMs: Date.now() - redisStart };
  } catch {
    checks.redis = { status: "unhealthy" };
  }

  const allHealthy = Object.values(checks).every((check) => check.status === "healthy");

  return NextResponse.json(
    {
      status: allHealthy ? "healthy" : "unhealthy",
      timestamp: new Date().toISOString(),
      checks,
    },
    { status: allHealthy ? 200 : 503 }
  );
}
