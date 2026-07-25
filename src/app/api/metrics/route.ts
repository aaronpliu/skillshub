import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const [skillsCount, usersCount, installsCount, reviewsPendingCount] = await Promise.all([
    db.skill.count(),
    db.user.count(),
    db.skillInstall.count(),
    db.skillReview.count({ where: { status: "pending" } }),
  ]);

  const metrics = [
    "# HELP skills_hub_skills_total Total number of skills in the hub",
    "# TYPE skills_hub_skills_total gauge",
    `skills_hub_skills_total ${skillsCount}`,
    "",
    "# HELP skills_hub_users_total Total number of registered users",
    "# TYPE skills_hub_users_total gauge",
    `skills_hub_users_total ${usersCount}`,
    "",
    "# HELP skills_hub_installs_total Total number of skill installs",
    "# TYPE skills_hub_installs_total counter",
    `skills_hub_installs_total ${installsCount}`,
    "",
    "# HELP skills_hub_reviews_pending Number of pending skill reviews",
    "# TYPE skills_hub_reviews_pending gauge",
    `skills_hub_reviews_pending ${reviewsPendingCount}`,
    "",
    "# HELP skills_hub_http_requests_total Total number of HTTP requests",
    "# TYPE skills_hub_http_requests_total counter",
    "skills_hub_http_requests_total 0",
    "",
    "# HELP skills_hub_http_request_duration_seconds HTTP request duration in seconds",
    "# TYPE skills_hub_http_request_duration_seconds histogram",
    'skills_hub_http_request_duration_seconds_bucket{le="0.005"} 0',
    'skills_hub_http_request_duration_seconds_bucket{le="0.01"} 0',
    'skills_hub_http_request_duration_seconds_bucket{le="0.025"} 0',
    'skills_hub_http_request_duration_seconds_bucket{le="0.05"} 0',
    'skills_hub_http_request_duration_seconds_bucket{le="0.1"} 0',
    'skills_hub_http_request_duration_seconds_bucket{le="0.25"} 0',
    'skills_hub_http_request_duration_seconds_bucket{le="0.5"} 0',
    'skills_hub_http_request_duration_seconds_bucket{le="1"} 0',
    'skills_hub_http_request_duration_seconds_bucket{le="2.5"} 0',
    'skills_hub_http_request_duration_seconds_bucket{le="5"} 0',
    'skills_hub_http_request_duration_seconds_bucket{le="10"} 0',
    'skills_hub_http_request_duration_seconds_bucket{le="+Inf"} 0',
    "skills_hub_http_request_duration_seconds_sum 0",
    "skills_hub_http_request_duration_seconds_count 0",
    "",
  ].join("\n");

  return new NextResponse(metrics, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; version=0.0.4; charset=utf-8",
    },
  });
}
