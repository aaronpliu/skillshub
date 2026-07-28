import { z } from "zod";
import { router, protectedProcedure, publicProcedure, requireRole } from "../trpc";
import { createAuditLog, AUDIT_ACTIONS } from "@/lib/security/audit";

export const skillRouter = router({
  // =========================================================================
  // Public search — no auth required, only shows approved org-visible skills
  // =========================================================================
  publicSearch: publicProcedure
    .input(
      z.object({
        q: z.string().optional(),
        category: z.string().optional(),
        page: z.number().min(1).default(1),
        pageSize: z.number().min(1).max(100).default(20),
        sortBy: z.enum(["updatedAt", "installCount", "rating", "name"]).default("updatedAt"),
        sortOrder: z.enum(["asc", "desc"]).default("desc"),
      }).optional().default({})
    )
    .query(async ({ ctx, input }) => {
      // For public access, only show published skills with organization visibility.
      // Include "approved" for backward compat with existing seed data.
      const where: Record<string, unknown> = {
        status: { in: ["published", "approved"] },
        visibility: "organization",
      };

      if (input.q) {
        where.AND = [
          {
            OR: [
              { name: { contains: input.q, mode: "insensitive" } },
              { description: { contains: input.q, mode: "insensitive" } },
            ],
          },
        ];
      }

      if (input.category) where.category = input.category;

      const [skills, total] = await Promise.all([
        ctx.db.skill.findMany({
          where,
          include: {
            author: { select: { id: true, name: true, email: true, avatarUrl: true } },
            team: { select: { id: true, name: true } },
            org: { select: { id: true, name: true, slug: true } },
            _count: { select: { versions: true, installs: true, reviews: true } },
          },
          orderBy: { [input.sortBy]: input.sortOrder },
          skip: (input.page - 1) * input.pageSize,
          take: input.pageSize,
        }),
        ctx.db.skill.count({ where }),
      ]);

      return {
        skills: skills.map((s) => ({
          ...s,
          versionCount: s._count.versions,
          installCount: s._count.installs,
          reviewCount: s._count.reviews,
        })),
        total,
        page: input.page,
        pageSize: input.pageSize,
      };
    }),

  // =========================================================================
  // Public get by ID — no auth required
  // =========================================================================
  publicGetById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const skill = await ctx.db.skill.findUnique({
        where: { id: input.id },
        include: {
          author: { select: { id: true, name: true, email: true, avatarUrl: true } },
          team: { select: { id: true, name: true } },
          dept: { select: { id: true, name: true } },
          bu: { select: { id: true, name: true } },
          org: { select: { id: true, name: true, slug: true } },
          versions: {
            orderBy: { publishedAt: "desc" },
            take: 20,
            include: {
              publisher: { select: { id: true, name: true, email: true } },
            },
          },
          reviews: {
            orderBy: { createdAt: "desc" },
            take: 10,
            include: {
              reviewer: { select: { id: true, name: true, email: true } },
            },
          },
          _count: { select: { installs: true, versions: true } },
        },
      });

      if (!skill) throw new Error("Skill not found");
      if (!["published", "approved"].includes(skill.status)) throw new Error("Skill not available");

      return skill;
    }),

  // =========================================================================
  // Search / list skills (authenticated, with visibility scoping)
  // =========================================================================
  search: protectedProcedure
    .input(
      z.object({
        q: z.string().optional(),
        category: z.string().optional(),
        tags: z.array(z.string()).optional(),
        status: z.string().optional(),
        visibility: z.string().optional(),
        teamId: z.string().optional(),
        authorId: z.string().optional(),
        page: z.number().min(1).default(1),
        pageSize: z.number().min(1).max(100).default(20),
        sortBy: z.enum(["updatedAt", "installCount", "rating", "name"]).default("updatedAt"),
        sortOrder: z.enum(["asc", "desc"]).default("desc"),
      }).optional().default({})
    )
    .query(async ({ ctx, input }) => {
      const orgId = ctx.user.orgId;

      // Build where clause with visibility scoping
      const where: Record<string, unknown> = { orgId };

      // Status filter — include all active statuses by default
      if (input.status) {
        where.status = input.status;
      } else {
        where.status = { in: ["draft", "pending_review", "published", "approved"] };
      }

      // Visibility scoping: user can see skills they have access to
      const visibilityConditions: Record<string, unknown>[] = [
        { visibility: "organization" },
        { visibility: "business_unit", buId: ctx.member.buId },
        { visibility: "department", deptId: ctx.member.deptId },
        { visibility: "team", teamId: { in: ctx.member.teamIds } },
        { authorId: ctx.user.sub },
      ];

      // Text search — combined with visibility via AND
      const searchConditions: Record<string, unknown>[] = [];
      if (input.q) {
        searchConditions.push({
          OR: [
            { name: { contains: input.q, mode: "insensitive" } },
            { description: { contains: input.q, mode: "insensitive" } },
          ],
        });
      }

      // Combine visibility + text search with AND
      const andConditions: Record<string, unknown>[] = [
        { OR: visibilityConditions },
        ...searchConditions,
      ];
      where.AND = andConditions;

      if (input.category) where.category = input.category;
      if (input.tags?.length) where.tags = { hasSome: input.tags };
      if (input.teamId) where.teamId = input.teamId;
      if (input.authorId) where.authorId = input.authorId;

      const [skills, total] = await Promise.all([
        ctx.db.skill.findMany({
          where,
          include: {
            author: { select: { id: true, name: true, email: true, avatarUrl: true } },
            team: { select: { id: true, name: true } },
            _count: { select: { versions: true, installs: true, reviews: true } },
          },
          orderBy: { [input.sortBy]: input.sortOrder },
          skip: (input.page - 1) * input.pageSize,
          take: input.pageSize,
        }),
        ctx.db.skill.count({ where }),
      ]);

      return {
        skills: skills.map((s) => ({
          ...s,
          versionCount: s._count.versions,
          installCount: s._count.installs,
          reviewCount: s._count.reviews,
        })),
        total,
        page: input.page,
        pageSize: input.pageSize,
      };
    }),

  // =========================================================================
  // Get skill by ID
  // =========================================================================
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const skill = await ctx.db.skill.findUnique({
        where: { id: input.id },
        include: {
          author: { select: { id: true, name: true, email: true, avatarUrl: true } },
          team: { select: { id: true, name: true } },
          dept: { select: { id: true, name: true } },
          bu: { select: { id: true, name: true } },
          versions: {
            orderBy: { publishedAt: "desc" },
            take: 20,
            include: {
              publisher: { select: { id: true, name: true, email: true } },
            },
          },
          acl: true,
          reviews: {
            orderBy: { createdAt: "desc" },
            take: 10,
            include: {
              reviewer: { select: { id: true, name: true, email: true } },
            },
          },
          _count: { select: { installs: true, versions: true } },
        },
      });

      if (!skill) throw new Error("Skill not found");

      // Check visibility
      const hasAccess = checkSkillAccess(skill, ctx.user.sub, ctx.member);
      if (!hasAccess) throw new Error("Access denied");

      return skill;
    }),

  // =========================================================================
  // Create / publish skill
  // =========================================================================
  publish: protectedProcedure
    .input(
      z.object({
        name: z.string()
          .min(1)
          .max(64)
          .regex(/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/, "Must be lowercase alphanumeric with hyphens"),
        description: z.string().min(1).max(1024),
        descriptionZh: z.string().max(1024).optional(),
        content: z.string().min(1), // SKILL.md content
        version: z.string().regex(/^\d+\.\d+\.\d+$/).default("1.0.0"),
        changelog: z.string().optional(),
        visibility: z.enum(["private", "team", "department", "business_unit", "organization", "custom"]).default("team"),
        classification: z.enum(["public", "internal", "confidential", "restricted"]).default("internal"),
        tags: z.array(z.string()).default([]),
        category: z.string().optional(),
        teamId: z.string().optional(),
        iconUrl: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Validate SKILL.md frontmatter
      const validation = validateSkillContent(input.name, input.content);
      if (!validation.valid) {
        throw new Error(`Invalid skill: ${validation.errors.join(", ")}`);
      }

      // Security scan (basic)
      const scanResult = runBasicSecurityScan(input.content);

      // Create skill
      const skill = await ctx.db.skill.create({
        data: {
          orgId: ctx.user.orgId,
          name: input.name,
          description: input.description,
          descriptionZh: input.descriptionZh,
          authorId: ctx.user.sub,
          teamId: input.teamId,
          deptId: ctx.member.deptId,
          buId: ctx.member.buId,
          visibility: input.visibility,
          classification: input.classification,
          tags: input.tags,
          category: input.category,
          iconUrl: input.iconUrl,
          status: input.visibility === "private" ? "published" : "draft",
          versions: {
            create: {
              version: input.version,
              changelog: input.changelog,
              content: input.content,
              packageUrl: "", // Will be set after S3 upload
              packageHash: crypto.randomUUID(), // Placeholder
              packageSize: Buffer.byteLength(input.content),
              manifest: {
                name: input.name,
                version: input.version,
                files: [{ path: "SKILL.md", size: Buffer.byteLength(input.content) }],
              },
              scanResults: scanResult as any,
              publishedBy: ctx.user.sub,
              reviewStatus: input.visibility === "private" ? "approved" : "pending",
            },
          },
        },
        include: {
          versions: { take: 1 },
          author: { select: { id: true, name: true, email: true } },
        },
      });

      // Create ACL if custom visibility
      if (input.visibility === "custom") {
        await ctx.db.skillACL.create({
          data: {
            skillId: skill.id,
            visibility: "custom",
          },
        });
      }

      await createAuditLog({
        orgId: ctx.user.orgId,
        actorId: ctx.user.sub,
        actorEmail: ctx.user.email,
        actorIp: ctx.ip,
        action: AUDIT_ACTIONS.SKILL_CREATE,
        resource: { type: "skill", id: skill.id, name: skill.name },
        details: { visibility: input.visibility, classification: input.classification },
      });

      return skill;
    }),

  // =========================================================================
  // Submit skill for review (draft → pending_review)
  // =========================================================================
  submitForReview: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const skill = await ctx.db.skill.findUnique({
        where: { id: input.id },
        include: { versions: { orderBy: { publishedAt: "desc" }, take: 1 } },
      });
      if (!skill) throw new Error("Skill not found");
      if (skill.authorId !== ctx.user.sub) {
        throw new Error("Not authorized");
      }
      if (skill.status !== "draft" && skill.status !== "rejected") {
        throw new Error(`Cannot submit for review: skill status is "${skill.status}"`);
      }

      const latestVersion = skill.versions[0];
      if (!latestVersion) {
        throw new Error("Skill has no versions. Please add content before submitting for review.");
      }

      // Use transaction to ensure all updates are atomic
      await ctx.db.$transaction(async (tx) => {
        // 1. Update skill status to pending_review
        await tx.skill.update({
          where: { id: input.id },
          data: { status: "pending_review" },
        });
        // 2. Update latest version review status
        await tx.skillVersion.update({
          where: { id: latestVersion.id },
          data: { reviewStatus: "pending" },
        });
        // 3. Create review request (ensure exactly one pending review exists)
        const existingReview = await tx.skillReview.findFirst({
          where: { skillId: input.id, status: "pending" },
        });
        if (!existingReview) {
          await tx.skillReview.create({
            data: {
              skillId: input.id,
              versionId: latestVersion.id,
              reviewerId: ctx.user.sub,
              status: "pending",
            },
          });
        }
      });

      await createAuditLog({
        orgId: ctx.user.orgId,
        actorId: ctx.user.sub,
        actorEmail: ctx.user.email,
        actorIp: ctx.ip,
        action: AUDIT_ACTIONS.SKILL_CREATE,
        resource: { type: "skill", id: skill.id, name: skill.name },
        details: { action: "submit_for_review" },
      });

      return { success: true };
    }),

  // =========================================================================
  // Update skill
  // =========================================================================
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        description: z.string().min(1).max(1024).optional(),
        descriptionZh: z.string().max(1024).optional(),
        visibility: z.enum(["private", "team", "department", "business_unit", "organization", "custom"]).optional(),
        classification: z.enum(["public", "internal", "confidential", "restricted"]).optional(),
        tags: z.array(z.string()).optional(),
        category: z.string().optional(),
        teamId: z.string().optional(),
        content: z.string().optional(),
        version: z.string().regex(/^\d+\.\d+\.\d+$/).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, content, version, ...data } = input;

      // Verify ownership or admin
      const skill = await ctx.db.skill.findUnique({
        where: { id },
        include: { versions: { orderBy: { publishedAt: "desc" }, take: 1 } },
      });
      if (!skill) throw new Error("Skill not found");
      if (skill.authorId !== ctx.user.sub) {
        throw new Error("Not authorized to edit this skill");
      }

      // Use transaction if content is being updated
      if (content !== undefined) {
        const latestVersion = skill.versions[0];
        await ctx.db.$transaction(async (tx) => {
          // Update skill metadata
          await tx.skill.update({ where: { id }, data });

          if (latestVersion) {
            // Update existing latest version
            await tx.skillVersion.update({
              where: { id: latestVersion.id },
              data: {
                content,
                version: version || latestVersion.version,
                packageSize: Buffer.byteLength(content),
                reviewStatus: "pending",
              },
            });
          } else {
            // No version exists yet — create one
            await tx.skillVersion.create({
              data: {
                skillId: id,
                version: version || "1.0.0",
                content,
                packageUrl: "",
                packageHash: crypto.randomUUID(),
                packageSize: Buffer.byteLength(content),
                publishedBy: ctx.user.sub,
                reviewStatus: "pending",
              },
            });
          }

          // Ensure skill stays in draft if it was draft
          if (skill.status === "draft") {
            await tx.skill.update({ where: { id }, data: { status: "draft" } });
          }
        });
      } else {
        await ctx.db.skill.update({ where: { id }, data });
      }

      await createAuditLog({
        orgId: ctx.user.orgId,
        actorId: ctx.user.sub,
        actorEmail: ctx.user.email,
        actorIp: ctx.ip,
        action: AUDIT_ACTIONS.SKILL_UPDATE,
        resource: { type: "skill", id: skill.id, name: skill.name },
        details: { changedFields: Object.keys({ ...data, content: content ? "yes" : undefined }) },
      });

      return ctx.db.skill.findUnique({ where: { id } });
    }),

  // =========================================================================
  // Delete skill (soft delete - deprecate)
  // =========================================================================
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const skill = await ctx.db.skill.findUnique({ where: { id: input.id } });
      if (!skill) throw new Error("Skill not found");
      if (skill.authorId !== ctx.user.sub && !["owner", "admin"].includes(ctx.member.role)) {
        throw new Error("Not authorized");
      }

      await ctx.db.skill.update({
        where: { id: input.id },
        data: { status: "deprecated" },
      });

      await createAuditLog({
        orgId: ctx.user.orgId,
        actorId: ctx.user.sub,
        actorEmail: ctx.user.email,
        actorIp: ctx.ip,
        action: AUDIT_ACTIONS.SKILL_DELETE,
        resource: { type: "skill", id: skill.id, name: skill.name },
      });

      return { success: true };
    }),

  // =========================================================================
  // Get download URL for skill package
  // =========================================================================
  getDownloadUrl: protectedProcedure
    .input(z.object({ id: z.string(), version: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const skill = await ctx.db.skill.findUnique({
        where: { id: input.id },
        include: { versions: { orderBy: { publishedAt: "desc" }, take: 1 } },
      });
      if (!skill) throw new Error("Skill not found");

      const version = input.version
        ? skill.versions.find((v) => v.version === input.version)
        : skill.versions[0];

      if (!version) throw new Error("Version not found");

      // In production, generate pre-signed S3 URL here
      const downloadUrl = version.packageUrl || `/api/skills/download/${skill.id}/${version.version}`;

      // Record install
      await ctx.db.skillInstall.upsert({
        where: { skillId_userId: { skillId: skill.id, userId: ctx.user.sub } },
        create: {
          skillId: skill.id,
          userId: ctx.user.sub,
          version: version.version,
        },
        update: {
          version: version.version,
          installedAt: new Date(),
        },
      });

      // Increment install count
      await ctx.db.skill.update({
        where: { id: skill.id },
        data: { installCount: { increment: 1 } },
      });

      await createAuditLog({
        orgId: ctx.user.orgId,
        actorId: ctx.user.sub,
        actorEmail: ctx.user.email,
        actorIp: ctx.ip,
        action: AUDIT_ACTIONS.SKILL_DOWNLOAD,
        resource: { type: "skill", id: skill.id, name: skill.name, version: version.version },
      });

      return { downloadUrl, packageHash: version.packageHash };
    }),

  // =========================================================================
  // Get skill analytics
  // =========================================================================
  getAnalytics: protectedProcedure
    .input(z.object({ id: z.string(), period: z.enum(["7d", "30d", "90d"]).default("30d") }))
    .query(async ({ ctx, input }) => {
      const skill = await ctx.db.skill.findUnique({
        where: { id: input.id },
        include: {
          _count: { select: { installs: true, versions: true, reviews: true } },
          installs: {
            take: 100,
            orderBy: { installedAt: "desc" },
          },
        },
      });
      if (!skill) throw new Error("Skill not found");

      return {
        totalInstalls: skill._count.installs,
        totalVersions: skill._count.versions,
        totalReviews: skill._count.reviews,
        rating: skill.rating,
        recentInstalls: skill.installs.length,
        lastUpdated: skill.updatedAt,
      };
    }),

  // =========================================================================
  // Rate skill
  // =========================================================================
  rate: protectedProcedure
    .input(z.object({ skillId: z.string(), rating: z.number().min(1).max(5), comment: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db.skillRating.upsert({
        where: { skillId_userId: { skillId: input.skillId, userId: ctx.user.sub } },
        create: {
          skillId: input.skillId,
          userId: ctx.user.sub,
          rating: input.rating,
          comment: input.comment,
        },
        update: { rating: input.rating, comment: input.comment },
      });

      // Update average rating
      const stats = await ctx.db.skillRating.aggregate({
        where: { skillId: input.skillId },
        _avg: { rating: true },
        _count: true,
      });

      await ctx.db.skill.update({
        where: { id: input.skillId },
        data: {
          rating: stats._avg.rating || 0,
          ratingCount: stats._count,
        },
      });

      return result;
    }),
});

// =============================================================================
// Helper Functions
// =============================================================================

function checkSkillAccess(
  skill: { visibility: string; authorId: string; buId?: string | null; deptId?: string | null; teamId?: string | null },
  userId: string,
  member: { role: string; buId?: string | null; deptId?: string | null; teamIds: string[] }
): boolean {
  // Author always has access
  if (skill.authorId === userId) return true;
  // Admins always have access
  if (["owner", "admin"].includes(member.role)) return true;

  switch (skill.visibility) {
    case "organization":
      return true;
    case "business_unit":
      return skill.buId === member.buId;
    case "department":
      return skill.deptId === member.deptId;
    case "team":
      return skill.teamId ? member.teamIds.includes(skill.teamId) : false;
    case "private":
      return skill.authorId === userId;
    default:
      return false;
  }
}

function validateSkillContent(name: string, content: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!content.includes("---")) {
    errors.push("Missing YAML frontmatter");
  }

  if (content.length > 50000) {
    errors.push("SKILL.md exceeds 50,000 characters");
  }

  return { valid: errors.length === 0, errors };
}

function runBasicSecurityScan(content: string): Record<string, unknown> {
  const findings: Array<{ severity: string; message: string; pattern: string }> = [];

  const patterns = [
    { pattern: /eval\s*\(/, severity: "high", message: "Use of eval() detected" },
    { pattern: /child_process/, severity: "high", message: "Child process usage detected" },
    { pattern: /exec\s*\(/, severity: "high", message: "Use of exec() detected" },
    { pattern: /process\.env/, severity: "medium", message: "Environment variable access" },
    { pattern: /AKIA[0-9A-Z]{16}/, severity: "critical", message: "AWS access key detected" },
    { pattern: /ghp_[a-zA-Z0-9]{36}/, severity: "critical", message: "GitHub token detected" },
  ];

  for (const { pattern, severity, message } of patterns) {
    if (pattern.test(content)) {
      findings.push({ severity, message, pattern: pattern.source });
    }
  }

  return {
    passed: findings.every((f) => f.severity !== "critical"),
    findings,
    scannedAt: new Date().toISOString(),
  };
}
