# Changelog

All notable changes to the Enterprise Skills Hub project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-07-25

### Added

#### Core Infrastructure
- Next.js 14 App Router with TypeScript
- tRPC v10 for type-safe API layer
- Prisma 5 ORM with PostgreSQL 15
- Redis 7 for caching and session management
- MinIO for S3-compatible object storage
- Elasticsearch 8 for search functionality
- Docker Compose configuration for local development
- Podman support for containerized services

#### Backend Features
- **Authentication System**
  - JWT-based authentication with access and refresh tokens
  - User registration with organization creation or joining
  - Password hashing with bcrypt
  - Session management with sessionStorage
  - Auth guard for protected routes

- **Organization Management**
  - Multi-level hierarchy: Organization → Business Unit → Department → Team → Member
  - RBAC with 7 role types: owner, admin, bu_admin, dept_admin, team_admin, member, viewer
  - ABAC (Attribute-Based Access Control) policy engine
  - Organization settings and SSO configuration

- **Skill Management**
  - Skill CRUD operations with versioning
  - Skill publishing workflow with review process
  - Skill visibility scopes (private, team, department, business_unit, organization)
  - Data classification levels (public, internal, confidential, restricted)
  - Skill installation tracking and ratings
  - Security scanning for uploaded skills
  - DLP (Data Loss Prevention) scanning

- **Review System**
  - Skill review queue with approve/reject/request changes actions
  - Review statistics and metrics
  - Audit logging for all review actions

- **Audit & Security**
  - Immutable audit logs with HMAC signatures
  - Comprehensive audit log search and filtering
  - Security dashboard with scan results
  - Rate limiting middleware with Redis sliding window

#### Frontend Pages
- **Authentication**
  - Login page with organization slug selection
  - Registration page with create/join organization modes
  - Auth guard with automatic redirect

- **Dashboard**
  - Overview statistics (skills, installs, users, pending reviews)
  - Recent skills and pending reviews widgets
  - Trending skills visualization

- **Skills**
  - Skill browser with search and filters
  - Skill detail page with versions and reviews
  - Skill creation form with metadata editor
  - Skill edit page
  - Version history timeline

- **Organization**
  - Organization hierarchy visualization
  - Member management with invite and role assignment
  - ABAC policy editor

- **Review**
  - Review queue with status filters
  - Review detail with approve/reject actions
  - Review statistics

- **Admin**
  - Audit log viewer with search and export
  - Security dashboard
  - Organization settings

- **Analytics**
  - Usage metrics and trends
  - Top skills ranking
  - Install statistics

- **Profile**
  - User profile settings
  - API token management
  - Notification preferences

#### Monitoring & Observability
- Prometheus metrics endpoint at `/api/metrics`
- Grafana dashboards with pre-configured panels
- Health check endpoint at `/api/health`
- Readiness probe at `/api/ready`

#### Developer Experience
- TypeScript strict mode enabled
- ESLint configuration
- Tailwind CSS with shadcn/ui components
- Command palette (Cmd/Ctrl+K) for quick navigation
- Hot reload during development

### Fixed

- Auth guard infinite redirect loop on login page
- tRPC 401 errors after login due to token timing issues
- Module-level token store for immediate auth header availability
- Stale `.next` cache causing 404 errors on static assets
- Organization domain field made optional in database schema
- Review rating display removed (not part of SkillReview model)

### Technical Details

#### Architecture Decisions
- Used tRPC client directly for mutations instead of raw fetch to ensure proper superjson serialization
- Module-level token store (`src/lib/auth/token.ts`) for synchronous token access
- Session storage for token persistence across page refreshes
- React Query for automatic query invalidation after mutations

#### Database Schema
- 18 Prisma models covering all entities
- Composite indexes for performance
- Row-level security patterns for multi-tenancy
- Cascade deletes for referential integrity

#### Security Implementation
- AES-256-GCM encryption for sensitive data
- HMAC-SHA256 signatures for audit log integrity
- JWT with HS256 algorithm
- Bcrypt password hashing with 12 rounds
- Rate limiting with configurable limits per endpoint

### Known Issues
- Email verification not yet implemented
- API token CRUD needs dedicated backend endpoint
- Analytics trend charts need time-series endpoint
- Organization policies page uses static data (needs backend CRUD)

### Documentation
- Comprehensive README.md with setup instructions
- DEPLOYMENT.md with local development and Ubuntu VM deployment guides
- ENTERPRISE_SKILLS_HUB_DESIGN.md with full system architecture (4,489 lines)

## [0.0.0] - 2026-07-23

### Added
- Initial project structure
- Design document (ENTERPRISE_SKILLS_HUB_DESIGN.md)

[0.1.0]: https://github.com/aaronpliu/skillshub/compare/v0.0.0...v0.1.0
[0.0.0]: https://github.com/aaronpliu/skillshub/releases/tag/v0.0.0
