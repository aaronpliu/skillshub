import { z } from "zod";
import { router, protectedProcedure } from "../trpc";

export const analyticsRouter = router({
  // =========================================================================
  // Dashboard analytics — aggregated real data
  // =========================================================================
  getDashboard: protectedProcedure
    .input(
      z.object({
        period: z.enum(["7d", "30d", "90d", "12m"]).default("12m"),
      }).optional().default({})
    )
    .query(async ({ ctx, input }) => {
      const orgId = ctx.user.orgId;
      const periodMap: Record<string, number> = { "7d": 7, "30d": 30, "90d": 90, "12m": 365 };
      const days = periodMap[input.period] ?? 365;
      const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

      // --- Install Trends: group installs by month ---
      const installs = await ctx.db.skillInstall.findMany({
        where: {
          skill: { orgId },
          installedAt: { gte: since },
        },
        select: { installedAt: true },
        orderBy: { installedAt: "asc" },
      });

      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const trendMap = new Map<string, number>();

      // Initialize last 12 months (or fewer depending on period)
      const now = new Date();
      const monthCount = input.period === "12m" ? 12 : input.period === "90d" ? 3 : input.period === "30d" ? 2 : 1;
      for (let i = monthCount - 1; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        trendMap.set(key, 0);
      }

      for (const inst of installs) {
        const d = inst.installedAt;
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        trendMap.set(key, (trendMap.get(key) ?? 0) + 1);
      }

      const installTrends = Array.from(trendMap.entries()).map(([key, count]) => {
        const [, monthStr] = key.split("-");
        return {
          month: monthNames[parseInt(monthStr, 10) - 1],
          label: key,
          count,
        };
      });

      // --- Usage by Team: skills and installs per team ---
      const skillsWithTeam = await ctx.db.skill.findMany({
        where: { orgId, status: "approved", teamId: { not: null } },
        select: {
          id: true,
          teamId: true,
          team: { select: { id: true, name: true } },
          _count: { select: { installs: true } },
        },
      });

      const teamMap = new Map<string, { team: string; skills: number; installs: number }>();
      for (const s of skillsWithTeam) {
        const tid = s.teamId!;
        const existing = teamMap.get(tid) ?? { team: s.team?.name ?? "Unknown", skills: 0, installs: 0 };
        existing.skills += 1;
        existing.installs += s._count.installs;
        teamMap.set(tid, existing);
      }
      const teamUsage = Array.from(teamMap.values()).sort((a, b) => b.installs - a.installs);

      // Also count skills without a team
      const skillsNoTeam = await ctx.db.skill.count({
        where: { orgId, status: "approved", teamId: null },
      });
      if (skillsNoTeam > 0) {
        teamUsage.push({ team: "Unassigned", skills: skillsNoTeam, installs: 0 });
      }

      // --- Skills by Category ---
      const categoryResult = await ctx.db.skill.groupBy({
        by: ["category"],
        where: { orgId, status: { in: ["approved", "pending_review"] } },
        _count: true,
        orderBy: { _count: { category: "desc" } },
      });

      const categoryColors: Record<string, string> = {
        Analytics: "bg-blue-500",
        Data: "bg-cyan-500",
        Document: "bg-green-500",
        Integration: "bg-purple-500",
        Development: "bg-amber-500",
        Security: "bg-red-500",
      };

      const categories = categoryResult.map((c) => ({
        category: c.category || "Other",
        count: c._count,
        color: categoryColors[c.category || "Other"] ?? "bg-gray-500",
      }));

      // --- Summary stats ---
      const [totalSkills, totalInstallsResult, totalMembers, avgRatingResult] = await Promise.all([
        ctx.db.skill.count({ where: { orgId, status: { in: ["approved", "pending_review"] } } }),
        ctx.db.skillInstall.count({ where: { skill: { orgId } } }),
        ctx.db.member.count({ where: { orgId, active: true } }),
        ctx.db.skill.aggregate({
          where: { orgId, status: "approved", rating: { gt: 0 } },
          _avg: { rating: true },
        }),
      ]);

      return {
        installTrends,
        teamUsage,
        categories,
        summary: {
          totalSkills,
          totalInstalls: totalInstallsResult,
          totalMembers,
          avgRating: avgRatingResult._avg.rating ?? 0,
        },
      };
    }),
});
