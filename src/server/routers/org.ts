import { z } from "zod";
import { router, protectedProcedure, requireRole } from "../trpc";
import { createAuditLog, AUDIT_ACTIONS } from "@/lib/security/audit";

export const orgRouter = router({
  // =========================================================================
  // Get full organization hierarchy
  // =========================================================================
  getHierarchy: protectedProcedure.query(async ({ ctx }) => {
    const org = await ctx.db.organization.findUnique({
      where: { id: ctx.user!.orgId },
      include: {
        businessUnits: {
          where: { parentId: null },
          include: {
            children: { include: { departments: { include: { teams: true } } } },
            departments: { include: { teams: true } },
          },
        },
        departments: {
          where: { buId: { in: (await ctx.db.businessUnit.findMany({ where: { orgId: ctx.user!.orgId } })).map(b => b.id) } },
          include: { teams: true },
        },
        members: {
          include: { user: { select: { id: true, name: true, email: true, avatarUrl: true } } },
        },
      },
    });

    if (!org) throw new Error("Organization not found");
    return org;
  }),

  // =========================================================================
  // List members with pagination
  // =========================================================================
  listMembers: protectedProcedure
    .input(
      z.object({
        teamId: z.string().optional(),
        deptId: z.string().optional(),
        buId: z.string().optional(),
        role: z.string().optional(),
        search: z.string().optional(),
        page: z.number().min(1).default(1),
        pageSize: z.number().min(1).max(100).default(20),
      }).default({})
    )
    .query(async ({ ctx, input }) => {
      const where: Record<string, unknown> = { orgId: ctx.user!.orgId, active: true };

      if (input.search) {
        where.user = {
          OR: [
            { name: { contains: input.search, mode: "insensitive" } },
            { email: { contains: input.search, mode: "insensitive" } },
          ],
        };
      }

      const [members, total] = await Promise.all([
        ctx.db.member.findMany({
          where,
          include: {
            user: { select: { id: true, name: true, email: true, avatarUrl: true } },
          },
          skip: (input.page - 1) * input.pageSize,
          take: input.pageSize,
          orderBy: { createdAt: "desc" },
        }),
        ctx.db.member.count({ where }),
      ]);

      return { members, total, page: input.page, pageSize: input.pageSize };
    }),

  // =========================================================================
  // Invite member
  // =========================================================================
  inviteMember: protectedProcedure
    .use(requireRole("admin"))
    .input(
      z.object({
        email: z.string().email(),
        name: z.string().min(1),
        role: z.enum(["admin", "member", "viewer"]).default("member"),
        buId: z.string().optional(),
        deptId: z.string().optional(),
        teamIds: z.array(z.string()).default([]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Find or create user
      let user = await ctx.db.user.findUnique({ where: { email: input.email } });

      if (!user) {
        user = await ctx.db.user.create({
          data: {
            email: input.email,
            name: input.name,
            passwordHash: await (await import("@/lib/auth/crypto")).hashPassword(
              crypto.randomUUID() // Temporary password, user will set via SSO
            ),
          },
        });
      }

      // Create membership
      const member = await ctx.db.member.create({
        data: {
          orgId: ctx.user!.orgId,
          userId: user.id,
          role: input.role,
          buId: input.buId,
          deptId: input.deptId,
          teamIds: input.teamIds,
        },
      });

      await createAuditLog({
        orgId: ctx.user!.orgId,
        actorId: ctx.user!.sub,
        actorEmail: ctx.user!.email,
        actorIp: ctx.ip,
        action: AUDIT_ACTIONS.USER_INVITE,
        resource: { type: "member", id: member.id, name: input.email },
        details: { role: input.role },
      });

      return member;
    }),

  // =========================================================================
  // Update member role
  // =========================================================================
  updateMemberRole: protectedProcedure
    .use(requireRole("admin"))
    .input(
      z.object({
        memberId: z.string(),
        role: z.enum(["admin", "bu_admin", "dept_admin", "team_admin", "member", "viewer"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const member = await ctx.db.member.update({
        where: { id: input.memberId },
        data: { role: input.role },
      });

      await createAuditLog({
        orgId: ctx.user!.orgId,
        actorId: ctx.user!.sub,
        actorEmail: ctx.user!.email,
        actorIp: ctx.ip,
        action: AUDIT_ACTIONS.USER_ROLE_CHANGE,
        resource: { type: "member", id: member.id },
        details: { newRole: input.role },
      });

      return member;
    }),

  // =========================================================================
  // Create team
  // =========================================================================
  createTeam: protectedProcedure
    .use(requireRole("dept_admin"))
    .input(
      z.object({
        name: z.string().min(1),
        slug: z.string().regex(/^[a-z0-9-]+$/),
        deptId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.team.create({
        data: {
          orgId: ctx.user!.orgId,
          deptId: input.deptId,
          name: input.name,
          slug: input.slug,
        },
      });
    }),

  // =========================================================================
  // Create department
  // =========================================================================
  createDepartment: protectedProcedure
    .use(requireRole("bu_admin"))
    .input(
      z.object({
        name: z.string().min(1),
        slug: z.string().regex(/^[a-z0-9-]+$/),
        buId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.department.create({
        data: {
          orgId: ctx.user!.orgId,
          buId: input.buId,
          name: input.name,
          slug: input.slug,
        },
      });
    }),

  // =========================================================================
  // Create business unit
  // =========================================================================
  createBusinessUnit: protectedProcedure
    .use(requireRole("admin"))
    .input(
      z.object({
        name: z.string().min(1),
        slug: z.string().regex(/^[a-z0-9-]+$/),
        parentId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.businessUnit.create({
        data: {
          orgId: ctx.user!.orgId,
          name: input.name,
          slug: input.slug,
          parentId: input.parentId,
        },
      });
    }),

  // =========================================================================
  // Get organization settings
  // =========================================================================
  getSettings: protectedProcedure
    .use(requireRole("admin"))
    .query(async ({ ctx }) => {
      const org = await ctx.db.organization.findUnique({
        where: { id: ctx.user!.orgId },
      });
      return org?.settings || {};
    }),

  // =========================================================================
  // Update organization settings
  // =========================================================================
  updateSettings: protectedProcedure
    .use(requireRole("admin"))
    .input(z.record(z.unknown()))
    .mutation(async ({ ctx, input }) => {
      const org = await ctx.db.organization.update({
        where: { id: ctx.user!.orgId },
        data: { settings: input as any },
      });

      await createAuditLog({
        orgId: ctx.user!.orgId,
        actorId: ctx.user!.sub,
        actorEmail: ctx.user!.email,
        actorIp: ctx.ip,
        action: AUDIT_ACTIONS.ORG_SETTINGS_UPDATE,
        resource: { type: "org", id: org.id },
        details: { changedFields: Object.keys(input) },
      });

      return org.settings;
    }),
});
