import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "../trpc";
import { signAccessToken, signRefreshToken, verifyToken, hashPassword, verifyPassword, type TokenPayload } from "@/lib/auth/crypto";
import { createAuditLog, AUDIT_ACTIONS } from "@/lib/security/audit";

export const authRouter = router({
  // =========================================================================
  // Login with email/password (dev mode) or SSO
  // =========================================================================
  login: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(8),
        orgSlug: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        console.log("[auth.login] Attempting login:", { email: input.email, orgSlug: input.orgSlug });

        // Find org
        const org = await ctx.db.organization.findUnique({
          where: { slug: input.orgSlug },
        });
        if (!org) {
          console.log("[auth.login] Organization not found:", input.orgSlug);
          throw new Error("Organization not found");
        }

        // Find user
        const user = await ctx.db.user.findUnique({
          where: { email: input.email },
        });
        if (!user || !user.passwordHash) {
          console.log("[auth.login] User not found or no password:", input.email);
          await createAuditLog({
            orgId: org.id,
            actorId: "unknown",
            actorEmail: input.email,
            actorIp: ctx.ip,
            action: AUDIT_ACTIONS.AUTH_FAILED,
            resource: { type: "auth", id: "login" },
            details: { reason: "Invalid credentials" },
            result: "failure",
          });
          throw new Error("Invalid credentials");
        }

        // Verify password
        const valid = await verifyPassword(input.password, user.passwordHash);
        if (!valid) {
          console.log("[auth.login] Invalid password for:", input.email);
          throw new Error("Invalid credentials");
        }

        // Find member
        const member = await ctx.db.member.findUnique({
          where: { orgId_userId: { orgId: org.id, userId: user.id } },
        });
        if (!member || !member.active) {
          console.log("[auth.login] Member not found or inactive:", { userId: user.id, orgId: org.id });
          throw new Error("Access denied");
        }

        // Generate tokens
        const tokenPayload: TokenPayload = {
          sub: user.id,
          email: user.email,
          orgId: org.id,
          role: member.role,
          member_id: member.id,
        };

        const accessToken = await signAccessToken(tokenPayload);
        const refreshToken = await signRefreshToken(user.id);

        // Update last login
        await ctx.db.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });

        // Audit log
        await createAuditLog({
          orgId: org.id,
          actorId: user.id,
          actorEmail: user.email,
          actorIp: ctx.ip,
          action: AUDIT_ACTIONS.AUTH_LOGIN,
          resource: { type: "auth", id: "login" },
        });

        console.log("[auth.login] Success:", { userId: user.id, email: user.email });

        return {
          accessToken,
          refreshToken,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            avatarUrl: user.avatarUrl,
          },
          org: {
            id: org.id,
            name: org.name,
            slug: org.slug,
          },
          role: member.role,
        };
      } catch (error) {
        console.error("[auth.login] Error:", error);
        throw error;
      }
    }),

  // =========================================================================
  // Register new user
  // =========================================================================
  register: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(8),
        name: z.string().min(1),
        orgSlug: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        console.log("[auth.register] Attempting registration:", { email: input.email });

        // Check if email already exists
        const existingUser = await ctx.db.user.findUnique({
          where: { email: input.email },
        });
        if (existingUser) {
          throw new Error("Email already registered");
        }

        // Find existing organization
        const org = await ctx.db.organization.findUnique({
          where: { slug: input.orgSlug },
        });
        if (!org) {
          throw new Error("Organization not found");
        }

        const role = "member";

        // Create user
        const passwordHash = await hashPassword(input.password);
        const user = await ctx.db.user.create({
          data: {
            email: input.email,
            name: input.name,
            passwordHash,
          },
        });

        // Create membership
        const member = await ctx.db.member.create({
          data: {
            orgId: org.id,
            userId: user.id,
            role,
            active: true,
          },
        });

        // Generate tokens
        const tokenPayload: TokenPayload = {
          sub: user.id,
          email: user.email,
          orgId: org.id,
          role: member.role,
          member_id: member.id,
        };

        const accessToken = await signAccessToken(tokenPayload);
        const refreshToken = await signRefreshToken(user.id);

        // Audit log
        await createAuditLog({
          orgId: org.id,
          actorId: user.id,
          actorEmail: user.email,
          actorIp: ctx.ip,
          action: "user.register",
          resource: { type: "user", id: user.id, name: user.name },
          details: { role },
        });

        console.log("[auth.register] Success:", { userId: user.id, email: user.email, role });

        return {
          accessToken,
          refreshToken,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
          },
          org: {
            id: org.id,
            name: org.name,
            slug: org.slug,
          },
          role: member.role,
        };
      } catch (error) {
        console.error("[auth.register] Error:", error);
        throw error;
      }
    }),

  // =========================================================================
  // List available organizations (for registration)
  // =========================================================================
  listOrganizations: publicProcedure
    .query(async ({ ctx }) => {
      const orgs = await ctx.db.organization.findMany({
        select: {
          id: true,
          name: true,
          slug: true,
          domain: true,
          _count: {
            select: { members: true },
          },
        },
        orderBy: { name: "asc" },
      });

      return orgs.map((org) => ({
        id: org.id,
        name: org.name,
        slug: org.slug,
        domain: org.domain,
        memberCount: org._count.members,
      }));
    }),

  // =========================================================================
  // Check if email is available
  // =========================================================================
  checkEmail: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.user.findUnique({
        where: { email: input.email },
      });
      return { available: !existing };
    }),

  // =========================================================================
  // Refresh access token
  // =========================================================================
  refresh: publicProcedure
    .input(z.object({ refreshToken: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const payload = await verifyToken(input.refreshToken) as (TokenPayload & { type: string }) | null;
      if (!payload || payload.type !== "refresh") {
        throw new Error("Invalid refresh token");
      }

      const user = await ctx.db.user.findUnique({ where: { id: payload.sub } });
      if (!user) throw new Error("User not found");

      // Find member for first org (or could be parameterized)
      const member = await ctx.db.member.findFirst({
        where: { userId: user.id, active: true },
      });
      if (!member) throw new Error("No active membership");

      const tokenPayload: TokenPayload = {
        sub: user.id,
        email: user.email,
        orgId: member.orgId,
        role: member.role,
        member_id: member.id,
      };

      const accessToken = await signAccessToken(tokenPayload);
      return { accessToken };
    }),

  // =========================================================================
  // Get current user session
  // =========================================================================
  me: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.db.user.findUnique({
      where: { id: ctx.user.sub },
      include: {
        members: {
          include: {
            org: true,
          },
        },
      },
    });

    if (!user) throw new Error("User not found");

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      memberships: user.members.map((m) => ({
        orgId: m.orgId,
        orgName: m.org.name,
        orgSlug: m.org.slug,
        role: m.role,
      })),
    };
  }),

  // =========================================================================
  // SSO initiate (stub for OIDC/SAML)
  // =========================================================================
  ssoInitiate: publicProcedure
    .input(z.object({ orgSlug: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const org = await ctx.db.organization.findUnique({
        where: { slug: input.orgSlug },
      });
      if (!org) throw new Error("Organization not found");

      const settings = org.settings as { ssoConfig?: { authorizationEndpoint?: string; clientId?: string } };
      const ssoConfig = settings.ssoConfig;

      if (!ssoConfig?.authorizationEndpoint) {
        throw new Error("SSO not configured for this organization");
      }

      const state = crypto.randomUUID();
      const redirectUri = `${process.env.NEXTAUTH_URL}/api/auth/callback`;

      const authUrl = new URL(ssoConfig.authorizationEndpoint);
      authUrl.searchParams.set("client_id", ssoConfig.clientId || "");
      authUrl.searchParams.set("redirect_uri", redirectUri);
      authUrl.searchParams.set("response_type", "code");
      authUrl.searchParams.set("scope", "openid profile email");
      authUrl.searchParams.set("state", state);

      return { authUrl: authUrl.toString(), state };
    }),
});
