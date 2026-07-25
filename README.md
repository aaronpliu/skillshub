# Enterprise Skills Hub

<div align="center">

**A centralized platform for managing, distributing, and governing AI agent skills within an organization**

[![Version](https://img.shields.io/badge/version-0.1.0-blue.svg)](CHANGELOG.md)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14-black.svg)](https://nextjs.org/)
[![Security](https://img.shields.io/badge/security-L4-red.svg)](SECURITY.md)

[Bug Report](.github/ISSUE_TEMPLATE/bug_report.md) · [Feature Request](.github/ISSUE_TEMPLATE/feature_request.md) · [Contributing](CONTRIBUTING.md)

</div>

Built with enterprise-grade security, multi-level organizational hierarchy, and L4 compliance (SOC2/ISO27001).

## Features

- **Multi-Level Organization**: Org → Business Unit → Department → Team → Member hierarchy with tenant isolation
- **Fine-Grained Access Control**: RBAC with attribute-based extensions (ABAC) for skill visibility
- **Skill Lifecycle Management**: Upload, review, publish, version, and distribute skills
- **L4 Security**: AES-256-GCM encryption, HMAC audit logs, DLP scanning, security scanning, rate limiting
- **QoderWork Compatible**: Uses the same skill format as the QoderWork marketplace
- **Enterprise Integration**: SSO (OIDC/SAML), webhooks, Slack/Teams notifications, Prometheus metrics

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router) + TypeScript + Tailwind CSS |
| Backend | tRPC v10 + Next.js API Routes |
| Database | PostgreSQL 15 + Prisma 5 ORM |
| Cache | Redis 7 (sessions, rate limiting, queues) |
| Storage | S3-compatible (MinIO for dev, AWS S3 for prod) |
| Search | Elasticsearch 8 |
| Auth | JWT + OIDC/SAML SSO |
| Deployment | Docker + Kubernetes |

## Quick Start

### Prerequisites

- Node.js 20+
- Docker & Docker Compose
- Git

### Setup

```bash
# Clone the repository
git clone https://github.com/aaronpliu/skillshub.git
cd skillshub

# Install dependencies
npm install --legacy-peer-deps

# Copy environment configuration
cp .env.example .env

# Start infrastructure (PostgreSQL, Redis, MinIO, Elasticsearch)
docker compose up -d postgres redis minio elasticsearch

# Wait for services to be ready, then initialize the database
npx prisma generate
npx prisma db push

# Seed demo data
npm run db:seed

# Start the development server
npm run dev
```

### Login Credentials

| Field | Value |
|-------|-------|
| Email | `alice@acme.com` |
| Password | `password123` |
| Org Slug | `acme-corp` |

### Database Initialization

After starting the infrastructure services, you must initialize the database before using the application:

```bash
# Generate Prisma client (creates TypeScript types from schema)
npx prisma generate

# Create database tables from schema
npx prisma db push

# Seed database with demo data (organizations, users, skills)
npm run db:seed
```

**What this does:**
- `prisma generate`: Generates the Prisma client with TypeScript types based on `prisma/schema.prisma`
- `prisma db push`: Creates all database tables (organizations, users, skills, reviews, etc.)
- `npm run db:seed`: Populates the database with demo data including:
  - Organization: `acme-corp`
  - Users: `alice@acme.com`, `bob@acme.com`, `carol@acme.com`, `dave@acme.com`, `eve@acme.com`
  - Sample skills and review data

**Troubleshooting:**
- If you get connection errors, ensure PostgreSQL is running: `podman compose ps`
- If tables already exist, `prisma db push` will update them (use `--force-reset` to drop and recreate)
- The seed script is idempotent - running it multiple times is safe

### Access Points

| Service | URL |
|---------|-----|
| Application | http://localhost:3000 |
| MinIO Console | http://localhost:9001 |
| Elasticsearch | http://localhost:9200 |

## Project Structure

```
skillshub/
├── prisma/
│   ├── schema.prisma          # Database schema (18 models)
│   └── seed.ts                # Demo data seeder
├── src/
│   ├── app/                   # Next.js App Router pages
│   │   ├── admin/             # Audit logs, security, settings
│   │   ├── analytics/         # Usage metrics & BI
│   │   ├── api/               # API routes (health, metrics, ready, trpc)
│   │   ├── org/               # Org structure, members, policies
│   │   ├── review/            # Skill review queue
│   │   ├── settings/          # User profile settings
│   │   └── skills/            # Skill browser, detail, edit, new, versions
│   ├── components/            # React components
│   │   ├── layout/            # Sidebar navigation
│   │   └── shared/            # CommandPalette, shared UI
│   ├── lib/                   # Core libraries
│   │   ├── auth/              # JWT, encryption, password hashing
│   │   ├── cache/             # Redis client, rate limiter
│   │   ├── db/                # Prisma client
│   │   ├── queue/             # Notification & webhook services
│   │   ├── security/          # Audit logger, DLP scanner, security scanner
│   │   ├── storage/           # S3 storage service
│   │   └── utils/             # Logger, helpers
│   ├── server/                # Backend
│   │   ├── routers/           # tRPC routers (auth, org, skill, review, audit)
│   │   ├── middleware/        # Rate limiting middleware
│   │   ├── trpc.ts            # tRPC setup, context, RBAC
│   │   └── index.ts           # App router
│   └── styles/                # Global CSS
├── k8s/                       # Kubernetes manifests
├── docker/                    # Dockerfiles
├── scripts/                   # Setup scripts
├── docker-compose.yml         # Local development infrastructure
└── ENTERPRISE_SKILLS_HUB_DESIGN.md  # Full system design document
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npm run typecheck` | Run TypeScript type checking |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:migrate` | Run database migrations |
| `npm run db:push` | Push schema to database |
| `npm run db:seed` | Seed demo data |
| `npm run db:studio` | Open Prisma Studio |
| `npm run test` | Run tests |

## Pages

| Route | Description |
|-------|-------------|
| `/` | Dashboard with stats and recent activity |
| `/skills` | Skill browser with search and filters |
| `/skills/detail?id=` | Skill detail with versions, reviews, install |
| `/skills/new` | Create new skill with metadata and SKILL.md editor |
| `/skills/edit?id=` | Edit existing skill |
| `/skills/versions?id=` | Version history timeline |
| `/review` | Review queue for skill approval |
| `/org` | Organization hierarchy view |
| `/org/members` | Member management with invite and roles |
| `/org/policies` | ABAC access policy editor |
| `/analytics` | Usage metrics, adoption tracking, BI |
| `/admin/audit` | Immutable audit log with search and export |
| `/admin/security` | Security dashboard with scan results and DLP |
| `/admin/settings` | Organization settings and SSO config |
| `/settings/profile` | User profile, API tokens, notifications |

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/health` | Health check |
| `GET /api/ready` | Readiness probe (DB + Redis) |
| `GET /api/metrics` | Prometheus metrics |
| `*/api/trpc` | tRPC API (auth, org, skill, review, audit) |

## Security

This project implements L4 security controls:

- **Authentication**: JWT access/refresh tokens, SSO (OIDC/SAML)
- **Encryption**: AES-256-GCM at rest, TLS 1.3 in transit
- **Audit**: Immutable tamper-evident logs with HMAC signatures, 7-year retention
- **DLP**: Scanning for PII (SSN, credit cards), API keys, secrets
- **RBAC/ABAC**: Role hierarchy with attribute-based policy evaluation
- **Rate Limiting**: Redis sliding window with per-user and per-endpoint limits
- **Compliance**: SOC2 Type II and ISO 27001 control mappings

## Documentation

| Document | Description |
|----------|-------------|
| [README.md](./README.md) | Project overview and setup (this file) |
| [AGENTS.md](./AGENTS.md) | AI Agent guidelines and coding conventions |
| [DEPLOYMENT.md](./DEPLOYMENT.md) | Deployment guides (local dev + Ubuntu VM) |
| [CHANGELOG.md](./CHANGELOG.md) | Version history and release notes |
| [CONTRIBUTING.md](./CONTRIBUTING.md) | Contribution guidelines |
| [SECURITY.md](./SECURITY.md) | Security policy and vulnerability reporting |
| [ENTERPRISE_SKILLS_HUB_DESIGN.md](./ENTERPRISE_SKILLS_HUB_DESIGN.md) | Full system architecture (4,489 lines) |

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

## Security

For security issues, please see [SECURITY.md](./SECURITY.md) for our responsible disclosure policy.

## License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.
