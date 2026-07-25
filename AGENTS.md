# AGENTS.md - AI Agent Guidelines

This file provides context and guidelines for AI coding agents working on the Enterprise Skills Hub project.

## Project Overview

Enterprise Skills Hub is a centralized platform for managing, distributing, and governing AI agent skills within an organization. It provides enterprise-grade security, multi-level organizational hierarchy, and L4 compliance (SOC2/ISO27001).

## Tech Stack

- **Frontend**: Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **Backend**: tRPC v10 + Next.js API Routes
- **Database**: PostgreSQL 15 + Prisma 5 ORM
- **Cache**: Redis 7
- **Storage**: MinIO (S3-compatible)
- **Search**: Elasticsearch 8
- **Auth**: JWT + bcrypt
- **Monitoring**: Prometheus + Grafana

## Project Structure

```
skillshub/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── admin/             # Admin pages (audit, security, settings)
│   │   ├── analytics/         # Analytics dashboard
│   │   ├── api/               # API routes (tRPC, health, metrics)
│   │   ├── login/             # Login page
│   │   ├── org/               # Organization management
│   │   ├── register/          # Registration page
│   │   ├── review/            # Skill review queue
│   │   ├── settings/          # User profile settings
│   │   └── skills/            # Skill CRUD pages
│   ├── components/            # React components
│   │   ├── layout/            # Layout components (Sidebar)
│   │   └── shared/            # Shared components (CommandPalette)
│   ├── lib/                   # Core libraries
│   │   ├── auth/              # Auth utilities (session, token, crypto)
│   │   ├── cache/             # Redis client
│   │   ├── db/                # Prisma client
│   │   ├── queue/             # Notification & webhook services
│   │   ├── security/          # Audit, DLP, security scanner
│   │   ├── storage/           # S3 storage service
│   │   └── utils/             # Logger, helpers
│   ├── server/                # Backend logic
│   │   ├── routers/           # tRPC routers (auth, org, skill, review, audit)
│   │   ├── middleware/        # Rate limiting middleware
│   │   └── trpc.ts            # tRPC setup & context
│   └── styles/                # Global CSS
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── seed.ts                # Demo data seeder
├── monitoring/                # Prometheus & Grafana configs
├── k8s/                       # Kubernetes manifests
├── docker-compose.yml         # Local development infrastructure
└── ENTERPRISE_SKILLS_HUB_DESIGN.md  # Full system design (4,489 lines)
```

## Coding Conventions

### TypeScript
- Use strict mode (enabled in tsconfig.json)
- Prefer interfaces over types for object shapes
- Use explicit return types for exported functions
- Avoid `any` - use `unknown` when type is truly unknown

### React / Next.js
- Use App Router (not Pages Router)
- All pages are client components (`"use client"`)
- Use React Query (via tRPC) for data fetching
- Use Tailwind CSS for styling (no CSS modules)
- Keep components under 200 lines

### tRPC
- All API routes go through tRPC (no REST endpoints except health/metrics)
- Use `publicProcedure` for unauthenticated routes (login, register)
- Use `protectedProcedure` for authenticated routes
- Use `requireRole()` middleware for role-based access
- Always use tRPC client (`useMutation`/`useQuery`) - never raw fetch for tRPC calls

### Database
- Use Prisma ORM for all database operations
- Follow existing schema patterns in `prisma/schema.prisma`
- Use composite indexes for frequently queried fields
- Always include `createdAt` and `updatedAt` timestamps

### Authentication
- JWT tokens stored in module-level variable + sessionStorage
- Use `setAuthToken()` from `src/lib/auth/token.ts` to set tokens
- Use `getAuthToken()` to read tokens in tRPC headers
- Never use raw fetch for login - always use tRPC client

### Error Handling
- Throw descriptive errors in tRPC procedures
- Use try/catch with console.error for logging
- Return user-friendly error messages to frontend
- Log errors with context (user ID, action, resource)

## Common Patterns

### Adding a New tRPC Router
1. Create router in `src/server/routers/your-router.ts`
2. Add procedures with appropriate auth level
3. Export and add to `src/server/index.ts` appRouter
4. Use in frontend with `trpc.yourRouter.yourProcedure.useQuery()`

### Adding a New Page
1. Create page in `src/app/your-route/page.tsx`
2. Add `"use client"` directive
3. Use tRPC hooks for data fetching
4. Follow existing page patterns (loading/error states)

### Adding a New Database Model
1. Add model to `prisma/schema.prisma`
2. Run `npx prisma generate`
3. Run `npx prisma db push`
4. Update seed script if needed

## Security Guidelines

- Never commit `.env` file (it's in .gitignore)
- Never log sensitive data (passwords, tokens, PII)
- Always validate input with Zod schemas
- Use parameterized queries (Prisma handles this)
- Follow RBAC role hierarchy for access control
- Audit log all sensitive operations

## Testing

```bash
# Type checking
npm run typecheck

# Build verification
npm run build

# Database operations
npx prisma generate      # Generate Prisma client
npx prisma db push       # Push schema to database
npx tsx prisma/seed.ts   # Seed demo data
```

## Local Development

```bash
# Start infrastructure
podman compose up -d

# Start application
npm run dev

# Access points
# App: http://localhost:3000
# MinIO: http://localhost:9001
# Prometheus: http://localhost:9090
# Grafana: http://localhost:3001
```

## Known Issues & Gotchas

1. **Stale .next cache**: If you get 404 errors on static assets, delete `.next` and restart
2. **Auth token timing**: Always use `setAuthToken()` before navigating after login
3. **tRPC mutations**: Never use raw fetch - always use `useMutation()` hook
4. **Prisma client**: Run `npx prisma generate` after schema changes
5. **Session storage**: Token persists across page refresh but cleared on tab close

## Release Process

See `.qoder/skills/release-preparation.md` for complete release workflow.

Quick steps:
1. Update version in `package.json`
2. Run `npm install --package-lock-only`
3. Update `CHANGELOG.md`
4. Commit all three files
5. Create git tag and push
6. Build and verify

## Documentation

- `README.md` - Project overview and setup
- `DEPLOYMENT.md` - Deployment guides (local dev + Ubuntu VM)
- `CHANGELOG.md` - Version history
- `ENTERPRISE_SKILLS_HUB_DESIGN.md` - Full system architecture

## Questions?

If you need clarification on any convention or pattern, check:
1. Existing code in the same area
2. Design document for architectural decisions
3. CHANGELOG for recent changes and reasoning
