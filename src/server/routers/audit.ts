import { z } from "zod";
import { router, protectedProcedure, requireRole } from "../trpc";

export const auditRouter = router({
  // =========================================================================
  // Query audit logs
  // =========================================================================
  list: protectedProcedure
    .use(requireRole("admin"))
    .input(
      z.object({
        action: z.string().optional(),
        actorId: z.string().optional(),
        resourceType: z.string().optional(),
        result: z.enum(["success", "failure"]).optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        page: z.number().min(1).default(1),
        pageSize: z.number().min(1).max(100).default(50),
      }).optional().default({})
    )
    .query(async ({ ctx, input }) => {
      const where: Record<string, unknown> = { orgId: ctx.user!.orgId };

      if (input.action) where.action = input.action;
      if (input.actorId) where.actorId = input.actorId;
      if (input.result) where.result = input.result;
      if (input.startDate || input.endDate) {
        const timestampFilter: Record<string, Date> = {};
        if (input.startDate) timestampFilter.gte = input.startDate;
        if (input.endDate) timestampFilter.lte = input.endDate;
        where.timestamp = timestampFilter;
      }

      const [logs, total] = await Promise.all([
        ctx.db.auditLog.findMany({
          where,
          orderBy: { timestamp: "desc" },
          skip: (input.page - 1) * input.pageSize,
          take: input.pageSize,
        }),
        ctx.db.auditLog.count({ where }),
      ]);

      return {
        logs: logs.map((log) => ({
          ...log,
          resource: log.resource as Record<string, unknown>,
          details: log.details as Record<string, unknown> | null,
        })),
        total,
        page: input.page,
        pageSize: input.pageSize,
      };
    }),

  // =========================================================================
  // Get audit log by ID
  // =========================================================================
  getById: protectedProcedure
    .use(requireRole("admin"))
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const log = await ctx.db.auditLog.findUnique({
        where: { id: input.id },
      });
      if (!log) throw new Error("Audit log not found");
      if (log.orgId !== ctx.user!.orgId) throw new Error("Access denied");

      return {
        ...log,
        resource: log.resource as Record<string, unknown>,
        details: log.details as Record<string, unknown> | null,
      };
    }),

  // =========================================================================
  // Get audit statistics
  // =========================================================================
  getStats: protectedProcedure
    .use(requireRole("admin"))
    .input(
      z.object({
        period: z.enum(["7d", "30d", "90d"]).default("30d"),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const period = input?.period || "30d";
      const days = parseInt(period.replace("d", ""));
      const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

      const [totalLogs, failedLogins, skillActions, topActors] = await Promise.all([
        ctx.db.auditLog.count({
          where: { orgId: ctx.user!.orgId, timestamp: { gte: since } },
        }),
        ctx.db.auditLog.count({
          where: { orgId: ctx.user!.orgId, action: "auth.failed", timestamp: { gte: since } },
        }),
        ctx.db.auditLog.groupBy({
          by: ["action"],
          where: {
            orgId: ctx.user!.orgId,
            action: { startsWith: "skill." },
            timestamp: { gte: since },
          },
          _count: true,
        }),
        ctx.db.auditLog.groupBy({
          by: ["actorEmail"],
          where: { orgId: ctx.user!.orgId, timestamp: { gte: since } },
          _count: true,
          orderBy: { _count: { actorEmail: "desc" } },
          take: 10,
        }),
      ]);

      return {
        totalLogs,
        failedLogins,
        skillActions,
        topActors,
        period,
      };
    }),

  // =========================================================================
  // Export audit logs (CSV)
  // =========================================================================
  export: protectedProcedure
    .use(requireRole("admin"))
    .input(
      z.object({
        startDate: z.date(),
        endDate: z.date(),
        format: z.enum(["csv", "json"]).default("csv"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const logs = await ctx.db.auditLog.findMany({
        where: {
          orgId: ctx.user!.orgId,
          timestamp: { gte: input.startDate, lte: input.endDate },
        },
        orderBy: { timestamp: "desc" },
      });

      if (input.format === "json") {
        return {
          format: "json",
          data: logs,
          count: logs.length,
        };
      }

      // CSV format
      const headers = ["timestamp", "actor", "action", "resource_type", "resource_id", "result", "ip"];
      const rows = logs.map((log) => {
        const resource = log.resource as Record<string, unknown>;
        return [
          log.timestamp.toISOString(),
          log.actorEmail,
          log.action,
          resource.type || "",
          resource.id || "",
          log.result,
          log.actorIp,
        ].join(",");
      });

      const csv = [headers.join(","), ...rows].join("\n");

      return {
        format: "csv",
        data: csv,
        count: logs.length,
      };
    }),
});
