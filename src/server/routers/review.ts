import { z } from "zod";
import { router, protectedProcedure, requireRole } from "../trpc";
import { createAuditLog, AUDIT_ACTIONS } from "@/lib/security/audit";

export const reviewRouter = router({
  // =========================================================================
  // List pending reviews
  // =========================================================================
  listPending: protectedProcedure
    .input(
      z.object({
        status: z.enum(["pending", "approved", "rejected", "changes_requested"]).default("pending"),
        page: z.number().min(1).default(1),
        pageSize: z.number().min(1).max(100).default(20),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const params = input || { status: "pending" as const, page: 1, pageSize: 20 };

      // For pending status, also find skills with pending_review status
      // that are missing a SkillReview record (orphaned from failed submissions)
      if (params.status === "pending") {
        const orphanedSkills = await ctx.db.skill.findMany({
          where: {
            orgId: ctx.user.orgId,
            status: "pending_review",
            NOT: { versions: { some: { reviewStatus: "pending" } } },
          },
          include: {
            versions: { orderBy: { publishedAt: "desc" }, take: 1 },
            author: { select: { id: true, name: true, email: true } },
            team: { select: { id: true, name: true } },
          },
        });

        // Auto-create missing SkillReview records for orphaned skills
        for (const skill of orphanedSkills) {
          const version = skill.versions[0];
          if (version) {
            await ctx.db.skillReview.create({
              data: {
                skillId: skill.id,
                versionId: version.id,
                reviewerId: skill.authorId,
                status: "pending",
              },
            });
          }
        }
      }

      const [reviews, total] = await Promise.all([
        ctx.db.skillReview.findMany({
          where: {
            status: params.status,
            skill: { orgId: ctx.user.orgId },
          },
          include: {
            skill: {
              select: {
                id: true,
                name: true,
                description: true,
                classification: true,
                visibility: true,
                author: { select: { id: true, name: true, email: true } },
                team: { select: { id: true, name: true } },
              },
            },
            reviewer: { select: { id: true, name: true, email: true } },
          },
          orderBy: { createdAt: "desc" },
          skip: (params.page - 1) * params.pageSize,
          take: params.pageSize,
        }),
        ctx.db.skillReview.count({
          where: {
            status: params.status,
            skill: { orgId: ctx.user.orgId },
          },
        }),
      ]);

      return { reviews, total, page: params.page, pageSize: params.pageSize };
    }),

  // =========================================================================
  // Get review detail
  // =========================================================================
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const review = await ctx.db.skillReview.findUnique({
        where: { id: input.id },
        include: {
          skill: {
            include: {
              author: { select: { id: true, name: true, email: true } },
              team: true,
              versions: {
                orderBy: { publishedAt: "desc" },
                take: 1,
              },
            },
          },
          reviewer: { select: { id: true, name: true, email: true } },
        },
      });

      if (!review) throw new Error("Review not found");
      return review;
    }),

  // =========================================================================
  // Approve review
  // =========================================================================
  approve: protectedProcedure
    .input(
      z.object({
        reviewId: z.string(),
        comment: z.string().optional(),
        visibility: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const review = await ctx.db.skillReview.findUnique({
        where: { id: input.reviewId },
        include: { skill: true },
      });
      if (!review) throw new Error("Review not found");

      // Update review
      await ctx.db.skillReview.update({
        where: { id: input.reviewId },
        data: {
          status: "approved",
          comment: input.comment,
        },
      });

      // Update skill status to published
      await ctx.db.skill.update({
        where: { id: review.skillId },
        data: { status: "published" },
      });

      // Update version review status
      const latestVersion = await ctx.db.skillVersion.findFirst({
        where: { skillId: review.skillId },
        orderBy: { publishedAt: "desc" },
      });
      if (latestVersion) {
        await ctx.db.skillVersion.update({
          where: { id: latestVersion.id },
          data: {
            reviewStatus: "approved",
            reviewedBy: ctx.user.sub,
            reviewedAt: new Date(),
            reviewComment: input.comment,
          },
        });
      }

      await createAuditLog({
        orgId: ctx.user.orgId,
        actorId: ctx.user.sub,
        actorEmail: ctx.user.email,
        actorIp: ctx.ip,
        action: AUDIT_ACTIONS.REVIEW_APPROVE,
        resource: { type: "skill", id: review.skillId, name: review.skill.name },
        details: { reviewId: input.reviewId },
      });

      return { success: true };
    }),

  // =========================================================================
  // Reject review
  // =========================================================================
  reject: protectedProcedure
    .input(
      z.object({
        reviewId: z.string(),
        comment: z.string().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const review = await ctx.db.skillReview.findUnique({
        where: { id: input.reviewId },
        include: { skill: true },
      });
      if (!review) throw new Error("Review not found");

      await ctx.db.skillReview.update({
        where: { id: input.reviewId },
        data: {
          status: "rejected",
          comment: input.comment,
        },
      });

      await ctx.db.skill.update({
        where: { id: review.skillId },
        data: { status: "rejected" },
      });

      await createAuditLog({
        orgId: ctx.user.orgId,
        actorId: ctx.user.sub,
        actorEmail: ctx.user.email,
        actorIp: ctx.ip,
        action: AUDIT_ACTIONS.REVIEW_REJECT,
        resource: { type: "skill", id: review.skillId, name: review.skill.name },
        details: { reviewId: input.reviewId, reason: input.comment },
      });

      return { success: true };
    }),

  // =========================================================================
  // Request changes
  // =========================================================================
  requestChanges: protectedProcedure
    .input(
      z.object({
        reviewId: z.string(),
        comment: z.string().min(1),
        requiredChanges: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const review = await ctx.db.skillReview.findUnique({
        where: { id: input.reviewId },
      });
      if (!review) throw new Error("Review not found");

      await ctx.db.skillReview.update({
        where: { id: input.reviewId },
        data: {
          status: "changes_requested",
          comment: input.comment,
        },
      });

      await createAuditLog({
        orgId: ctx.user.orgId,
        actorId: ctx.user.sub,
        actorEmail: ctx.user.email,
        actorIp: ctx.ip,
        action: AUDIT_ACTIONS.REVIEW_REQUEST_CHANGES,
        resource: { type: "skill", id: review.skillId },
        details: { reviewId: input.reviewId, requiredChanges: input.requiredChanges },
      });

      return { success: true };
    }),

  // =========================================================================
  // Get review statistics
  // =========================================================================
  getStats: protectedProcedure.query(async ({ ctx }) => {
    const [pending, approved, rejected] = await Promise.all([
      ctx.db.skillReview.count({
        where: { status: "pending", skill: { orgId: ctx.user.orgId } },
      }),
      ctx.db.skillReview.count({
        where: { status: "approved", skill: { orgId: ctx.user.orgId } },
      }),
      ctx.db.skillReview.count({
        where: { status: "rejected", skill: { orgId: ctx.user.orgId } },
      }),
    ]);

    return { pending, approved, rejected };
  }),
});
