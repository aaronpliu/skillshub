# Enterprise Skills Hub - System Design Document

## 1. Executive Summary

The Enterprise Skills Hub is a centralized platform for managing, distributing, and governing AI agent skills within an organization. Unlike the public QoderWork marketplace, this system focuses on internal skill management with enterprise-grade security, multi-level organizational hierarchy, and compliance with L4 security standards (SOC2/ISO27001).

### 1.1 Key Objectives

- **Centralized Skill Management**: Single source of truth for all organizational skills
- **Multi-Tenancy with Hierarchical Organization**: Support org → business unit → department → team → member structure
- **Fine-Grained Access Control**: RBAC with attribute-based extensions for skill visibility and modification
- **L4 Security Compliance**: Full compliance framework including encryption, audit logging, data classification, DLP, and threat modeling
- **Skill Lifecycle Governance**: Controlled publish/review workflows with version management
- **Seamless Integration**: Compatible with QoderWork skill format for easy adoption

### 1.2 Technology Stack

- **Frontend**: Next.js 14+ (App Router) with TypeScript
- **Backend**: Next.js API Routes + tRPC for type-safe APIs
- **Database**: PostgreSQL 15+ with Prisma ORM
- **Cache**: Redis 7+ for session management and rate limiting
- **Object Storage**: S3-compatible storage (MinIO for self-hosted, AWS S3 for cloud)
- **Authentication**: OIDC/SAML 2.0 SSO integration
- **Search**: Elasticsearch 8+ for skill discovery
- **Message Queue**: Redis Streams or RabbitMQ for async processing
- **Deployment**: Docker + Kubernetes (Helm charts)

---

## 2. System Architecture

### 2.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Load Balancer (NGINX)                        │
└────────────────────────────────┬────────────────────────────────────┘
                                 │
        ┌────────────────────────┼────────────────────────┐
        │                        │                        │
        ▼                        ▼                        ▼
┌──────────────┐        ┌──────────────┐        ┌──────────────┐
│  Next.js Web │        │  API Server  │        │  Worker Node │
│   (Frontend) │        │   (tRPC)     │        │  (Background)│
└──────┬───────┘        └──────┬───────┘        └──────┬───────┘
       │                       │                       │
       └───────────────────────┼───────────────────────┘
                               │
        ┌──────────────────────┼──────────────────────┐
        │                      │                      │
        ▼                      ▼                      ▼
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│  PostgreSQL  │      │    Redis     │      │ Elasticsearch│
│  (Primary +  │      │   (Cache +   │      │   (Search)   │
│   Replica)   │      │    Queue)    │      │              │
└──────────────┘      └──────────────┘      └──────────────┘
        │
        ▼
┌──────────────┐
│  S3 Storage  │
│  (Skill      │
│   Packages)  │
└──────────────┘
```

### 2.2 Core Components

#### 2.2.1 Web Application (Next.js Frontend)

- **Skill Browser**: Search, filter, and browse skills
- **Skill Editor**: Web-based SKILL.md editor with live preview
- **Admin Dashboard**: Organization management, user provisioning, audit logs
- **Analytics Dashboard**: Skill usage metrics, adoption tracking
- **Review Console**: Skill approval workflow interface

#### 2.2.2 API Server (tRPC + Next.js API Routes)

- **Authentication Service**: SSO integration, JWT management
- **Authorization Service**: RBAC/ABAC policy evaluation
- **Skill Service**: CRUD operations, versioning, packaging
- **Organization Service**: Hierarchy management, member provisioning
- **Audit Service**: Immutable audit log recording
- **Search Service**: Elasticsearch integration for skill discovery
- **Storage Service**: S3 upload/download with integrity verification

#### 2.2.3 Worker Nodes (Background Processing)

- **Skill Validator**: Automated security scanning and format validation
- **Search Indexer**: Async Elasticsearch indexing
- **Audit Logger**: Buffered audit log writes
- **Notification Service**: Email/webhook notifications for reviews
- **Dependency Scanner**: Vulnerability scanning for skill dependencies

### 2.3 Deployment Architecture

```yaml
# Kubernetes Deployment (simplified)
apiVersion: apps/v1
kind: Deployment
metadata:
  name: skills-hub
spec:
  replicas: 3
  template:
    spec:
      containers:
      - name: web
        image: skills-hub:latest
        ports:
        - containerPort: 3000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: skills-hub-secrets
              key: database-url
        - name: S3_ACCESS_KEY
          valueFrom:
            secretKeyRef:
              name: skills-hub-secrets
              key: s3-access-key
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
        livenessProbe:
          httpGet:
            path: /api/health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
```

---

## 3. Organization Structure & Multi-Tenancy

### 3.1 Hierarchical Model

```
Organization (Tenant)
├── Business Unit A
│   ├── Department X
│   │   ├── Team 1
│   │   │   ├── Member Alice (Admin)
│   │   │   ├── Member Bob (Developer)
│   │   │   └── Member Carol (Viewer)
│   │   └── Team 2
│   └── Department Y
└── Business Unit B
    └── Department Z
```

### 3.2 Data Model

```typescript
// Organization (Tenant)
interface Organization {
  id: string;                    // UUID
  name: string;                  // "Acme Corp"
  slug: string;                  // "acme-corp" (URL-friendly)
  domain: string;                // "acme.com" (for SSO)
  plan: 'enterprise' | 'custom';
  settings: OrgSettings;
  createdAt: Date;
  updatedAt: Date;
}

interface OrgSettings {
  defaultVisibility: 'private' | 'team' | 'department' | 'org';
  requireReview: boolean;
  maxSkillSize: number;          // bytes
  allowedFileTypes: string[];
  ssoConfig: SSOConfig;
}

// Business Unit
interface BusinessUnit {
  id: string;
  orgId: string;
  name: string;                  // "Cloud Division"
  slug: string;
  parentId: string | null;       // For nested BUs
  settings: BUSettings;
  createdAt: Date;
}

// Department
interface Department {
  id: string;
  orgId: string;
  buId: string;
  name: string;                  // "Engineering"
  slug: string;
  settings: DeptSettings;
  createdAt: Date;
}

// Team
interface Team {
  id: string;
  orgId: string;
  deptId: string;
  name: string;                  // "Platform Team"
  slug: string;
  settings: TeamSettings;
  createdAt: Date;
}

// Member
interface Member {
  id: string;
  orgId: string;
  userId: string;
  role: OrgRole;
  buId?: string;
  deptId?: string;
  teamIds: string[];
  createdAt: Date;
}

type OrgRole = 'owner' | 'admin' | 'member' | 'viewer';
```

### 3.3 Tenant Isolation

**Database-Level Isolation**:
- All tables include `orgId` as part of primary key
- Row-Level Security (RLS) policies enforce tenant boundaries
- All queries automatically scoped by middleware

```sql
-- PostgreSQL Row-Level Security
CREATE POLICY tenant_isolation ON skills
  USING (org_id = current_setting('app.current_org_id')::uuid);

CREATE POLICY tenant_isolation ON members
  USING (org_id = current_setting('app.current_org_id')::uuid);
```

**Storage Isolation**:
- S3 buckets organized by org: `skills-hub-{orgId}/`
- Pre-signed URLs scoped to org prefix
- Cross-tenant access blocked at storage policy level

---

## 4. RBAC & Authorization Model

### 4.1 Role Hierarchy

```
Platform Admin (System-level)
  └── Org Owner (Tenant-level)
      └── Org Admin (Tenant-level)
          └── BU Admin (Business Unit-level)
              └── Dept Admin (Department-level)
                  └── Team Admin (Team-level)
                      └── Team Member
                          └── Viewer
```

### 4.2 Permission Matrix

| Action | Platform Admin | Org Owner | Org Admin | BU Admin | Dept Admin | Team Admin | Member | Viewer |
|--------|----------------|-----------|-----------|----------|------------|------------|--------|--------|
| Manage org settings | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |
| Manage BU structure | ✓ | ✓ | ✓ | ✓ (own BU) | ✗ | ✗ | ✗ | ✗ |
| Manage departments | ✓ | ✓ | ✓ | ✓ (own BU) | ✓ (own dept) | ✗ | ✗ | ✗ |
| Manage teams | ✓ | ✓ | ✓ | ✓ (own BU) | ✓ (own dept) | ✓ (own team) | ✗ | ✗ |
| Invite members | ✓ | ✓ | ✓ | ✓ (own BU) | ✓ (own dept) | ✓ (own team) | ✗ | ✗ |
| Publish skill (org-wide) | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |
| Publish skill (BU-wide) | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |
| Publish skill (dept-wide) | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ |
| Publish skill (team-wide) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ |
| Create draft skill | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ |
| Edit own skill | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ |
| Edit others' skill | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |
| Delete skill | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |
| Review skill | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ |
| Install skill | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| View audit logs | ✓ | ✓ | ✓ | ✓ (own BU) | ✓ (own dept) | ✓ (own team) | ✗ | ✗ |
| Manage RBAC policies | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |

### 4.3 Attribute-Based Access Control (ABAC)

RBAC is extended with attributes for fine-grained control:

```typescript
interface AccessPolicy {
  id: string;
  orgId: string;
  name: string;
  description: string;
  effect: 'allow' | 'deny';
  priority: number;              // Higher = evaluated first
  conditions: Condition[];
  actions: string[];             // ['skill:read', 'skill:write', etc.]
  resources: string[];           // ['skill:*', 'skill:finance-*', etc.]
  createdAt: Date;
}

interface Condition {
  attribute: string;             // 'user.department', 'skill.classification', 'env.time'
  operator: 'eq' | 'ne' | 'in' | 'contains' | 'regex';
  value: any;
}

// Example: Finance team can only access finance-classified skills
{
  "name": "Finance Skills Access",
  "effect": "allow",
  "conditions": [
    { "attribute": "user.department", "operator": "eq", "value": "finance" },
    { "attribute": "skill.classification", "operator": "eq", "value": "finance" }
  ],
  "actions": ["skill:read", "skill:install"],
  "resources": ["skill:*"]
}
```

### 4.4 Skill Visibility Scopes

```typescript
type SkillVisibility = 
  | 'private'        // Only creator
  | 'team'           // Creator's team
  | 'department'     // Creator's department
  | 'business_unit'  // Creator's business unit
  | 'organization'   // Entire organization
  | 'custom';        // Explicit ACL

interface SkillACL {
  skillId: string;
  visibility: SkillVisibility;
  explicitAccess: {
    userIds: string[];
    teamIds: string[];
    deptIds: string[];
    buIds: string[];
  };
}
```

---

## 5. Skill Lifecycle Management

### 5.1 Skill Format (QoderWork Compatible)

```yaml
# SKILL.md frontmatter
---
name: data-analyzer
version: 1.2.0
description: "Analyze CSV/Excel data and generate insights. Use when processing datasets."
description_zh: "分析CSV/Excel数据并生成洞察。处理数据集时使用。"
author: alice@acme.com
license: Proprietary
classification: internal        # public | internal | confidential | restricted
tags: [data, analytics, excel]
category: analytics
user-invocable: true
argument-hint: "Upload a data file"

# Enterprise-specific metadata
enterprise:
  owner: alice@acme.com
  team: data-platform
  department: engineering
  business_unit: cloud-division
  reviewStatus: approved
  reviewedBy: bob@acme.com
  reviewedAt: 2026-07-20T10:00:00Z
  securityScan: passed
  lastScanAt: 2026-07-20T09:55:00Z
  dependencies:
    - name: pandas
      version: ">=1.3.0"
      license: BSD-3-Clause
---
```

### 5.2 Skill Upload & Publishing Workflow

```
┌─────────┐
│ Creator │
└────┬────┘
     │ 1. Upload skill (.skill or SKILL.md)
     ▼
┌─────────────────┐
│ Validate Format │─── Fail ──► Reject with errors
└────────┬────────┘
         │ Pass
         ▼
┌─────────────────┐
│ Security Scan   │─── Fail ──► Quarantine + Alert
└────────┬────────┘
         │ Pass
         ▼
┌─────────────────┐
│ Dependency Scan │─── Fail ──► Quarantine + Alert
└────────┬────────┘
         │ Pass
         ▼
┌─────────────┐
│ Draft State │ (Creator can edit)
└────┬────────┘
     │ 2. Submit for review
     ▼
┌─────────────────┐
│ Review Queue    │ (Assigned reviewers based on scope)
└────────┬────────┘
         │ 3. Approve / Request changes / Reject
         ▼
┌─────────────────┐
│ Published State │ (Available per visibility scope)
└────────┬────────┘
         │ 4. New version uploaded
         ▼
┌─────────────────┐
│ Version Review  │ (Simplified if auto-approve enabled)
└────────┬────────┘
         │
         ▼
    [New version published]
```

### 5.3 Version Management

```typescript
interface SkillVersion {
  id: string;
  skillId: string;
  version: string;               // Semver: "1.2.3"
  changelog: string;
  packageUrl: string;            // S3 URL
  packageHash: string;           // SHA-256
  packageSize: number;           // bytes
  manifest: SkillManifest;
  publishedAt: Date;
  publishedBy: string;
  reviewStatus: 'pending' | 'approved' | 'rejected';
  reviewedBy?: string;
  reviewedAt?: Date;
}

interface SkillManifest {
  name: string;
  version: string;
  files: FileEntry[];
  dependencies: Dependency[];
  scripts: string[];             // scripts/ directory contents
  totalSize: number;
}

interface FileEntry {
  path: string;
  hash: string;
  size: number;
  mimeType: string;
}
```

### 5.4 Skill Discovery & Search

```typescript
// Elasticsearch index mapping
{
  "mappings": {
    "properties": {
      "name": { "type": "text", "analyzer": "standard" },
      "description": { "type": "text", "analyzer": "standard" },
      "tags": { "type": "keyword" },
      "category": { "type": "keyword" },
      "author": { "type": "keyword" },
      "team": { "type": "keyword" },
      "department": { "type": "keyword" },
      "classification": { "type": "keyword" },
      "visibility": { "type": "keyword" },
      "accessibleBy": { "type": "keyword" },  // user/team/dept IDs
      "installCount": { "type": "integer" },
      "rating": { "type": "float" },
      "createdAt": { "type": "date" },
      "updatedAt": { "type": "date" }
    }
  }
}

// Search query with tenant isolation
{
  "query": {
    "bool": {
      "must": [
        { "match": { "description": "data analysis" } }
      ],
      "filter": [
        { "term": { "orgId": "org-123" } },
        { 
          "bool": {
            "should": [
              { "term": { "accessibleBy": "user-456" } },
              { "term": { "accessibleBy": "team-789" } },
              { "term": { "accessibleBy": "dept-abc" } }
            ]
          }
        }
      ]
    }
  }
}
```

### 5.5 Skill Installation & Distribution

```typescript
// Installation flow
interface InstallRequest {
  skillId: string;
  version: string;
  targetPlatform: 'qoderwork' | 'cursor' | 'copilot';
}

// Response with signed download URL
interface InstallResponse {
  downloadUrl: string;           // Pre-signed S3 URL (15min expiry)
  packageHash: string;           // SHA-256 for integrity check
  installScript: string;         // Platform-specific install script
  metadata: SkillMetadata;
}

// Pre-signed URL generation (S3)
async function generateDownloadUrl(skillId: string, version: string, orgId: string): Promise<string> {
  const key = `${orgId}/skills/${skillId}/${version}/package.skill`;
  
  const command = new GetObjectCommand({
    Bucket: process.env.S3_BUCKET,
    Key: key,
    ResponseContentType: 'application/octet-stream',
  });
  
  return getSignedUrl(s3Client, command, { expiresIn: 900 }); // 15 minutes
}
```

---

## 6. API Design

### 6.1 tRPC Router Structure

```typescript
// server/routers/_app.ts
import { router } from '../trpc';
import { authRouter } from './auth';
import { orgRouter } from './org';
import { skillRouter } from './skill';
import { reviewRouter } from './review';
import { auditRouter } from './audit';

export const appRouter = router({
  auth: authRouter,
  org: orgRouter,
  skill: skillRouter,
  review: reviewRouter,
  audit: auditRouter,
});

export type AppRouter = typeof appRouter;
```

### 6.2 Key API Endpoints

#### Authentication

```typescript
// POST /api/auth/sso/login
// Initiate SSO login
{
  "orgSlug": "acme-corp",
  "redirectUri": "https://skills.acme.com/callback"
}

// POST /api/auth/sso/callback
// Handle SSO callback
{
  "code": "auth-code-from-idp",
  "state": "csrf-token"
}

// Response
{
  "accessToken": "jwt-token",
  "refreshToken": "refresh-token",
  "expiresIn": 3600,
  "user": {
    "id": "user-123",
    "email": "alice@acme.com",
    "name": "Alice Chen",
    "orgId": "org-456"
  }
}
```

#### Organization Management

```typescript
// GET /api/org/hierarchy
// Get full org hierarchy
{
  "org": {
    "id": "org-456",
    "name": "Acme Corp",
    "businessUnits": [
      {
        "id": "bu-1",
        "name": "Cloud Division",
        "departments": [
          {
            "id": "dept-1",
            "name": "Engineering",
            "teams": [
              {
                "id": "team-1",
                "name": "Platform Team",
                "memberCount": 12
              }
            ]
          }
        ]
      }
    ]
  }
}

// POST /api/org/teams
// Create new team
{
  "name": "AI Team",
  "departmentId": "dept-1",
  "settings": {
    "defaultVisibility": "team",
    "requireReview": true
  }
}
```

#### Skill Management

```typescript
// POST /api/skill/upload
// Upload skill package (multipart/form-data)
// Headers: Authorization: Bearer <token>
// Body: file=@skill.skill, metadata=@metadata.json

// Response
{
  "skillId": "skill-789",
  "version": "1.0.0",
  "status": "pending_review",
  "validationResults": {
    "format": "passed",
    "security": "passed",
    "dependencies": "passed"
  }
}

// GET /api/skill/search
// Search skills
// Query: ?q=data+analysis&category=analytics&tags=excel,csv

{
  "results": [
    {
      "id": "skill-789",
      "name": "data-analyzer",
      "description": "Analyze CSV/Excel data...",
      "version": "1.2.0",
      "author": "alice@acme.com",
      "team": "data-platform",
      "classification": "internal",
      "installCount": 45,
      "rating": 4.5,
      "updatedAt": "2026-07-20T10:00:00Z"
    }
  ],
  "total": 12,
  "page": 1,
  "pageSize": 20
}

// GET /api/skill/:id/download
// Download skill package
// Response: 302 redirect to pre-signed S3 URL

// POST /api/skill/:id/versions
// Publish new version
{
  "version": "1.3.0",
  "changelog": "Added support for JSON files",
  "packageUrl": "https://storage..."
}
```

#### Review Workflow

```typescript
// GET /api/review/pending
// Get pending reviews for current user
{
  "reviews": [
    {
      "id": "review-1",
      "skillId": "skill-789",
      "skillName": "data-analyzer",
      "version": "1.2.0",
      "submittedBy": "alice@acme.com",
      "submittedAt": "2026-07-20T10:00:00Z",
      "priority": "normal",
      "classification": "internal"
    }
  ]
}

// POST /api/review/:id/approve
{
  "comment": "Looks good, approved for org-wide access",
  "visibility": "organization"
}

// POST /api/review/:id/request-changes
{
  "comment": "Please add error handling for large files",
  "requiredChanges": [
    "Add file size validation",
    "Update description to mention size limits"
  ]
}
```

#### Audit Logs

```typescript
// GET /api/audit/logs
// Query audit logs
// Query: ?action=skill.publish&userId=user-123&startDate=2026-07-01

{
  "logs": [
    {
      "id": "log-1",
      "timestamp": "2026-07-20T10:05:00Z",
      "actor": {
        "id": "user-123",
        "email": "alice@acme.com",
        "ip": "192.168.1.100"
      },
      "action": "skill.publish",
      "resource": {
        "type": "skill",
        "id": "skill-789",
        "name": "data-analyzer"
      },
      "details": {
        "version": "1.2.0",
        "visibility": "organization"
      },
      "result": "success"
    }
  ],
  "total": 156,
  "page": 1
}
```

---

## 7. Data Model

### 7.1 Prisma Schema

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============ Organization ============

model Organization {
  id        String   @id @default(uuid())
  name      String
  slug      String   @unique
  domain    String   @unique
  plan      String   @default("enterprise")
  settings  Json     @default("{}")
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  businessUnits BusinessUnit[]
  members       Member[]
  skills        Skill[]
  roles         Role[]
  policies      AccessPolicy[]
  
  @@map("organizations")
}

model BusinessUnit {
  id        String   @id @default(uuid())
  orgId     String
  name      String
  slug      String
  parentId  String?
  settings  Json     @default("{}")
  createdAt DateTime @default(now())
  
  org         Organization   @relation(fields: [orgId], references: [id])
  parent      BusinessUnit?  @relation("BUParent", fields: [parentId], references: [id])
  children    BusinessUnit[] @relation("BUParent")
  departments Department[]
  members     Member[]
  skills      Skill[]
  
  @@unique([orgId, slug])
  @@map("business_units")
}

model Department {
  id        String   @id @default(uuid())
  orgId     String
  buId      String
  name      String
  slug      String
  settings  Json     @default("{}")
  createdAt DateTime @default(now())
  
  org    Organization @relation(fields: [orgId], references: [id])
  bu     BusinessUnit @relation(fields: [buId], references: [id])
  teams  Team[]
  members Member[]
  skills  Skill[]
  
  @@unique([orgId, slug])
  @@map("departments")
}

model Team {
  id        String   @id @default(uuid())
  orgId     String
  deptId    String
  name      String
  slug      String
  settings  Json     @default("{}")
  createdAt DateTime @default(now())
  
  org     Organization @relation(fields: [orgId], references: [id])
  dept    Department   @relation(fields: [deptId], references: [id])
  members Member[]
  skills  Skill[]
  
  @@unique([orgId, slug])
  @@map("teams")
}

// ============ Users & Roles ============

model User {
  id        String   @id @default(uuid())
  email     String   @unique
  name      String
  avatarUrl String?
  ssoId     String?  @unique
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  members Member[]
  
  @@map("users")
}

model Member {
  id        String   @id @default(uuid())
  orgId     String
  userId    String
  role      String   @default("member")  // owner, admin, member, viewer
  buId      String?
  deptId    String?
  teamIds   String[] @default([])
  createdAt DateTime @default(now())
  
  org  Organization @relation(fields: [orgId], references: [id])
  user User         @relation(fields: [userId], references: [id])
  bu   BusinessUnit? @relation(fields: [buId], references: [id])
  dept Department?  @relation(fields: [deptId], references: [id])
  
  @@unique([orgId, userId])
  @@map("members")
}

model Role {
  id          String   @id @default(uuid())
  orgId       String
  name        String
  description String?
  permissions String[]
  isSystem    Boolean  @default(false)
  createdAt   DateTime @default(now())
  
  org Organization @relation(fields: [orgId], references: [id])
  
  @@unique([orgId, name])
  @@map("roles")
}

model AccessPolicy {
  id          String   @id @default(uuid())
  orgId       String
  name        String
  description String?
  effect      String   // allow, deny
  priority    Int      @default(0)
  conditions  Json
  actions     String[]
  resources   String[]
  createdAt   DateTime @default(now())
  
  org Organization @relation(fields: [orgId], references: [id])
  
  @@map("access_policies")
}

// ============ Skills ============

model Skill {
  id              String   @id @default(uuid())
  orgId           String
  name            String
  description     String
  descriptionZh   String?
  authorId        String
  teamId          String?
  deptId          String?
  buId            String?
  visibility      String   @default("private")
  classification  String   @default("internal")
  tags            String[] @default([])
  category        String?
  installCount    Int      @default(0)
  rating          Float    @default(0)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  org        Organization   @relation(fields: [orgId], references: [id])
  author     User           @relation(fields: [authorId], references: [id])
  team       Team?          @relation(fields: [teamId], references: [id])
  dept       Department?    @relation(fields: [deptId], references: [id])
  bu         BusinessUnit?  @relation(fields: [buId], references: [id])
  versions   SkillVersion[]
  acl        SkillACL?
  reviews    SkillReview[]
  
  @@unique([orgId, name])
  @@map("skills")
}

model SkillVersion {
  id            String   @id @default(uuid())
  skillId       String
  version       String
  changelog     String?
  packageUrl    String
  packageHash   String
  packageSize   Int
  manifest      Json
  publishedAt   DateTime @default(now())
  publishedBy   String
  reviewStatus  String   @default("pending")
  reviewedBy    String?
  reviewedAt    DateTime?
  
  skill Skill @relation(fields: [skillId], references: [id], onDelete: Cascade)
  
  @@unique([skillId, version])
  @@map("skill_versions")
}

model SkillACL {
  id            String   @id @default(uuid())
  skillId       String   @unique
  visibility    String
  explicitUsers String[] @default([])
  explicitTeams String[] @default([])
  explicitDepts String[] @default([])
  explicitBUs   String[] @default([])
  
  skill Skill @relation(fields: [skillId], references: [id], onDelete: Cascade)
  
  @@map("skill_acls")
}

model SkillReview {
  id          String   @id @default(uuid())
  skillId     String
  versionId   String
  reviewerId  String
  status      String   // pending, approved, rejected, changes_requested
  comment     String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  skill Skill @relation(fields: [skillId], references: [id], onDelete: Cascade)
  
  @@map("skill_reviews")
}

// ============ Audit ============

model AuditLog {
  id         String   @id @default(uuid())
  orgId      String
  timestamp  DateTime @default(now())
  actorId    String
  actorEmail String
  actorIp    String
  action     String
  resource   Json
  details    Json?
  result     String   // success, failure
  
  @@index([orgId, timestamp])
  @@index([actorId])
  @@index([action])
  @@map("audit_logs")
}
```

---

## 8. Security Design (L4 Compliance)

### 8.1 Authentication

#### 8.1.1 SSO Integration

```typescript
// OIDC Configuration
interface OIDCConfig {
  issuer: string;                // "https://idp.acme.com"
  clientId: string;
  clientSecret: string;
  authorizationEndpoint: string;
  tokenEndpoint: string;
  userinfoEndpoint: string;
  jwksUri: string;
  scopes: string[];              // ["openid", "profile", "email"]
  redirectUri: string;
}

// SAML 2.0 Configuration
interface SAMLConfig {
  entryPoint: string;            // "https://idp.acme.com/saml/sso"
  issuer: string;
  cert: string;                  // IDP certificate (PEM)
  privateKey: string;            // SP private key (PEM)
  callbackUrl: string;
  audience: string;
}
```

#### 8.1.2 JWT Token Management

```typescript
// JWT payload structure
interface JWTPayload {
  sub: string;                   // User ID
  email: string;
  orgId: string;
  role: string;
  iat: number;
  exp: number;                   // 1 hour
  jti: string;                   // Unique token ID (for revocation)
}

// Token refresh flow
// Access token: 1 hour expiry
// Refresh token: 30 days expiry, stored in httpOnly cookie
// Token rotation on refresh (old refresh token invalidated)
```

### 8.2 Encryption

#### 8.2.1 Data at Rest

```typescript
// PostgreSQL TDE (Transparent Data Encryption)
// Enable at database level
ALTER SYSTEM SET encryption_key_id = 'aws:kms:key-id';

// Sensitive columns encrypted at application level
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

class EncryptionService {
  private algorithm = 'aes-256-gcm';
  private key: Buffer;           // From KMS
  
  encrypt(plaintext: string): { ciphertext: string; iv: string; tag: string } {
    const iv = randomBytes(16);
    const cipher = createCipheriv(this.algorithm, this.key, iv);
    
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return {
      ciphertext: encrypted,
      iv: iv.toString('hex'),
      tag: cipher.getAuthTag().toString('hex')
    };
  }
  
  decrypt(data: { ciphertext: string; iv: string; tag: string }): string {
    const decipher = createDecipheriv(
      this.algorithm,
      this.key,
      Buffer.from(data.iv, 'hex')
    );
    
    decipher.setAuthTag(Buffer.from(data.tag, 'hex'));
    
    let decrypted = decipher.update(data.ciphertext, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
}

// Encrypted fields:
// - User.email (PII)
// - Skill.metadata (if classification = confidential)
// - AuditLog.details (if contains sensitive data)
```

#### 8.2.2 Data in Transit

```typescript
// TLS 1.3 enforced
// nginx.conf
server {
    listen 443 ssl http2;
    
    ssl_protocols TLSv1.3;
    ssl_ciphers 'TLS_AES_128_GCM_SHA256:TLS_AES_256_GCM_SHA384';
    ssl_prefer_server_ciphers off;
    
    # HSTS
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
    
    # Certificate pinning (optional)
    add_header Public-Key-Pins 'pin-sha256="..."; max-age=5184000; includeSubDomains';
}

// Internal service communication (mTLS)
// All Kubernetes services use mutual TLS via Istio/Linkerd
```

### 8.3 Audit Logging

#### 8.3.1 Immutable Audit Log

```typescript
// Audit log structure
interface AuditLogEntry {
  id: string;                    // UUID
  timestamp: string;             // ISO 8601
  actor: {
    id: string;
    email: string;
    ip: string;
    userAgent: string;
  };
  action: string;                // "skill.publish", "user.invite", etc.
  resource: {
    type: string;                // "skill", "user", "org"
    id: string;
    name: string;
  };
  details: Record<string, any>;
  result: 'success' | 'failure';
  signature: string;             // HMAC-SHA256 for tamper detection
}

// Tamper-evident logging
class AuditLogger {
  private hmacKey: Buffer;       // From KMS
  
  async log(entry: Omit<AuditLogEntry, 'signature'>): Promise<void> {
    const signature = this.sign(entry);
    const fullEntry = { ...entry, signature };
    
    // Write to database
    await db.auditLog.create({ data: fullEntry });
    
    // Write to append-only log file (S3 Object Lock)
    await this.appendToS3Log(fullEntry);
    
    // Stream to SIEM
    await this.streamToSIEM(fullEntry);
  }
  
  private sign(entry: Omit<AuditLogEntry, 'signature'>): string {
    const hmac = createHmac('sha256', this.hmacKey);
    hmac.update(JSON.stringify(entry));
    return hmac.digest('hex');
  }
  
  private async appendToS3Log(entry: AuditLogEntry): Promise<void> {
    const date = new Date().toISOString().split('T')[0];
    const key = `audit-logs/${date}/${entry.id}.json`;
    
    await s3.putObject({
      Bucket: process.env.AUDIT_BUCKET,
      Key: key,
      Body: JSON.stringify(entry),
      // S3 Object Lock prevents deletion/modification
      ObjectLockMode: 'GOVERNANCE',
      ObjectLockRetainUntilDate: new Date(Date.now() + 7 * 365 * 24 * 60 * 60 * 1000) // 7 years
    });
  }
}

// Audit log actions
const AUDIT_ACTIONS = {
  // Auth
  'auth.login': 'User login',
  'auth.logout': 'User logout',
  'auth.failed': 'Failed login attempt',
  
  // User management
  'user.invite': 'User invited',
  'user.remove': 'User removed',
  'user.role.change': 'User role changed',
  
  // Skill lifecycle
  'skill.create': 'Skill created',
  'skill.update': 'Skill updated',
  'skill.delete': 'Skill deleted',
  'skill.publish': 'Skill published',
  'skill.download': 'Skill downloaded',
  'skill.install': 'Skill installed',
  
  // Review
  'review.submit': 'Review submitted',
  'review.approve': 'Review approved',
  'review.reject': 'Review rejected',
  
  // Admin
  'org.settings.update': 'Org settings updated',
  'policy.create': 'Access policy created',
  'policy.update': 'Access policy updated',
} as const;
```

### 8.4 Secrets Management

```typescript
// Secrets stored in Kubernetes Secrets + external KMS
// Never stored in code or environment variables

// Example: AWS Secrets Manager integration
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

class SecretsManager {
  private client: SecretsManagerClient;
  private cache: Map<string, { value: string; expiry: number }> = new Map();
  
  async getSecret(secretId: string): Promise<string> {
    // Check cache
    const cached = this.cache.get(secretId);
    if (cached && cached.expiry > Date.now()) {
      return cached.value;
    }
    
    // Fetch from AWS Secrets Manager
    const command = new GetSecretValueCommand({ SecretId: secretId });
    const response = await this.client.send(command);
    
    const value = response.SecretString!;
    
    // Cache for 5 minutes
    this.cache.set(secretId, {
      value,
      expiry: Date.now() + 5 * 60 * 1000
    });
    
    return value;
  }
}

// Usage
const dbPassword = await secretsManager.getSecret('skills-hub/database/password');
const s3AccessKey = await secretsManager.getSecret('skills-hub/s3/access-key');
```

### 8.5 Vulnerability Management

#### 8.5.1 Skill Security Scanning

```typescript
// Automated security scan on upload
class SkillSecurityScanner {
  async scan(skillPackage: SkillPackage): Promise<ScanResult> {
    const results: ScanResult = {
      passed: true,
      findings: [],
      scannedAt: new Date()
    };
    
    // 1. Static analysis
    const staticResults = await this.staticAnalysis(skillPackage);
    results.findings.push(...staticResults);
    
    // 2. Dependency vulnerability scan
    const depResults = await this.dependencyScan(skillPackage);
    results.findings.push(...depResults);
    
    // 3. Malicious code detection
    const malwareResults = await this.malwareDetection(skillPackage);
    results.findings.push(...malwareResults);
    
    // 4. Data exfiltration check
    const exfilResults = await this.dataExfiltrationCheck(skillPackage);
    results.findings.push(...exfilResults);
    
    results.passed = results.findings.every(f => f.severity !== 'critical');
    
    return results;
  }
  
  private async staticAnalysis(pkg: SkillPackage): Promise<Finding[]> {
    const findings: Finding[] = [];
    
    // Check for dangerous patterns
    const dangerousPatterns = [
      { pattern: /eval\(/, severity: 'high', message: 'Use of eval() detected' },
      { pattern: /exec\(/, severity: 'high', message: 'Use of exec() detected' },
      { pattern: /child_process/, severity: 'high', message: 'Child process usage detected' },
      { pattern: /process\.env/, severity: 'medium', message: 'Environment variable access' },
      { pattern: /fetch\(|axios|http/, severity: 'low', message: 'Network access detected' }
    ];
    
    for (const file of pkg.files) {
      if (file.path.endsWith('.js') || file.path.endsWith('.ts')) {
        const content = file.content;
        
        for (const { pattern, severity, message } of dangerousPatterns) {
          if (pattern.test(content)) {
            findings.push({
              severity,
              message,
              file: file.path,
              line: this.findLineNumber(content, pattern)
            });
          }
        }
      }
    }
    
    return findings;
  }
  
  private async dependencyScan(pkg: SkillPackage): Promise<Finding[]> {
    // Check dependencies against known vulnerability databases
    // Uses npm audit, Snyk, or similar
    // ...
  }
  
  private async malwareDetection(pkg: SkillPackage): Promise<Finding[]> {
    // Heuristic-based detection
    // - Obfuscated code
    // - Suspicious string patterns
    // - Known malware signatures
    // ...
  }
  
  private async dataExfiltrationCheck(pkg: SkillPackage): Promise<Finding[]> {
    // Check for data exfiltration patterns
    // - Sending user data to external endpoints
    // - Accessing sensitive files
    // ...
  }
}
```

### 8.6 Data Classification & DLP

#### 8.6.1 Classification Levels

```typescript
enum DataClassification {
  PUBLIC = 'public',             // No restrictions
  INTERNAL = 'internal',         // Internal use only
  CONFIDENTIAL = 'confidential', // Restricted access
  RESTRICTED = 'restricted'      // Highly restricted (PII, financial, etc.)
}

// Classification rules
const CLASSIFICATION_RULES = {
  [DataClassification.PUBLIC]: {
    visibility: ['public', 'org'],
    requiresReview: false,
    encryptionAtRest: false,
    auditLevel: 'basic'
  },
  [DataClassification.INTERNAL]: {
    visibility: ['org', 'bu', 'dept', 'team'],
    requiresReview: true,
    encryptionAtRest: false,
    auditLevel: 'standard'
  },
  [DataClassification.CONFIDENTIAL]: {
    visibility: ['team', 'dept'],
    requiresReview: true,
    encryptionAtRest: true,
    auditLevel: 'detailed',
    watermarked: true
  },
  [DataClassification.RESTRICTED]: {
    visibility: ['private'],
    requiresReview: true,
    encryptionAtRest: true,
    auditLevel: 'full',
    watermarked: true,
    dlpScanned: true
  }
};
```

#### 8.6.2 DLP Scanning

```typescript
class DLPScanner {
  async scan(content: string): Promise<DLPResult> {
    const findings: DLPFinding[] = [];
    
    // PII detection
    const ssnPattern = /\b\d{3}-\d{2}-\d{4}\b/;
    const creditCardPattern = /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/;
    const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/;
    
    if (ssnPattern.test(content)) {
      findings.push({
        type: 'SSN',
        severity: 'critical',
        message: 'Social Security Number detected'
      });
    }
    
    if (creditCardPattern.test(content)) {
      findings.push({
        type: 'CREDIT_CARD',
        severity: 'critical',
        message: 'Credit card number detected'
      });
    }
    
    // API key detection
    const apiKeyPatterns = [
      /AKIA[0-9A-Z]{16}/,        // AWS Access Key
      /ghp_[a-zA-Z0-9]{36}/,    // GitHub Personal Access Token
      /sk-[a-zA-Z0-9]{48}/,     // OpenAI API Key
    ];
    
    for (const pattern of apiKeyPatterns) {
      if (pattern.test(content)) {
        findings.push({
          type: 'API_KEY',
          severity: 'high',
          message: 'API key or secret detected'
        });
      }
    }
    
    return {
      passed: findings.every(f => f.severity !== 'critical'),
      findings
    };
  }
}
```

### 8.7 Threat Modeling

#### 8.7.1 STRIDE Analysis

| Threat | Mitigation |
|--------|------------|
| **Spoofing** (fake identity) | SSO with MFA, JWT signature validation, IP allowlisting |
| **Tampering** (modify data) | HMAC signatures on audit logs, S3 Object Lock, database RLS |
| **Repudiation** (deny actions) | Immutable audit logs with tamper-evident signatures |
| **Information Disclosure** | Encryption at rest/transit, RLS, pre-signed URLs with expiry |
| **Denial of Service** | Rate limiting (Redis), WAF, Kubernetes HPA auto-scaling |
| **Elevation of Privilege** | RBAC/ABAC, principle of least privilege, regular access reviews |

#### 8.7.2 Attack Vectors & Defenses

```typescript
// 1. Skill injection attack
// Attacker uploads skill with malicious code
// Defense: Sandboxed execution, static analysis, dependency scanning

// 2. Supply chain attack
// Attacker compromises popular skill dependencies
// Defense: Dependency pinning, vulnerability scanning, lockfile verification

// 3. Privilege escalation
// Attacker exploits RBAC bug to gain admin access
// Defense: Regular access reviews, ABAC policies, audit logging

// 4. Data exfiltration
// Attacker uploads skill that exfiltrates data
// Defense: DLP scanning, network egress filtering, sandboxing

// 5. Account takeover
// Attacker compromises user account via phishing
// Defense: MFA enforcement, anomaly detection, session management
```

### 8.8 Compliance Framework

#### 8.8.1 SOC2 Type II Controls

```typescript
// CC6.1: Logical and physical access controls
const CC6_1 = {
  'SSO Integration': 'OIDC/SAML 2.0 with MFA',
  'RBAC': 'Role-based + attribute-based access control',
  'Session Management': 'JWT with 1-hour expiry, refresh token rotation',
  'Password Policy': 'N/A (SSO only)',
  'Access Review': 'Quarterly access reviews with automated reminders'
};

// CC6.6: Protection against malicious code
const CC6_6 = {
  'Skill Scanning': 'Automated security scan on upload',
  'Dependency Scanning': 'npm audit + Snyk integration',
  'Sandboxing': 'Skills executed in isolated containers',
  'Code Review': 'Mandatory review for org-wide skills'
};

// CC7.2: Monitoring for security events
const CC7_2 = {
  'Audit Logging': 'Immutable audit logs with 7-year retention',
  'SIEM Integration': 'Real-time streaming to SIEM (Splunk/Datadog)',
  'Alerting': 'Automated alerts for suspicious activities',
  'Incident Response': 'Documented IR playbook with 24/7 on-call'
};
```

#### 8.8.2 ISO 27001 Controls

```typescript
// A.9 Access Control
const A9 = {
  'A.9.1': 'Business requirement for access control',
  'A.9.2': 'User access management (SSO + RBAC)',
  'A.9.3': 'User responsibilities (ToS + training)',
  'A.9.4': 'System access control (MFA + session mgmt)'
};

// A.10 Cryptography
const A10 = {
  'A.10.1': 'Cryptographic controls (TLS 1.3, AES-256)',
  'A.10.2': 'Key management (AWS KMS)'
};

// A.12 Operations Security
const A12 = {
  'A.12.1': 'Operational procedures (runbooks)',
  'A.12.2': 'Protection from malware (skill scanning)',
  'A.12.4': 'Logging and monitoring (audit logs + SIEM)'
};

// A.16 Incident Management
const A16 = {
  'A.16.1': 'Incident management planning (IR playbook)',
  'A.16.2': 'Security events reporting (24/7 on-call)'
};
```

### 8.9 Incident Response

```typescript
// Incident response playbook
interface IncidentResponsePlan {
  phases: {
    preparation: {
      tools: ['SIEM', 'PagerDuty', 'Slack IR channel'];
      team: ['Security Lead', 'DevOps Lead', 'Legal'];
      training: 'Quarterly tabletop exercises';
    };
    detection: {
      alerts: [
        'Failed login spike (>10 in 5min)',
        'Unusual skill download pattern',
        'Privilege escalation attempt',
        'Data exfiltration detected'
      ];
      triage: 'Auto-assign to on-call based on alert type';
    };
    containment: {
      immediate: [
        'Disable compromised account',
        'Revoke active sessions',
        'Quarantine malicious skill'
      ];
      shortTerm: [
        'Block IP range',
        'Enable enhanced logging',
        'Notify affected users'
      ];
    };
    eradication: [
      'Remove malicious code',
      'Patch vulnerability',
      'Reset compromised credentials'
    ];
    recovery: [
      'Restore from backup',
      'Re-enable services',
      'Monitor for recurrence'
    ];
    postIncident: [
      'Conduct post-mortem',
      'Update runbooks',
      'Implement preventive measures'
    ];
  };
  
  sla: {
    detection: '< 15 minutes';
    response: '< 1 hour';
    containment: '< 4 hours';
    resolution: '< 24 hours';
  };
  
  communication: {
    internal: 'Slack #incident-response';
    management: 'Email + SMS for P1 incidents';
    customers: 'Status page + email within 24 hours';
    regulators: 'As required by compliance (72 hours for GDPR)';
  };
}
```

---

## 9. File Storage & Distribution

### 9.1 S3 Storage Architecture

```typescript
// Bucket structure
// skills-hub-prod/
// ├── {orgId-1}/
// │   ├── skills/
// │   │   ├── {skillId}/
// │   │   │   ├── {version}/
// │   │   │   │   ├── package.skill          # Skill package (zip)
// │   │   │   │   ├── manifest.json          # Skill manifest
// │   │   │   │   └── scan-results.json      # Security scan results
// │   │   │   └── latest/                    # Symlink to latest version
// │   │   └── ...
// │   ├── attachments/                       # Skill attachments (icons, screenshots)
// │   └── exports/                           # Exported skill bundles
// └── {orgId-2}/
//     └── ...

// Upload flow
class SkillStorageService {
  async uploadSkillPackage(
    orgId: string,
    skillId: string,
    version: string,
    file: Buffer
  ): Promise<StorageResult> {
    const key = `${orgId}/skills/${skillId}/${version}/package.skill`;
    const hash = crypto.createHash('sha256').update(file).digest('hex');
    
    // Upload to S3
    await this.s3.putObject({
      Bucket: process.env.S3_BUCKET,
      Key: key,
      Body: file,
      ContentType: 'application/octet-stream',
      Metadata: {
        'x-skill-hash': hash,
        'x-skill-size': file.length.toString()
      },
      // Server-side encryption
      ServerSideEncryption: 'aws:kms',
      SSEKMSKeyId: process.env.S3_KMS_KEY_ID
    });
    
    // Update latest symlink
    const latestKey = `${orgId}/skills/${skillId}/latest/package.skill`;
    await this.s3.copyObject({
      Bucket: process.env.S3_BUCKET,
      CopySource: `${process.env.S3_BUCKET}/${key}`,
      Key: latestKey
    });
    
    return { key, hash, size: file.length };
  }
  
  async generateDownloadUrl(
    orgId: string,
    skillId: string,
    version: string,
    userId: string
  ): Promise<string> {
    const key = `${orgId}/skills/${skillId}/${version}/package.skill`;
    
    // Generate pre-signed URL (15min expiry)
    const command = new GetObjectCommand({
      Bucket: process.env.S3_BUCKET,
      Key: key,
      ResponseContentType: 'application/octet-stream',
      ResponseContentDisposition: `attachment; filename="${skillId}-${version}.skill"`
    });
    
    const url = await getSignedUrl(this.s3, command, { expiresIn: 900 });
    
    // Log download
    await this.auditLogger.log({
      action: 'skill.download',
      actor: { id: userId },
      resource: { type: 'skill', id: skillId, version }
    });
    
    return url;
  }
}
```

### 9.2 Integrity Verification

```typescript
// Client-side verification after download
async function verifySkillIntegrity(
  filePath: string,
  expectedHash: string
): Promise<boolean> {
  const fileBuffer = await fs.readFile(filePath);
  const actualHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
  
  return actualHash === expectedHash;
}

// Installation script with verification
#!/bin/bash
# install-skill.sh

SKILL_URL="$1"
EXPECTED_HASH="$2"
SKILL_NAME="$3"

# Download
curl -s -L -o "/tmp/${SKILL_NAME}.skill" "$SKILL_URL"

# Verify hash
ACTUAL_HASH=$(shasum -a 256 "/tmp/${SKILL_NAME}.skill" | cut -d' ' -f1)

if [ "$ACTUAL_HASH" != "$EXPECTED_HASH" ]; then
  echo "ERROR: Integrity check failed"
  echo "Expected: $EXPECTED_HASH"
  echo "Actual: $ACTUAL_HASH"
  exit 1
fi

# Extract to skills directory
unzip -q "/tmp/${SKILL_NAME}.skill" -d ~/.qoderworkcn/skills/

echo "Skill installed successfully"
```

---

## 10. Monitoring & Observability

### 10.1 Metrics

```typescript
// Prometheus metrics
const metrics = {
  // Application metrics
  skill_uploads_total: 'Counter of skill uploads',
  skill_downloads_total: 'Counter of skill downloads',
  skill_installs_total: 'Counter of skill installations',
  review_requests_total: 'Counter of review requests',
  
  // Performance metrics
  http_request_duration_seconds: 'Histogram of HTTP request durations',
  database_query_duration_seconds: 'Histogram of DB query durations',
  s3_upload_duration_seconds: 'Histogram of S3 upload durations',
  
  // Security metrics
  auth_failures_total: 'Counter of authentication failures',
  authorization_denials_total: 'Counter of authorization denials',
  security_scan_findings_total: 'Counter of security scan findings',
  
  // Business metrics
  active_users: 'Gauge of active users',
  active_skills: 'Gauge of active skills',
  organizations_total: 'Gauge of organizations'
};
```

### 10.2 Logging

```typescript
// Structured logging (JSON)
import pino from 'pino';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  formatters: {
    level: (label) => ({ level: label }),
  },
  timestamp: () => `,"timestamp":"${new Date().toISOString()}"`
});

// Example log entry
logger.info({
  event: 'skill.publish',
  skillId: 'skill-123',
  version: '1.2.0',
  userId: 'user-456',
  orgId: 'org-789',
  duration: 245
});
```

### 10.3 Distributed Tracing

```typescript
// OpenTelemetry integration
import { trace } from '@opentelemetry/api';

const tracer = trace.getTracer('skills-hub');

async function publishSkill(skillId: string, version: string) {
  const span = tracer.startSpan('publishSkill');
  
  try {
    await tracer.startActiveSpan('validate', async (childSpan) => {
      await validateSkill(skillId);
      childSpan.end();
    });
    
    await tracer.startActiveSpan('scan', async (childSpan) => {
      await scanSkill(skillId);
      childSpan.end();
    });
    
    await tracer.startActiveSpan('upload', async (childSpan) => {
      await uploadToS3(skillId, version);
      childSpan.end();
    });
    
    span.setStatus({ code: SpanStatusCode.OK });
  } catch (error) {
    span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
    span.recordException(error);
    throw error;
  } finally {
    span.end();
  }
}
```

---

## 11. Implementation Roadmap

### Phase 1: Foundation (Weeks 1-4)

**Week 1-2: Core Infrastructure**
- [ ] Project setup (Next.js, TypeScript, Prisma)
- [ ] Database schema migration
- [ ] Authentication service (SSO integration)
- [ ] Basic RBAC implementation
- [ ] Docker + Kubernetes deployment

**Week 3-4: Basic Skill Management**
- [ ] Skill upload/publish API
- [ ] S3 storage integration
- [ ] Skill versioning
- [ ] Basic search (PostgreSQL full-text)
- [ ] Web UI for skill browser

### Phase 2: Organization & Collaboration (Weeks 5-8)

**Week 5-6: Org Hierarchy**
- [ ] Multi-level org structure
- [ ] Team/department/BU management
- [ ] Member provisioning
- [ ] Tenant isolation (RLS)

**Week 7-8: Review Workflow**
- [ ] Review queue management
- [ ] Approval workflow
- [ ] Notification service
- [ ] Skill visibility scopes

### Phase 3: Security & Compliance (Weeks 9-12)

**Week 9-10: L4 Security**
- [ ] Audit logging (immutable)
- [ ] Encryption at rest/transit
- [ ] Secrets management
- [ ] Skill security scanning
- [ ] DLP scanning

**Week 11-12: Compliance**
- [ ] SOC2 controls implementation
- [ ] ISO 27001 controls
- [ ] Threat modeling documentation
- [ ] Incident response playbook
- [ ] Compliance reporting

### Phase 4: Advanced Features (Weeks 13-16)

**Week 13-14: Discovery & Analytics**
- [ ] Elasticsearch integration
- [ ] Advanced search/filters
- [ ] Usage analytics
- [ ] Recommendation engine

**Week 15-16: Enterprise Features**
- [ ] Custom RBAC policies (ABAC)
- [ ] Skill dependencies management
- [ ] Bulk operations
- [ ] API rate limiting
- [ ] Multi-region deployment

### Phase 5: Polish & Launch (Weeks 17-20)

**Week 17-18: Testing & Hardening**
- [ ] Load testing
- [ ] Security penetration testing
- [ ] Disaster recovery testing
- [ ] Performance optimization

**Week 19-20: Documentation & Training**
- [ ] User documentation
- [ ] Admin documentation
- [ ] API documentation
- [ ] Training materials
- [ ] Launch preparation

---

## 12. Frontend Architecture & UI Design

### 12.1 Application Shell & Layout

```
┌──────────────────────────────────────────────────────────────────────┐
│  TopBar: Logo | Global Search (⌘K) | Notifications | User Avatar    │
├──────────┬───────────────────────────────────────────────────────────┤
│          │                                                           │
│  Side    │              Main Content Area                            │
│  Nav     │                                                           │
│          │  ┌─────────────────────────────────────────────────────┐  │
│ ┌──────┐ │  │                                                     │  │
│ │Home  │ │  │   Page-specific content rendered here               │  │
│ ├──────┤ │  │                                                     │  │
│ │Skills│ │  │   - Skill browser / detail / editor                 │  │
│ ├──────┤ │  │   - Admin dashboard                                 │  │
│ │Org   │ │  │   - Review console                                  │  │
│ ├──────┤ │  │   - Analytics                                       │  │
│ │Review│ │  │                                                     │  │
│ ├──────┤ │  └─────────────────────────────────────────────────────┘  │
│ │Analyt│ │                                                           │
│ ├──────┤ │  ┌─────────────────────────────────────────────────────┐  │
│ │Admin │ │  │  Breadcrumb: Org > Engineering > Platform > Skills  │  │
│ ├──────┤ │  └─────────────────────────────────────────────────────┘  │
│ │Audit │ │                                                           │
│ └──────┘ │                                                           │
└──────────┴───────────────────────────────────────────────────────────┘
```

### 12.2 Page Inventory

| Route | Component | Auth | Description |
|-------|-----------|------|-------------|
| `/` | `DashboardPage` | Member | Personal dashboard: recent skills, pending reviews, activity feed |
| `/skills` | `SkillBrowserPage` | Viewer | Searchable skill catalog with filters |
| `/skills/[id]` | `SkillDetailPage` | Viewer (scoped) | Skill detail: versions, install stats, reviews |
| `/skills/new` | `SkillEditorPage` | Member | Web-based SKILL.md editor with live preview |
| `/skills/[id]/edit` | `SkillEditorPage` | Author/Admin | Edit existing skill |
| `/skills/[id]/versions` | `SkillVersionsPage` | Viewer (scoped) | Version history with diff view |
| `/review` | `ReviewConsolePage` | Reviewer+ | Pending reviews queue with approve/reject actions |
| `/review/[id]` | `ReviewDetailPage` | Reviewer+ | Detailed review with security scan results |
| `/org` | `OrgHierarchyPage` | Admin+ | Visual org tree with drag-and-drop management |
| `/org/members` | `MemberManagementPage` | Admin+ | Invite, remove, role assignment |
| `/org/policies` | `AccessPoliciesPage` | Admin+ | ABAC policy editor with condition builder |
| `/analytics` | `AnalyticsDashboardPage` | Admin+ | Usage metrics, adoption charts, top skills |
| `/admin/audit` | `AuditLogPage` | Admin+ | Searchable audit log with export |
| `/admin/security` | `SecurityDashboardPage` | Security Admin | Scan results, DLP findings, threat alerts |
| `/admin/settings` | `OrgSettingsPage` | Owner/Admin | SSO config, storage limits, review settings |
| `/settings/profile` | `ProfileSettingsPage` | All | Personal settings, API tokens |

### 12.3 Component Architecture

```typescript
// Component hierarchy (key components)
components/
├── layout/
│   ├── AppShell.tsx              // Main layout wrapper
│   ├── Sidebar.tsx               // Collapsible navigation
│   ├── TopBar.tsx                // Search, notifications, user menu
│   └── Breadcrumb.tsx            // Hierarchical navigation
│
├── skills/
│   ├── SkillCard.tsx             // Card view for browser
│   ├── SkillTable.tsx            // Table view for admin
│   ├── SkillEditor/
│   │   ├── MarkdownEditor.tsx    // SKILL.md editor (Monaco)
│   │   ├── FrontmatterForm.tsx   // YAML frontmatter form
│   │   ├── LivePreview.tsx       // Real-time preview
│   │   └── FileUploader.tsx      // .skill package upload
│   ├── SkillDetail.tsx           // Full skill detail view
│   ├── VersionTimeline.tsx       // Version history timeline
│   └── InstallModal.tsx          // Installation instructions
│
├── org/
│   ├── OrgTree.tsx               // Visual hierarchy tree
│   ├── MemberTable.tsx           // Member list with roles
│   ├── InviteDialog.tsx          // Invite members dialog
│   └── PolicyEditor.tsx          // ABAC policy builder
│
├── review/
│   ├── ReviewQueue.tsx           // Pending reviews list
│   ├── ReviewDiff.tsx            // Skill diff viewer
│   ├── SecurityReport.tsx        // Scan results display
│   └── ReviewActions.tsx         // Approve/reject/comment
│
├── analytics/
│   ├── UsageCharts.tsx           // Line/bar charts (Recharts)
│   ├── AdoptionFunnel.tsx        // Install adoption funnel
│   ├── TopSkills.tsx             // Leaderboard widget
│   └── ExportButton.tsx          // CSV/PDF export
│
├── audit/
│   ├── AuditTable.tsx            // Paginated audit log table
│   ├── AuditFilter.tsx           // Date/action/user filters
│   └── AuditDetail.tsx           // Log entry detail drawer
│
└── shared/
    ├── CommandPalette.tsx        // ⌘K global search
    ├── DataTable.tsx             // Generic data table (TanStack)
    ├── ConfirmDialog.tsx         // Confirmation modal
    ├── Toast.tsx                 // Notification toasts
    └── LoadingSkeleton.tsx       // Skeleton loaders
```

### 12.4 State Management

```typescript
// State management strategy: React Query (TanStack Query) + Zustand

// Server state (React Query)
// - Skill data, org hierarchy, audit logs
// - Automatic caching, refetching, optimistic updates
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

function useSkills(filters: SkillFilters) {
  return useQuery({
    queryKey: ['skills', filters],
    queryFn: () => trpc.skill.search.query(filters),
    staleTime: 30_000,             // 30 seconds
    keepPreviousData: true
  });
}

// Client state (Zustand)
// - UI state: sidebar collapsed, theme, active filters
// - Draft state: unsaved skill edits
import { create } from 'zustand';

interface UIStore {
  sidebarCollapsed: boolean;
  theme: 'light' | 'dark' | 'system';
  commandPaletteOpen: boolean;
  toggleSidebar: () => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
}

const useUIStore = create<UIStore>((set) => ({
  sidebarCollapsed: false,
  theme: 'system',
  commandPaletteOpen: false,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setTheme: (theme) => set({ theme }),
}));

// Draft state for skill editor (Zustand with persist middleware)
interface SkillDraftStore {
  drafts: Map<string, SkillDraft>;
  saveDraft: (skillId: string, content: string) => void;
  discardDraft: (skillId: string) => void;
}
```

### 12.5 Key UX Flows

#### Skill Upload Flow

```
User clicks "New Skill"
    │
    ▼
┌─────────────────────────────┐
│  Choose upload method:      │
│  ○ Upload .skill file       │
│  ○ Paste SKILL.md content   │
│  ○ Start from template      │
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│  Skill Editor               │
│  ┌───────────────────────┐  │
│  │ Frontmatter Form      │  │
│  │ Name: [data-analyzer] │  │
│  │ Version: [1.0.0    ]  │  │
│  │ Description: [...]    │  │
│  │ Classification: [v]   │  │
│  │ Visibility: [v]       │  │
│  │ Tags: [data][analytics]│ │
│  └───────────────────────┘  │
│  ┌───────────────────────┐  │
│  │ SKILL.md Editor       │  │
│  │ (Monaco with YAML +   │  │
│  │  Markdown support)     │  │
│  │                       │  │
│  └───────────────────────┘  │
│  ┌───────────────────────┐  │
│  │ Live Preview          │  │
│  │ (Rendered markdown)   │  │
│  └───────────────────────┘  │
│                             │
│  [Save Draft]  [Submit ▶]  │
└──────────┬──────────────────┘
           │ Submit
           ▼
┌─────────────────────────────┐
│  Validation Results         │
│  ✓ Format valid             │
│  ✓ Security scan passed     │
│  ✓ Dependencies clean       │
│  ⚠ Warning: uses fetch()   │
│                             │
│  [Submit for Review]        │
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│  Reviewer Notification      │
│  → Email + Slack + In-app   │
└─────────────────────────────┘
```

#### Command Palette (⌘K)

```typescript
// Global command palette actions
const commands = [
  // Navigation
  { id: 'nav.home', label: 'Go to Dashboard', icon: Home, shortcut: 'g h' },
  { id: 'nav.skills', label: 'Browse Skills', icon: Puzzle, shortcut: 'g s' },
  { id: 'nav.review', label: 'Review Queue', icon: CheckCircle, shortcut: 'g r' },
  { id: 'nav.analytics', label: 'Analytics', icon: BarChart, shortcut: 'g a' },
  
  // Skill actions
  { id: 'skill.new', label: 'Create New Skill', icon: Plus, shortcut: 'n s' },
  { id: 'skill.search', label: 'Search Skills...', icon: Search },
  
  // Dynamic: recent skills
  ...recentSkills.map(s => ({
    id: `skill.open.${s.id}`,
    label: s.name,
    description: s.description,
    icon: Puzzle,
    action: () => router.push(`/skills/${s.id}`)
  })),
  
  // Dynamic: team members
  ...recentMembers.map(m => ({
    id: `member.open.${m.id}`,
    label: m.name,
    description: m.team,
    icon: User,
    action: () => router.push(`/org/members?highlight=${m.id}`)
  }))
];
```

---

## 13. Enterprise CLI Tool

### 13.1 CLI Overview

The `skills-hub-cli` provides command-line access to the Enterprise Skills Hub for CI/CD pipelines, automation scripts, and power users.

```bash
# Installation
npm install -g @acme/skills-hub-cli

# Authentication
skills-hub auth login --sso                    # Browser-based SSO login
skills-hub auth login --token <api-token>      # API token (CI/CD)
skills-hub auth status                         # Show current auth status

# Skill management
skills-hub skill list [--team <team>] [--status published|draft|pending]
skills-hub skill publish ./my-skill/           # Publish from directory
skills-hub skill publish ./my-skill.skill      # Publish from package
skills-hub skill download <name> [--version <v>] [--output ./path]
skills-hub skill info <name>                   # Show skill details
skills-hub skill versions <name>               # List all versions
skills-hub skill delete <name> [--version <v>] # Soft-delete

# Organization
skills-hub org hierarchy                       # Display org tree
skills-hub org members list [--team <team>]
skills-hub org members invite <email> --role <role> --team <team>

# Review
skills-hub review list                         # Pending reviews
skills-hub review approve <review-id> --comment "LGTM"
skills-hub review reject <review-id> --comment "Needs fixes"

# Security
skills-hub scan ./my-skill/                    # Run security scan locally
skills-hub scan --fix                          # Auto-fix common issues

# CI/CD integration
skills-hub ci check                            # Validate skill for CI pipeline
skills-hub ci publish                          # Publish with CI metadata
```

### 13.2 CI/CD Integration Example

```yaml
# .github/workflows/publish-skill.yml
name: Publish Skill to Enterprise Hub

on:
  push:
    tags:
      - 'v*'                     # Trigger on version tags

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup CLI
        uses: acme/skills-hub-cli/setup@v1
      
      - name: Validate skill
        run: skills-hub ci check
        env:
          SKILLS_HUB_TOKEN: ${{ secrets.SKILLS_HUB_TOKEN }}
      
      - name: Security scan
        run: skills-hub scan ./skills/my-skill/
      
      - name: Publish skill
        run: |
          VERSION=${GITHUB_REF#refs/tags/v}
          skills-hub ci publish \
            --name my-skill \
            --version $VERSION \
            --changelog "$(git log --oneline $(git describe --tags --abbrev=0 HEAD^)..HEAD)" \
            --path ./skills/my-skill/
        env:
          SKILLS_HUB_TOKEN: ${{ secrets.SKILLS_HUB_TOKEN }}
```

### 13.3 Configuration File

```yaml
# .skills-hub.yml (project-level config)
registry: https://skills.acme.com
org: acme-corp
team: platform-engineering

# Default publish settings
publish:
  visibility: team
  classification: internal
  requireReview: true
  autoScan: true

# CI/CD settings
ci:
  failOnWarning: false
  failOnCritical: true
  scanTimeout: 60

# Local development
dev:
  watchPaths:
    - "SKILL.md"
    - "references/**"
    - "scripts/**"
  syncTo: ~/.qoderworkcn/skills/my-skill
```

---

## 14. Notification & Webhook Integration System

### 14.1 Notification Architecture

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Event      │────►│  Notification│────►│  Dispatch    │
│   Bus        │     │  Router      │     │  Workers     │
│ (Redis       │     │  (Evaluate   │     │  (Parallel   │
│  Streams)    │     │   rules)     │     │   delivery)  │
└──────────────┘     └──────────────┘     └──────┬───────┘
                                                  │
                        ┌──────────┬──────────┬───┴───┬──────────┐
                        ▼          ▼          ▼       ▼          ▼
                   ┌────────┐ ┌────────┐ ┌────────┐ ┌─────┐ ┌────────┐
                   │ Email  │ │ Slack  │ │ Teams  │ │Web- │ │Audit   │
                   │(SES/   │ │        │ │        │ │hook │ │Log     │
                   │ SMTP)  │ │        │ │        │ │     │ │        │
                   └────────┘ └────────┘ └────────┘ └─────┘ └────────┘
```

### 14.2 Event Types & Notification Rules

```typescript
// Event definitions
enum SkillEvent {
  SKILL_PUBLISHED = 'skill.published',
  SKILL_UPDATED = 'skill.updated',
  SKILL_DEPRECATED = 'skill.deprecated',
  REVIEW_SUBMITTED = 'review.submitted',
  REVIEW_APPROVED = 'review.approved',
  REVIEW_REJECTED = 'review.rejected',
  SECURITY_SCAN_FAILED = 'security.scan_failed',
  DEPENDENCY_VULN_FOUND = 'dependency.vulnerability_found',
  MEMBER_INVITED = 'member.invited',
  MEMBER_ROLE_CHANGED = 'member.role_changed',
}

// Notification preference (per user)
interface NotificationPreference {
  userId: string;
  channels: {
    email: boolean;
    slack: boolean;
    teams: boolean;
    inApp: boolean;
    webhook: boolean;
  };
  events: {
    [key in SkillEvent]?: {
      enabled: boolean;
      channels: ('email' | 'slack' | 'teams' | 'inApp' | 'webhook')[];
    };
  };
}

// Example: Alice wants Slack notifications for review submissions
{
  userId: "user-alice",
  events: {
    "review.submitted": {
      enabled: true,
      channels: ["slack", "inApp"]
    },
    "security.scan_failed": {
      enabled: true,
      channels: ["email", "slack"]
    }
  }
}
```

### 14.3 Webhook System

```typescript
// Webhook configuration (org/team level)
interface WebhookConfig {
  id: string;
  orgId: string;
  name: string;
  url: string;
  secret: string;                  // HMAC-SHA256 signature secret
  events: SkillEvent[];
  active: boolean;
  filters?: {
    teams?: string[];              // Only fire for specific teams
    classifications?: string[];    // Only fire for specific classifications
  };
  createdAt: Date;
}

// Webhook payload
interface WebhookPayload {
  id: string;                      // Unique event ID (for dedup)
  timestamp: string;
  event: SkillEvent;
  orgId: string;
  data: Record<string, any>;
  actor: {
    id: string;
    email: string;
  };
}

// Webhook signature (GitHub-style)
function signWebhookPayload(payload: WebhookPayload, secret: string): string {
  const hmac = createHmac('sha256', secret);
  hmac.update(JSON.stringify(payload));
  return `sha256=${hmac.digest('hex')}`;
}

// Webhook delivery with retry
class WebhookDispatcher {
  private maxRetries = 5;
  private retryDelays = [1000, 5000, 30000, 120000, 300000]; // Exponential backoff
  
  async deliver(webhook: WebhookConfig, payload: WebhookPayload): Promise<void> {
    const signature = signWebhookPayload(payload, webhook.secret);
    
    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        const response = await fetch(webhook.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-SkillsHub-Signature': signature,
            'X-SkillsHub-Event': payload.event,
            'X-SkillsHub-Delivery': payload.id
          },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(10000)   // 10s timeout
        });
        
        if (response.ok) {
          await this.logDelivery(webhook.id, payload.id, 'success', attempt + 1);
          return;
        }
        
        if (response.status >= 500) {
          // Retry on server errors
          await this.delay(this.retryDelays[attempt]);
          continue;
        }
        
        // 4xx errors: don't retry
        await this.logDelivery(webhook.id, payload.id, 'failed', attempt + 1, response.status);
        return;
        
      } catch (error) {
        if (attempt === this.maxRetries - 1) {
          await this.logDelivery(webhook.id, payload.id, 'failed', attempt + 1, error.message);
          return;
        }
        await this.delay(this.retryDelays[attempt]);
      }
    }
  }
}
```

### 14.4 Slack & Teams Integration

```typescript
// Slack integration
interface SlackIntegration {
  orgId: string;
  workspaceId: string;
  botToken: string;                // xoxb-...
  defaultChannel: string;          // #skills-hub
  mappings: {
    teamId: string;
    channelId: string;             // Team-specific channel
  }[];
}

// Slack message templates
function formatSkillPublishedMessage(skill: Skill, version: SkillVersion): SlackMessage {
  return {
    blocks: [
      {
        type: 'header',
        text: { type: 'plain_text', text: `🧩 New Skill Published: ${skill.name}` }
      },
      {
        type: 'section',
        fields: [
          { type: 'mrkdwn', text: `*Version:* ${version.version}` },
          { type: 'mrkdwn', text: `*Author:* ${skill.author.email}` },
          { type: 'mrkdwn', text: `*Team:* ${skill.team?.name || 'N/A'}` },
          { type: 'mrkdwn', text: `*Classification:* ${skill.classification}` }
        ]
      },
      {
        type: 'section',
        text: { type: 'mrkdwn', text: skill.description }
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: { type: 'plain_text', text: 'View Skill' },
            url: `https://skills.acme.com/skills/${skill.id}`
          },
          {
            type: 'button',
            text: { type: 'plain_text', text: 'Install' },
            actionId: `install:${skill.id}`
          }
        ]
      }
    ]
  };
}
```

---

## 15. CI/CD Pipeline & Deployment Automation

### 15.1 CI/CD Architecture

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Developer  │     │   CI Server  │     │   CD Server  │
│   (Git Push) │────►│  (GitHub     │────►│  (ArgoCD /   │
│              │     │   Actions)   │     │   Helm)      │
└──────────────┘     └──────┬───────┘     └──────┬───────┘
                            │                     │
                     ┌──────┴───────┐     ┌──────┴───────┐
                     │  Test Suite  │     │  Kubernetes  │
                     │  - Unit      │     │  Cluster     │
                     │  - Integrat. │     │  (Prod)      │
                     │  - E2E       │     │              │
                     │  - Security  │     │              │
                     └──────────────┘     └──────────────┘
```

### 15.2 GitHub Actions Workflow

```yaml
# .github/workflows/ci.yml
name: CI Pipeline

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

env:
  NODE_VERSION: '20'
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  # ============ Quality Gates ============
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck

  test-unit:
    runs-on: ubuntu-latest
    needs: lint
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      - run: npm ci
      - run: npx prisma migrate deploy
        env:
          DATABASE_URL: postgresql://postgres:test@localhost:5432/test
      - run: npm run test:unit
        env:
          DATABASE_URL: postgresql://postgres:test@localhost:5432/test
          REDIS_URL: redis://localhost:6379

  test-e2e:
    runs-on: ubuntu-latest
    needs: lint
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run test:e2e

  security-scan:
    runs-on: ubuntu-latest
    needs: lint
    steps:
      - uses: actions/checkout@v4
      - run: npm audit --production
      - uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'fs'
          scan-ref: '.'
      
  # ============ Build & Push ============
  build:
    runs-on: ubuntu-latest
    needs: [test-unit, test-e2e, security-scan]
    if: github.ref == 'refs/heads/main'
    permissions:
      contents: read
      packages: write
    steps:
      - uses: actions/checkout@v4
      - uses: docker/setup-buildx-action@v3
      - uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      - uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: |
            ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:latest
            ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

  # ============ Deploy ============
  deploy-staging:
    runs-on: ubuntu-latest
    needs: build
    environment: staging
    steps:
      - uses: actions/checkout@v4
      - uses: azure/setup-kubectl@v3
      - uses: azure/k8s-deploy@v4
        with:
          namespace: skills-hub-staging
          manifests: |
            k8s/base/deployment.yaml
            k8s/base/service.yaml
            k8s/staging/ingress.yaml
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }}

  deploy-production:
    runs-on: ubuntu-latest
    needs: deploy-staging
    environment: production          # Requires manual approval
    steps:
      - uses: actions/checkout@v4
      - uses: azure/setup-kubectl@v3
      - uses: azure/k8s-deploy@v4
        with:
          namespace: skills-hub-production
          manifests: |
            k8s/base/deployment.yaml
            k8s/base/service.yaml
            k8s/production/ingress.yaml
            k8s/production/hpa.yaml
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }}
          strategy: canary
          percentage: 10             # Canary: 10% traffic first
```

### 15.3 Kubernetes Manifests

```yaml
# k8s/base/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: skills-hub
  labels:
    app: skills-hub
    tier: web
spec:
  replicas: 3
  selector:
    matchLabels:
      app: skills-hub
  template:
    metadata:
      labels:
        app: skills-hub
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/port: "3000"
        prometheus.io/path: "/api/metrics"
    spec:
      serviceAccountName: skills-hub
      securityContext:
        runAsNonRoot: true
        runAsUser: 1001
        fsGroup: 1001
      containers:
      - name: skills-hub
        image: ghcr.io/acme/skills-hub:latest
        ports:
        - containerPort: 3000
          name: http
        env:
        - name: NODE_ENV
          value: "production"
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: skills-hub-secrets
              key: database-url
        - name: REDIS_URL
          valueFrom:
            secretKeyRef:
              name: skills-hub-secrets
              key: redis-url
        - name: S3_BUCKET
          valueFrom:
            configMapKeyRef:
              name: skills-hub-config
              key: s3-bucket
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
        livenessProbe:
          httpGet:
            path: /api/health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
          failureThreshold: 3
        readinessProbe:
          httpGet:
            path: /api/ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
        securityContext:
          allowPrivilegeEscalation: false
          readOnlyRootFilesystem: true
          capabilities:
            drop: ["ALL"]
      topologySpreadConstraints:
      - maxSkew: 1
        topologyKey: kubernetes.io/hostname
        whenUnsatisfiable: DoNotSchedule
        labelSelector:
          matchLabels:
            app: skills-hub
---
# k8s/production/hpa.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: skills-hub
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: skills-hub
  minReplicas: 3
  maxReplicas: 20
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300    # Wait 5min before scaling down
    scaleUp:
      policies:
      - type: Pods
        value: 2
        periodSeconds: 60                # Max 2 pods per minute
```

---

## 16. Backup, Disaster Recovery & Multi-Region

### 16.1 Backup Strategy

```typescript
// Backup configuration
interface BackupConfig {
  // PostgreSQL
  database: {
    type: 'pg_dump' | 'wal-g' | 'cloud-native';
    frequency: '1h' | '4h' | 'daily';
    retention: '30d' | '90d' | '365d';
    encrypted: true;
    destination: 's3://backups/db/';
  };
  
  // S3 skill packages
  storage: {
    type: 'cross-region-replication' | 'versioned-backup';
    versioning: true;
    lifecyclePolicy: {
      currentVersion: 'permanent';
      previousVersions: '90d';
      deletedMarkers: '30d';
    };
  };
  
  // Elasticsearch
  search: {
    type: 'snapshot';
    frequency: 'daily';
    retention: '14d';
    repository: 's3://backups/es/';
  };
}

// RPO/RTO targets
const DR_TARGETS = {
  production: {
    rpo: '1 hour',                    // Maximum data loss
    rto: '4 hours',                   // Maximum downtime
    backupFrequency: 'hourly',
    crossRegion: true,
    pilotLight: true                  // Minimal standby in DR region
  },
  staging: {
    rpo: '24 hours',
    rto: '8 hours',
    backupFrequency: 'daily',
    crossRegion: false,
    pilotLight: false
  }
};
```

### 16.2 Multi-Region Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Global DNS (Route53)                  │
│              Active-Active with Geo-routing              │
└──────────────┬──────────────────────────┬───────────────┘
               │                          │
    ┌──────────┴──────────┐    ┌──────────┴──────────┐
    │   Region: us-east-1 │    │   Region: eu-west-1 │
    │   (Primary)         │    │   (Secondary)       │
    │                     │    │                     │
    │ ┌─────────────────┐ │    │ ┌─────────────────┐ │
    │ │   EKS Cluster   │ │    │ │   EKS Cluster   │ │
    │ │  ┌───────────┐  │ │    │ │  ┌───────────┐  │ │
    │ │  │ Next.js   │  │ │    │ │  │ Next.js   │  │ │
    │ │  │ API       │  │ │    │ │  │ API       │  │ │
    │ │  │ Workers   │  │ │    │ │  │ Workers   │  │ │
    │ │  └───────────┘  │ │    │ │  └───────────┘  │ │
    │ └─────────────────┘ │    │ └─────────────────┘ │
    │                     │    │                     │
    │ ┌─────────┐ ┌─────┐ │    │ ┌─────────┐ ┌─────┐ │
    │ │Aurora   │ │S3   │ │◄──►│ │Aurora   │ │S3   │ │
    │ │(Writer) │ │     │ │Sync│ │(Reader) │ │     │ │
    │ └─────────┘ └─────┘ │    │ └─────────┘ └─────┘ │
    │                     │    │                     │
    │ ┌─────────┐         │    │ ┌─────────┐         │
    │ │Elastic- │         │    │ │Elastic- │         │
    │ │search   │         │    │ │search   │         │
    │ │(Primary)│         │    │ │(Replica)│         │
    │ └─────────┘         │    │ └─────────┘         │
    └─────────────────────┘    └─────────────────────┘
```

### 16.3 Database Replication & Failover

```typescript
// Aurora Global Database configuration
interface DatabaseConfig {
  primary: {
    region: 'us-east-1';
    endpoint: 'skills-hub-primary.cluster-xxx.us-east-1.rds.amazonaws.com';
    writer: true;
  };
  replicas: [
    {
      region: 'eu-west-1';
      endpoint: 'skills-hub-replica.cluster-xxx.eu-west-1.rds.amazonaws.com';
      writer: false;
      replicationLag: '< 1 second';    // Aurora Global DB SLA
    }
  ];
  
  failover: {
    automatic: true;
    rpo: '< 1 second';                  // Aurora Global DB RPO
    rto: '< 30 seconds';                // Aurora Global DB RTO
    dnsCutover: 'Route53 health checks';
  };
}

// Read/write splitting middleware
class DatabaseRouter {
  private primary: DataSource;
  private replicas: DataSource[];
  
  getDataSource(operation: 'read' | 'write'): DataSource {
    if (operation === 'write') {
      return this.primary;
    }
    
    // Round-robin across replicas
    const index = this.counter++ % this.replicas.length;
    return this.replicas[index];
  }
}
```

### 16.4 Disaster Recovery Runbook

```typescript
// Automated DR procedures
const DR_RUNBOOK = {
  // Database failure
  'database_failure': {
    detection: 'Aurora health check failure + PagerDuty alert',
    steps: [
      '1. Verify primary is truly down (check 3 endpoints)',
      '2. If primary unreachable > 60s: initiate failover',
      '3. Aurora Global DB automatic failover to replica',
      '4. Update DNS to point to new primary',
      '5. Verify application connectivity',
      '6. Notify stakeholders via Slack #incident-response',
      '7. Investigate root cause',
      '8. Re-establish replication to failed region'
    ],
    estimatedRTO: '2 minutes',
    automated: true
  },
  
  // Region failure
  'region_failure': {
    detection: 'Multiple service health checks failing + CloudWatch alarms',
    steps: [
      '1. Confirm region-wide failure (not just single service)',
      '2. Activate DR region (if pilot light)',
      '3. Scale up DR region resources',
      '4. Update Route53 to route all traffic to DR region',
      '5. Promote DR database replica to primary',
      '6. Verify all services operational',
      '7. Notify stakeholders',
      '8. Begin region recovery procedure'
    ],
    estimatedRTO: '15 minutes',
    automated: false                    // Requires human approval
  },
  
  // Data corruption
  'data_corruption': {
    detection: 'Application error spike + data integrity checks',
    steps: [
      '1. Identify corruption scope (specific tables vs. full DB)',
      '2. Stop application writes',
      '3. Take snapshot of current state (forensic evidence)',
      '4. Restore from last known good backup (point-in-time)',
      '5. Verify data integrity',
      '6. Gradually resume writes',
      '7. Investigate root cause',
      '8. File incident report'
    ],
    estimatedRTO: '1 hour',
    automated: false
  }
};
```

---

## 17. Performance & Scaling Strategy

### 17.1 Caching Layers

```typescript
// Multi-level caching architecture
// L1: In-memory (Node.js process) → L2: Redis → L3: Database/S3

class CacheService {
  // L1: In-memory cache (per-process, 100MB limit)
  private lru = new LRUCache<string, any>({
    max: 10000,
    maxSize: 100 * 1024 * 1024,       // 100MB
    sizeCalculation: (value) => JSON.stringify(value).length,
    ttl: 60 * 1000                     // 1 minute default
  });
  
  // L2: Redis cache (shared across processes)
  private redis: Redis;
  
  async get<T>(key: string): Promise<T | null> {
    // Check L1
    const l1Value = this.lru.get(key);
    if (l1Value) return l1Value as T;
    
    // Check L2
    const l2Value = await this.redis.get(key);
    if (l2Value) {
      const parsed = JSON.parse(l2Value) as T;
      this.lru.set(key, parsed);       // Promote to L1
      return parsed;
    }
    
    return null;
  }
  
  async set(key: string, value: any, ttlSeconds: number = 300): Promise<void> {
    this.lru.set(key, value);
    await this.redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
  }
  
  async invalidate(pattern: string): Promise<void> {
    // Invalidate from both layers
    for (const key of this.lru.keys()) {
      if (key.match(pattern)) this.lru.delete(key);
    }
    
    const keys = await this.redis.keys(pattern);
    if (keys.length > 0) {
      const pipeline = this.redis.pipeline();
      keys.forEach(k => pipeline.del(k));
      await pipeline.exec();
    }
  }
}

// Cache strategies by data type
const CACHE_CONFIG = {
  'skill:detail': { ttl: 300, invalidation: 'on-publish' },
  'skill:search': { ttl: 60, invalidation: 'on-publish' },
  'org:hierarchy': { ttl: 3600, invalidation: 'on-structure-change' },
  'user:permissions': { ttl: 300, invalidation: 'on-role-change' },
  'review:pending': { ttl: 60, invalidation: 'on-review-action' },
  'analytics:summary': { ttl: 900, invalidation: 'time-based' }
};
```

### 17.2 Database Optimization

```typescript
// Key indexes for performance
// (in addition to Prisma's auto-generated indexes)

// Composite indexes for common queries
CREATE INDEX idx_skills_org_visibility ON skills(org_id, visibility);
CREATE INDEX idx_skills_org_category ON skills(org_id, category);
CREATE INDEX idx_skill_versions_skill ON skill_versions(skill_id, published_at DESC);
CREATE INDEX idx_audit_logs_org_time ON audit_logs(org_id, timestamp DESC);
CREATE INDEX idx_members_org_role ON members(org_id, role);

// Partial indexes for filtered queries
CREATE INDEX idx_skills_published ON skills(org_id, name) 
  WHERE review_status = 'approved';

CREATE INDEX idx_reviews_pending ON skill_reviews(skill_id, created_at DESC)
  WHERE status = 'pending';

// Full-text search index (PostgreSQL fallback)
CREATE INDEX idx_skills_search ON skills 
  USING GIN(to_tsvector('english', name || ' ' || description));

// Query optimization examples
// Paginated skill list (keyset pagination instead of OFFSET)
async function getSkillsPaginated(orgId: string, cursor?: string, limit: number = 20) {
  return db.skill.findMany({
    where: { orgId },
    orderBy: { createdAt: 'desc' },
    cursor: cursor ? { id: cursor } : undefined,
    take: limit + 1,                   // Fetch one extra to detect next page
    skip: cursor ? 1 : 0,             // Skip the cursor item
    include: { author: true, team: true }
  });
}

// Batch operations to reduce DB round trips
async function batchUpdateInstallCounts(skills: { id: string; count: number }[]) {
  const queries = skills.map(s => 
    db.skill.update({
      where: { id: s.id },
      data: { installCount: { increment: s.count } }
    })
  );
  
  await db.$transaction(queries);
}
```

### 17.3 Rate Limiting

```typescript
// Multi-tier rate limiting
interface RateLimitConfig {
  // Global limits
  global: {
    requestsPerMinute: 1000;
    requestsPerHour: 10000;
  };
  
  // Per-user limits (by role)
  perUser: {
    viewer: { rpm: 60, rph: 600 };
    member: { rpm: 120, rph: 1200 };
    admin: { rpm: 300, rph: 3000 };
  };
  
  // Per-endpoint limits
  perEndpoint: {
    'POST /api/skill/upload': { rpm: 10 };
    'POST /api/auth/login': { rpm: 5 };     // Anti-brute-force
    'GET /api/skill/search': { rpm: 60 };
    'GET /api/skill/*/download': { rpm: 30 };
  };
}

// Redis-based sliding window rate limiter
class RateLimiter {
  async checkLimit(key: string, limit: number, windowMs: number): Promise<RateLimitResult> {
    const now = Date.now();
    const windowStart = now - windowMs;
    
    const pipeline = this.redis.pipeline();
    pipeline.zremrangebyscore(key, 0, windowStart);
    pipeline.zadd(key, now, `${now}`);
    pipeline.zcard(key);
    pipeline.pexpire(key, windowMs);
    
    const results = await pipeline.exec();
    const count = results![2][1] as number;
    
    return {
      allowed: count <= limit,
      remaining: Math.max(0, limit - count),
      resetAt: windowStart + windowMs,
      limit
    };
  }
}

// Middleware
async function rateLimitMiddleware(req: NextRequest, res: NextResponse) {
  const userId = req.auth?.userId;
  const role = req.auth?.role || 'viewer';
  const endpoint = `${req.method} ${req.nextUrl.pathname}`;
  
  // Check global limit
  const globalLimit = await rateLimiter.checkLimit(
    `ratelimit:global:${req.ip}`,
    RATE_LIMITS.global.requestsPerMinute,
    60_000
  );
  
  if (!globalLimit.allowed) {
    return Response.json(
      { error: 'Rate limit exceeded' },
      { status: 429, headers: { 'Retry-After': '60' } }
    );
  }
  
  // Check per-user limit
  const userLimit = await rateLimiter.checkLimit(
    `ratelimit:user:${userId}`,
    RATE_LIMITS.perUser[role].rpm,
    60_000
  );
  
  if (!userLimit.allowed) {
    return Response.json(
      { error: 'User rate limit exceeded' },
      { status: 429, headers: { 'Retry-After': '60' } }
    );
  }
  
  // Add rate limit headers
  res.headers.set('X-RateLimit-Limit', String(userLimit.limit));
  res.headers.set('X-RateLimit-Remaining', String(userLimit.remaining));
  res.headers.set('X-RateLimit-Reset', String(userLimit.resetAt));
}
```

### 17.4 Search Performance

```typescript
// Elasticsearch optimization
const SEARCH_CONFIG = {
  index: {
    number_of_shards: 3,
    number_of_replicas: 1,
    refresh_interval: '5s'              // Near-real-time search
  },
  analysis: {
    analyzer: {
      skill_analyzer: {
        type: 'custom',
        tokenizer: 'standard',
        filter: ['lowercase', 'stemmer', 'asciifolding']
      }
    }
  }
};

// Search result pagination (search_after for deep pagination)
async function searchSkillsDeep(
  query: string,
  orgId: string,
  userId: string,
  pageSize: number = 20,
  searchAfter?: any[]
): Promise<SearchResult> {
  const body: any = {
    size: pageSize,
    query: {
      bool: {
        must: [
          { multi_match: { query, fields: ['name^3', 'description^2', 'tags'] } }
        ],
        filter: [
          { term: { orgId } },
          { terms: { accessibleBy: [userId, ...userTeams, ...userDepts] } }
        ]
      }
    },
    sort: [
      { _score: 'desc' },
      { installCount: 'desc' },
      { updatedAt: 'desc' }
    ]
  };
  
  if (searchAfter) {
    body.search_after = searchAfter;
  }
  
  const result = await es.search({ index: 'skills', body });
  
  return {
    hits: result.hits.hits.map(h => h._source),
    nextSearchAfter: result.hits.hits.length > 0
      ? result.hits.hits[result.hits.hits.length - 1].sort
      : null
  };
}
```

---

## 18. Developer Experience & SDK

### 18.1 TypeScript SDK

```typescript
// @acme/skills-hub-sdk
import { TRPCClient } from '@trpc/client';
import type { AppRouter } from '@acme/skills-hub/server';

export class SkillsHubClient {
  private trpc: TRPCClient<AppRouter>;
  
  constructor(config: {
    baseUrl: string;
    token?: string;
    orgSlug: string;
  }) {
    this.trpc = createTRPCProxyClient<AppRouter>({
      links: [
        httpBatchLink({
          url: `${config.baseUrl}/api/trpc`,
          headers: () => ({
            Authorization: config.token ? `Bearer ${config.token}` : '',
            'X-Org-Slug': config.orgSlug
          })
        })
      ]
    });
  }
  
  // Skill operations
  async listSkills(filters?: SkillFilters): Promise<Skill[]> {
    return this.trpc.skill.list.query(filters);
  }
  
  async getSkill(id: string): Promise<SkillDetail> {
    return this.trpc.skill.getById.query({ id });
  }
  
  async publishSkill(input: PublishInput): Promise<Skill> {
    return this.trpc.skill.publish.mutate(input);
  }
  
  async downloadSkill(id: string, version?: string): Promise<Buffer> {
    const { downloadUrl } = await this.trpc.skill.getDownloadUrl.query({ id, version });
    const response = await fetch(downloadUrl);
    return Buffer.from(await response.arrayBuffer());
  }
  
  // Organization operations
  async getOrgHierarchy(): Promise<OrgHierarchy> {
    return this.trpc.org.getHierarchy.query();
  }
  
  async inviteMember(input: InviteInput): Promise<Member> {
    return this.trpc.org.inviteMember.mutate(input);
  }
}

// Usage example
const client = new SkillsHubClient({
  baseUrl: 'https://skills.acme.com',
  token: process.env.SKILLS_HUB_TOKEN,
  orgSlug: 'acme-corp'
});

const skills = await client.listSkills({ category: 'analytics' });
const detail = await client.getSkill(skills[0].id);
```

### 18.2 Skill Template System

```typescript
// Built-in templates for common skill patterns
interface SkillTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  files: {
    path: string;
    content: string;
  }[];
}

const TEMPLATES: SkillTemplate[] = [
  {
    id: 'data-processor',
    name: 'Data Processor',
    description: 'Process CSV/Excel/JSON data files',
    category: 'data',
    files: [
      {
        path: 'SKILL.md',
        content: `---
name: {{skill-name}}
version: 1.0.0
description: "{{description}}"
classification: internal
tags: [data, processing]
---

# {{skill-name}}

## Steps
1. Read the input file
2. Validate data format
3. Process according to rules
4. Output results

## Supported Formats
- CSV (.csv)
- Excel (.xlsx, .xls)
- JSON (.json)
`
      },
      {
        path: 'scripts/validate.py',
        content: `import sys
import json

def validate(input_file):
    """Validate input data format."""
    # TODO: Implement validation logic
    pass

if __name__ == '__main__':
    validate(sys.argv[1])
`
      }
    ]
  },
  {
    id: 'api-integration',
    name: 'API Integration',
    description: 'Integrate with external APIs',
    category: 'integration',
    files: [
      {
        path: 'SKILL.md',
        content: `---
name: {{skill-name}}
version: 1.0.0
description: "{{description}}"
classification: internal
tags: [api, integration]
---

# {{skill-name}}

## Authentication
This skill requires API credentials stored in the organization vault.

## Steps
1. Authenticate with the API
2. Fetch required data
3. Transform response
4. Return results

## Configuration
- API_BASE_URL: Base URL for the API
- API_KEY: API authentication key
`
      }
    ]
  },
  {
    id: 'document-generator',
    name: 'Document Generator',
    description: 'Generate documents from templates',
    category: 'document',
    files: [
      {
        path: 'SKILL.md',
        content: `---
name: {{skill-name}}
version: 1.0.0
description: "{{description}}"
classification: internal
tags: [document, template, generation]
---

# {{skill-name}}

## Steps
1. Load template from references/
2. Fill in placeholders
3. Generate output document
4. Return file path

## Template Variables
Use {{variable_name}} syntax in templates.
`
      },
      {
        path: 'references/template.md',
        content: `# {{title}}

**Author:** {{author}}
**Date:** {{date}}

## Summary
{{summary}}

## Details
{{details}}
`
      }
    ]
  }
];
```

### 18.3 Local Development Server

```typescript
// skills-hub dev - Local development with hot reload
// Watches skill directory and syncs to QoderWork skills folder

import chokidar from 'chokidar';
import fs from 'fs-extra';
import path from 'path';

class SkillDevServer {
  private skillDir: string;
  private syncTarget: string;
  private watcher: chokidar.FSWatcher;
  
  constructor(config: { skillDir: string; syncTarget: string }) {
    this.skillDir = config.skillDir;
    this.syncTarget = config.syncTarget;
  }
  
  async start(): Promise<void> {
    // Initial sync
    await this.sync();
    
    // Watch for changes
    this.watcher = chokidar.watch(this.skillDir, {
      ignored: /node_modules|\.git/,
      persistent: true
    });
    
    this.watcher
      .on('change', (filePath) => {
        console.log(`[skill-dev] Changed: ${path.relative(this.skillDir, filePath)}`);
        this.sync();
      })
      .on('add', (filePath) => {
        console.log(`[skill-dev] Added: ${path.relative(this.skillDir, filePath)}`);
        this.sync();
      })
      .on('unlink', (filePath) => {
        console.log(`[skill-dev] Removed: ${path.relative(this.skillDir, filePath)}`);
        this.sync();
      });
    
    console.log(`[skill-dev] Watching ${this.skillDir}`);
    console.log(`[skill-dev] Syncing to ${this.syncTarget}`);
  }
  
  private async sync(): Promise<void> {
    // Validate skill
    const skillMd = path.join(this.skillDir, 'SKILL.md');
    if (!await fs.pathExists(skillMd)) {
      console.error('[skill-dev] ERROR: SKILL.md not found');
      return;
    }
    
    // Sync to target
    await fs.ensureDir(this.syncTarget);
    await fs.copy(this.skillDir, this.syncTarget, {
      overwrite: true,
      filter: (src) => !src.includes('node_modules')
    });
    
    console.log('[skill-dev] Synced ✓');
  }
  
  stop(): void {
    this.watcher.close();
  }
}
```

---

## 19. Testing Strategy

### 19.1 Testing Pyramid

```
                    ┌─────────┐
                    │  E2E    │  10 tests  (Playwright)
                    │ Tests   │  Critical user flows
                   ┌┴─────────┴┐
                   │Integration│  50 tests  (Vitest + Supertest)
                   │   Tests   │  API endpoints + DB
                  ┌┴───────────┴┐
                  │  Unit Tests │  300+ tests  (Vitest)
                  │             │  Services, utilities, models
                  └─────────────┘
```

### 19.2 Unit Tests

```typescript
// Example: Skill validation service unit tests
import { describe, it, expect, vi } from 'vitest';
import { SkillValidator } from './skill-validator';

describe('SkillValidator', () => {
  const validator = new SkillValidator();
  
  describe('validateFrontmatter', () => {
    it('should pass valid frontmatter', () => {
      const frontmatter = {
        name: 'test-skill',
        description: 'A test skill',
        version: '1.0.0'
      };
      
      const result = validator.validateFrontmatter(frontmatter);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
    
    it('should reject name with uppercase letters', () => {
      const frontmatter = {
        name: 'Test-Skill',
        description: 'A test skill'
      };
      
      const result = validator.validateFrontmatter(frontmatter);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Name must be lowercase');
    });
    
    it('should reject name starting with hyphen', () => {
      const frontmatter = {
        name: '-test-skill',
        description: 'A test skill'
      };
      
      const result = validator.validateFrontmatter(frontmatter);
      expect(result.valid).toBe(false);
    });
    
    it('should reject name longer than 64 characters', () => {
      const frontmatter = {
        name: 'a'.repeat(65),
        description: 'A test skill'
      };
      
      const result = validator.validateFrontmatter(frontmatter);
      expect(result.valid).toBe(false);
    });
    
    it('should reject missing description', () => {
      const frontmatter = {
        name: 'test-skill'
      };
      
      const result = validator.validateFrontmatter(frontmatter);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Description is required');
    });
  });
  
  describe('validateSecurity', () => {
    it('should detect eval() usage', () => {
      const files = [
        { path: 'script.js', content: 'const result = eval(code);' }
      ];
      
      const result = validator.validateSecurity(files);
      expect(result.passed).toBe(false);
      expect(result.findings[0].severity).toBe('high');
    });
    
    it('should detect child_process usage', () => {
      const files = [
        { path: 'script.js', content: 'require("child_process").exec("ls");' }
      ];
      
      const result = validator.validateSecurity(files);
      expect(result.passed).toBe(false);
    });
    
    it('should pass clean files', () => {
      const files = [
        { path: 'SKILL.md', content: '# Test Skill\n\nSteps:\n1. Do thing' }
      ];
      
      const result = validator.validateSecurity(files);
      expect(result.passed).toBe(true);
    });
  });
});
```

### 19.3 Integration Tests

```typescript
// Example: Skill API integration tests
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestContext, TestContext } from '../test-utils';

describe('Skill API', () => {
  let ctx: TestContext;
  
  beforeAll(async () => {
    ctx = await createTestContext();
  });
  
  afterAll(async () => {
    await ctx.teardown();
  });
  
  describe('POST /api/trpc/skill.publish', () => {
    it('should publish a valid skill', async () => {
      const { trpc, db, user } = ctx;
      
      const result = await trpc.skill.publish.mutate({
        name: 'test-skill',
        description: 'A test skill for integration testing',
        version: '1.0.0',
        content: '# Test Skill\n\nSteps:\n1. Test thing',
        visibility: 'team',
        classification: 'internal'
      });
      
      expect(result.id).toBeDefined();
      expect(result.name).toBe('test-skill');
      expect(result.reviewStatus).toBe('pending');
      
      // Verify in database
      const skill = await db.skill.findUnique({ where: { id: result.id } });
      expect(skill).not.toBeNull();
      expect(skill?.authorId).toBe(user.id);
    });
    
    it('should reject duplicate skill name within org', async () => {
      const { trpc } = ctx;
      
      // First publish
      await trpc.skill.publish.mutate({
        name: 'duplicate-skill',
        description: 'First version',
        version: '1.0.0',
        content: '# Skill'
      });
      
      // Second publish with same name
      await expect(
        trpc.skill.publish.mutate({
          name: 'duplicate-skill',
          description: 'Duplicate',
          version: '1.0.0',
          content: '# Skill'
        })
      ).rejects.toThrow('Skill name already exists');
    });
    
    it('should enforce RBAC - viewer cannot publish', async () => {
      const { trpcAs } = ctx;
      
      await expect(
        trpcAs('viewer').skill.publish.mutate({
          name: 'unauthorized-skill',
          description: 'Should fail',
          version: '1.0.0',
          content: '# Skill'
        })
      ).rejects.toThrow('Forbidden');
    });
    
    it('should trigger security scan on publish', async () => {
      const { trpc, waitForJob } = ctx;
      
      const result = await trpc.skill.publish.mutate({
        name: 'scan-test-skill',
        description: 'Test security scan',
        version: '1.0.0',
        content: '# Skill\n\n```js\neval("test");\n```',
        visibility: 'team'
      });
      
      // Wait for async security scan
      const scanResult = await waitForJob('security-scan', result.id);
      
      expect(scanResult.passed).toBe(false);
      expect(scanResult.findings).toContainEqual(
        expect.objectContaining({ severity: 'high', message: expect.stringContaining('eval') })
      );
    });
  });
  
  describe('GET /api/trpc/skill.search', () => {
    it('should return skills matching query', async () => {
      const { trpc } = ctx;
      
      // Seed test data
      await seedSkills(ctx, [
        { name: 'data-analyzer', description: 'Analyze CSV data', tags: ['data'] },
        { name: 'pdf-reader', description: 'Read PDF files', tags: ['pdf'] },
        { name: 'data-visualizer', description: 'Visualize data as charts', tags: ['data', 'charts'] }
      ]);
      
      const results = await trpc.skill.search.query({ q: 'data' });
      
      expect(results.total).toBe(2);
      expect(results.hits.map(h => h.name)).toEqual(
        expect.arrayContaining(['data-analyzer', 'data-visualizer'])
      );
    });
    
    it('should respect visibility scope', async () => {
      const { trpc, trpcAs } = ctx;
      
      // Create skill visible only to team-alpha
      await trpc.skill.publish.mutate({
        name: 'team-only-skill',
        description: 'Team private skill',
        version: '1.0.0',
        content: '# Skill',
        visibility: 'team',
        teamId: ctx.teams.alpha.id
      });
      
      // Team alpha member can see it
      const alphaResults = await trpcAs('alpha-member').skill.search.query({ q: 'team-only' });
      expect(alphaResults.total).toBe(1);
      
      // Team beta member cannot see it
      const betaResults = await trpcAs('beta-member').skill.search.query({ q: 'team-only' });
      expect(betaResults.total).toBe(0);
    });
  });
});
```

### 19.4 E2E Tests (Playwright)

```typescript
// Example: Critical user flow E2E tests
import { test, expect } from '@playwright/test';

test.describe('Skill Publishing Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login via SSO (mocked in test environment)
    await page.goto('/');
    await page.fill('[data-testid="email-input"]', 'alice@acme.com');
    await page.click('[data-testid="login-button"]');
    await expect(page.locator('[data-testid="user-avatar"]')).toBeVisible();
  });
  
  test('should complete full skill publish flow', async ({ page }) => {
    // Navigate to new skill page
    await page.click('[data-testid="nav-new-skill"]');
    await expect(page).toHaveURL('/skills/new');
    
    // Fill frontmatter form
    await page.fill('[data-testid="skill-name"]', 'e2e-test-skill');
    await page.fill('[data-testid="skill-description"]', 'E2E test skill');
    await page.selectOption('[data-testid="skill-classification"]', 'internal');
    await page.selectOption('[data-testid="skill-visibility"]', 'team');
    
    // Edit SKILL.md content
    await page.fill('[data-testid="skill-content"]', '# E2E Test Skill\n\n## Steps\n1. Test step');
    
    // Verify live preview
    await expect(page.locator('[data-testid="live-preview"]')).toContainText('E2E Test Skill');
    
    // Submit
    await page.click('[data-testid="submit-button"]');
    
    // Wait for validation results
    await expect(page.locator('[data-testid="validation-results"]')).toBeVisible();
    await expect(page.locator('[data-testid="validation-format"]')).toContainText('passed');
    await expect(page.locator('[data-testid="validation-security"]')).toContainText('passed');
    
    // Confirm submission
    await page.click('[data-testid="confirm-submit"]');
    
    // Verify success
    await expect(page).toHaveURL(/\/skills\/.*/);
    await expect(page.locator('[data-testid="skill-status"]')).toContainText('Pending Review');
  });
  
  test('should complete review approval flow', async ({ page }) => {
    // Navigate to review queue
    await page.click('[data-testid="nav-review"]');
    await expect(page.locator('[data-testid="review-queue"]')).toBeVisible();
    
    // Click on pending review
    await page.click('[data-testid="review-item-0"]');
    
    // Review skill details
    await expect(page.locator('[data-testid="skill-name"]')).toBeVisible();
    await expect(page.locator('[data-testid="security-report"]')).toBeVisible();
    
    // Approve
    await page.fill('[data-testid="review-comment"]', 'Looks good, approved for team access');
    await page.click('[data-testid="approve-button"]');
    
    // Verify success
    await expect(page.locator('[data-testid="toast"]')).toContainText('Skill approved');
    await expect(page).toHaveURL('/review');
  });
});
```

### 19.5 Load Testing

```typescript
// k6 load test script
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '2m', target: 50 },     // Ramp up to 50 users
    { duration: '5m', target: 100 },    // Ramp up to 100 users
    { duration: '10m', target: 200 },   // Peak: 200 users
    { duration: '5m', target: 100 },    // Ramp down
    { duration: '2m', target: 0 }       // Ramp down to 0
  ],
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'],   // 95% < 500ms, 99% < 1s
    http_req_failed: ['rate<0.01'],                     // < 1% failure rate
    checks: ['rate>0.99']                                // > 99% checks passing
  }
};

const BASE_URL = __ENV.BASE_URL || 'https://skills.acme.com';
const TOKEN = __ENV.AUTH_TOKEN;

export default function () {
  const headers = {
    'Authorization': `Bearer ${TOKEN}`,
    'Content-Type': 'application/json'
  };
  
  // Search skills
  const searchRes = http.get(`${BASE_URL}/api/trpc/skill.search?q=data`, { headers });
  check(searchRes, {
    'search status 200': (r) => r.status === 200,
    'search has results': (r) => JSON.parse(r.body).total > 0
  });
  
  sleep(1);
  
  // Get skill detail
  const skillRes = http.get(`${BASE_URL}/api/trpc/skill.getById?id=skill-123`, { headers });
  check(skillRes, {
    'skill detail status 200': (r) => r.status === 200,
    'skill has name': (r) => JSON.parse(r.body).name !== undefined
  });
  
  sleep(1);
  
  // Download skill
  const downloadRes = http.get(`${BASE_URL}/api/trpc/skill.getDownloadUrl?id=skill-123`, { headers });
  check(downloadRes, {
    'download URL status 200': (r) => r.status === 200,
    'download URL present': (r) => JSON.parse(r.body).downloadUrl !== undefined
  });
  
  sleep(2);
}
```

---

## 20. Skill Analytics & Business Intelligence

### 20.1 Metrics Dashboard

```typescript
// Analytics data model
interface SkillAnalytics {
  skillId: string;
  
  // Usage metrics
  totalInstalls: number;
  activeInstalls: number;             // Installed in last 30 days
  weeklyDownloads: number[];          // Last 12 weeks
  dailyActiveUsers: number[];         // Last 30 days
  
  // Engagement metrics
  averageRating: number;
  reviewCount: number;
  commentCount: number;
  
  // Adoption metrics
  installByTeam: { teamId: string; count: number }[];
  installByDepartment: { deptId: string; count: number }[];
  adoptionRate: number;               // % of eligible users who installed
  
  // Performance metrics
  averageLoadTime: number;            // ms
  errorRate: number;                  // %
  
  // Lifecycle metrics
  createdAt: Date;
  lastUpdated: Date;
  versionCount: number;
  timeSinceLastUpdate: number;        // days
}

// Org-level analytics
interface OrgAnalytics {
  totalSkills: number;
  activeSkills: number;               // Published and not deprecated
  pendingReviews: number;
  
  totalMembers: number;
  activeMembers: number;              // Logged in last 7 days
  
  topSkills: { skillId: string; installs: number }[];
  trendingSkills: { skillId: string; growthRate: number }[];
  
  usageByTeam: { teamId: string; skillCount: number; installCount: number }[];
  usageByCategory: { category: string; count: number }[];
  
  // Compliance metrics
  skillsWithSecurityScan: number;
  skillsWithDlpIssues: number;
  averageReviewTime: number;          // hours
}
```

### 20.2 Analytics API

```typescript
// Analytics tRPC router
const analyticsRouter = router({
  getOrgDashboard: protectedProcedure
    .input(z.object({ period: z.enum(['7d', '30d', '90d', '1y']) }))
    .query(async ({ ctx, input }) => {
      const period = parsePeriod(input.period);
      
      const [totalSkills, activeSkills, topSkills, usageByTeam, trendData] = await Promise.all([
        db.skill.count({ where: { orgId: ctx.orgId } }),
        db.skill.count({ where: { orgId: ctx.orgId, visibility: { not: 'private' } } }),
        getTopSkills(ctx.orgId, period, 10),
        getUsageByTeam(ctx.orgId, period),
        getTrendData(ctx.orgId, period)
      ]);
      
      return {
        totalSkills,
        activeSkills,
        topSkills,
        usageByTeam,
        trendData,
        period: input.period
      };
    }),
  
  getSkillAnalytics: protectedProcedure
    .input(z.object({ skillId: z.string(), period: z.enum(['7d', '30d', '90d']) }))
    .query(async ({ ctx, input }) => {
      // Verify access
      await ctx.auth.checkPermission('analytics:view', input.skillId);
      
      const [installs, downloads, ratings, adoptionByTeam] = await Promise.all([
        getInstallStats(input.skillId, input.period),
        getDownloadStats(input.skillId, input.period),
        getRatingStats(input.skillId),
        getAdoptionByTeam(input.skillId)
      ]);
      
      return { installs, downloads, ratings, adoptionByTeam };
    }),
  
  exportReport: protectedProcedure
    .input(z.object({
      type: z.enum(['skills-summary', 'usage-detail', 'compliance']),
      format: z.enum(['csv', 'pdf', 'xlsx']),
      period: z.string()
    }))
    .mutation(async ({ ctx, input }) => {
      const report = await generateReport(ctx.orgId, input);
      const url = await uploadReport(report, input.format);
      return { downloadUrl: url };
    })
});
```

### 20.3 Dashboard UI Components

```typescript
// Key dashboard components (React + Recharts)

// Top Skills Leaderboard
function TopSkillsChart({ data }: { data: TopSkill[] }) {
  return (
    <div className="rounded-lg border p-6">
      <h3 className="text-lg font-semibold mb-4">Top Skills by Installs</h3>
      <BarChart data={data} layout="vertical" width={500} height={300}>
        <XAxis type="number" />
        <YAxis type="category" dataKey="name" width={120} />
        <Bar dataKey="installs" fill="#3b82f6" radius={[0, 4, 4, 0]} />
        <Tooltip />
      </BarChart>
    </div>
  );
}

// Skill Adoption Funnel
function AdoptionFunnel({ data }: { data: FunnelData }) {
  return (
    <div className="rounded-lg border p-6">
      <h3 className="text-lg font-semibold mb-4">Skill Adoption Funnel</h3>
      <div className="space-y-2">
        <FunnelStep label="Eligible Users" value={data.eligible} total={data.eligible} />
        <FunnelStep label="Viewed Skill" value={data.viewed} total={data.eligible} />
        <FunnelStep label="Installed" value={data.installed} total={data.eligible} />
        <FunnelStep label="Active (7d)" value={data.active} total={data.eligible} />
      </div>
    </div>
  );
}

// Usage Trend Line Chart
function UsageTrendChart({ data }: { data: TrendPoint[] }) {
  return (
    <div className="rounded-lg border p-6">
      <h3 className="text-lg font-semibold mb-4">Skill Usage Trends</h3>
      <LineChart data={data} width={600} height={300}>
        <XAxis dataKey="date" />
        <YAxis />
        <Line type="monotone" dataKey="installs" stroke="#3b82f6" name="Installs" />
        <Line type="monotone" dataKey="downloads" stroke="#10b981" name="Downloads" />
        <Line type="monotone" dataKey="activeUsers" stroke="#f59e0b" name="Active Users" />
        <Tooltip />
        <Legend />
      </LineChart>
    </div>
  );
}
```

---

## 21. API Versioning & Migration Strategy

### 21.1 API Versioning Strategy

```typescript
// URL-based versioning for REST, header-based for tRPC
// REST: /api/v1/skills, /api/v2/skills
// tRPC: X-API-Version header

// Version negotiation middleware
async function apiVersionMiddleware(req: NextRequest, res: NextResponse, next: NextFunction) {
  // Extract version from URL or header
  const urlVersion = req.nextUrl.pathname.match(/^\/api\/v(\d+)/)?.[1];
  const headerVersion = req.headers.get('X-API-Version');
  
  const version = urlVersion || headerVersion || '1';
  
  // Store in request context
  req.apiVersion = parseInt(version, 10);
  
  // Check deprecation
  if (parseInt(version) < CURRENT_API_VERSION - 1) {
    res.headers.set('Warning', '299 - API version deprecated, please upgrade');
    res.headers.set('Sunset', DEPRECATION_DATES[version]);
  }
  
  next();
}

// Version-specific route handlers
const apiRoutes = {
  v1: {
    skill: v1SkillRouter,              // Legacy: returns flat skill object
    org: v1OrgRouter
  },
  v2: {
    skill: v2SkillRouter,              // Current: returns skill with nested metadata
    org: v2OrgRouter
  }
};

// v1 → v2 migration guide embedded in API
// GET /api/v1/skills returns:
{
  "skills": [
    {
      "id": "skill-123",
      "name": "data-analyzer",
      "description": "...",
      "author": "alice@acme.com",       // v1: flat string
      "version": "1.0.0"
    }
  ]
}

// GET /api/v2/skills returns:
{
  "skills": [
    {
      "id": "skill-123",
      "name": "data-analyzer",
      "description": "...",
      "author": {                        // v2: nested object
        "id": "user-456",
        "email": "alice@acme.com",
        "name": "Alice Chen",
        "team": "data-platform"
      },
      "currentVersion": {
        "version": "1.0.0",
        "publishedAt": "2026-07-20T10:00:00Z"
      },
      "classification": "internal",
      "visibility": "team"
    }
  ]
}
```

### 21.2 Data Migration Strategy

```typescript
// Database migration framework (Prisma Migrate)
// prisma/migrations/

// Example migration: Add classification field
// 20260720_add_classification/migration.sql

-- AlterTable
ALTER TABLE "skills" ADD COLUMN "classification" TEXT NOT NULL DEFAULT 'internal';

-- Backfill existing skills
UPDATE "skills" SET "classification" = 'internal' WHERE "classification" IS NULL;

-- CreateIndex
CREATE INDEX "idx_skills_classification" ON "skills"("classification");

// Migration script with data transformation
// migrations/20260725_migrate_author_field/migration.ts
export async function migrate(db: DatabaseClient) {
  // Phase 1: Add new column (nullable)
  await db.execute(`
    ALTER TABLE skills ADD COLUMN author_id_new UUID
  `);
  
  // Phase 2: Backfill data
  const skills = await db.skill.findMany({ select: { id: true, author: true } });
  
  for (const skill of skills) {
    const user = await db.user.upsert({
      where: { email: skill.author },
      create: { email: skill.author, name: skill.author.split('@')[0] },
      update: {}
    });
    
    await db.skill.update({
      where: { id: skill.id },
      data: { authorIdNew: user.id }
    });
  }
  
  // Phase 3: Swap columns
  await db.execute(`
    ALTER TABLE skills DROP COLUMN author;
    ALTER TABLE skills RENAME COLUMN author_id_new TO author_id;
    ALTER TABLE skills ALTER COLUMN author_id SET NOT NULL;
    ALTER TABLE skills ADD CONSTRAINT fk_author FOREIGN KEY (author_id) REFERENCES users(id);
  `);
}
```

### 21.3 Migration from Public Marketplace

```typescript
// Import tool for migrating skills from public QoderWork marketplace
class MarketplaceImporter {
  async importSkill(marketplaceId: string, targetOrgId: string): Promise<ImportResult> {
    // 1. Fetch from marketplace API
    const marketplaceSkill = await this.fetchFromMarketplace(marketplaceId);
    
    // 2. Transform to enterprise format
    const enterpriseSkill = this.transformForEnterprise(marketplaceSkill, targetOrgId);
    
    // 3. Validate
    const validation = await this.validator.validate(enterpriseSkill);
    if (!validation.valid) {
      return { success: false, errors: validation.errors };
    }
    
    // 4. Security scan
    const scanResult = await this.scanner.scan(enterpriseSkill);
    
    // 5. Import as draft (requires manual review)
    const imported = await this.db.skill.create({
      data: {
        ...enterpriseSkill,
        reviewStatus: 'pending',
        importSource: 'marketplace',
        importMetadata: {
          originalId: marketplaceId,
          importedAt: new Date(),
          marketplaceVersion: marketplaceSkill.version
        }
      }
    });
    
    return { success: true, skillId: imported.id, scanResult };
  }
  
  private transformForEnterprise(skill: MarketplaceSkill, orgId: string): EnterpriseSkill {
    return {
      orgId,
      name: skill.name,
      description: skill.description,
      descriptionZh: skill.descriptionCn,
      classification: 'internal',       // Default to internal
      visibility: 'team',               // Default to team-only
      tags: skill.tags || [],
      category: skill.category,
      packageUrl: skill.packageUrl,
      version: skill.version
    };
  }
}
```

---

## 22. Cost Estimation

### 22.1 Infrastructure Costs (AWS Reference)

```typescript
// Monthly cost estimate for production deployment
// Based on AWS us-east-1 pricing (July 2026)

interface CostEstimate {
  service: string;
  specification: string;
  monthlyCost: number;
  notes: string;
}

const COST_ESTIMATES: {
  small: CostEstimate[];    // < 100 users
  medium: CostEstimate[];   // 100-1000 users
  large: CostEstimate[];    // 1000+ users
} = {
  small: [
    { service: 'EKS', specification: '1 node (m5.large)', monthlyCost: 120, notes: 'Shared node' },
    { service: 'Aurora PostgreSQL', specification: 'db.t3.medium (2 vCPU, 4GB)', monthlyCost: 130, notes: 'Single AZ' },
    { service: 'ElastiCache Redis', specification: 'cache.t3.medium', monthlyCost: 95, notes: 'Single node' },
    { service: 'Elasticsearch', specification: 't3.small.search (2 nodes)', monthlyCost: 100, notes: '2 AZ' },
    { service: 'S3', specification: '~50GB storage', monthlyCost: 1.15, notes: 'Standard tier' },
    { service: 'CloudFront', specification: '~100GB transfer', monthlyCost: 9, notes: '' },
    { service: 'Route53', specification: 'Hosted zone + queries', monthlyCost: 1, notes: '' },
    { service: 'SES', specification: '~10K emails', monthlyCost: 1, notes: '' },
    { service: 'CloudWatch', specification: 'Logs + metrics', monthlyCost: 15, notes: '' },
    {
      service: 'TOTAL',
      specification: '',
      monthlyCost: 472,
      notes: '~$5,664/year'
    }
  ],
  
  medium: [
    { service: 'EKS', specification: '3 nodes (m5.xlarge)', monthlyCost: 900, notes: 'Multi-AZ' },
    { service: 'Aurora PostgreSQL', specification: 'db.r5.large (2 vCPU, 16GB)', monthlyCost: 520, notes: 'Multi-AZ + reader' },
    { service: 'ElastiCache Redis', specification: 'cache.r5.large (cluster)', monthlyCost: 380, notes: '2 nodes, Multi-AZ' },
    { service: 'Elasticsearch', specification: 'm5.large.search (3 nodes)', monthlyCost: 450, notes: '3 AZ' },
    { service: 'S3', specification: '~500GB storage', monthlyCost: 11.5, notes: 'Standard + IA' },
    { service: 'CloudFront', specification: '~1TB transfer', monthlyCost: 87, notes: '' },
    { service: 'Route53', specification: 'Hosted zone + queries', monthlyCost: 5, notes: '' },
    { service: 'SES', specification: '~100K emails', monthlyCost: 10, notes: '' },
    { service: 'CloudWatch', specification: 'Logs + metrics + alarms', monthlyCost: 75, notes: '' },
    { service: 'WAF', specification: 'Web ACL + rules', monthlyCost: 20, notes: '' },
    {
      service: 'TOTAL',
      specification: '',
      monthlyCost: 2458,
      notes: '~$29,496/year'
    }
  ],
  
  large: [
    { service: 'EKS', specification: '10+ nodes (m5.2xlarge)', monthlyCost: 4500, notes: 'Multi-AZ + HPA' },
    { service: 'Aurora PostgreSQL', specification: 'db.r5.2xlarge + readers', monthlyCost: 2100, notes: 'Global Database' },
    { service: 'ElastiCache Redis', specification: 'cache.r5.xlarge (cluster)', monthlyCost: 1500, notes: '6 nodes, Multi-AZ' },
    { service: 'Elasticsearch', specification: 'r5.2xlarge.search (5 nodes)', monthlyCost: 2500, notes: '3 AZ + cold storage' },
    { service: 'S3', specification: '~5TB storage', monthlyCost: 115, notes: 'Intelligent tiering' },
    { service: 'CloudFront', specification: '~10TB transfer', monthlyCost: 800, notes: '' },
    { service: 'Route53', specification: 'Health checks + queries', monthlyCost: 15, notes: '' },
    { service: 'SES', specification: '~1M emails', monthlyCost: 100, notes: '' },
    { service: 'CloudWatch', specification: 'Full observability stack', monthlyCost: 500, notes: '' },
    { service: 'WAF + Shield', specification: 'Advanced protection', monthlyCost: 300, notes: 'Shield Advanced' },
    { service: 'KMS', specification: 'Key management', monthlyCost: 50, notes: '' },
    { service: 'Secrets Manager', specification: '~100 secrets', monthlyCost: 40, notes: '' },
    {
      service: 'TOTAL',
      specification: '',
      monthlyCost: 12520,
      notes: '~$150,240/year'
    }
  ]
};
```

### 22.2 Cost Optimization Strategies

```typescript
// Cost optimization recommendations
const OPTIMIZATION_STRATEGIES = [
  {
    strategy: 'Reserved Instances',
    savings: '30-40%',
    description: '1-year or 3-year reserved instances for predictable workloads (RDS, ElastiCache, ES)',
    applicability: 'medium, large'
  },
  {
    strategy: 'Spot Instances for Workers',
    savings: '60-70%',
    description: 'Use Spot instances for background worker nodes (security scanning, indexing)',
    applicability: 'medium, large'
  },
  {
    strategy: 'S3 Intelligent Tiering',
    savings: '20-30%',
    description: 'Auto-move old skill versions to IA/Glacier. Most skills are downloaded within first 30 days.',
    applicability: 'all'
  },
  {
    strategy: 'Elasticsearch Cold Storage',
    savings: '50%',
    description: 'Move old skill search indices to cold storage. Only active skills need hot indices.',
    applicability: 'large'
  },
  {
    strategy: 'CloudFront Caching',
    savings: '40-60% on S3 costs',
    description: 'Cache skill downloads at edge. Reduces S3 GET requests and data transfer.',
    applicability: 'all'
  },
  {
    strategy: 'Right-sizing',
    savings: '10-30%',
    description: 'Monitor actual CPU/memory usage and adjust instance sizes. Use Compute Sav Plans.',
    applicability: 'all'
  }
];
```

---

## 23. Conclusion

The Enterprise Skills Hub provides a secure, scalable, and compliant platform for managing AI agent skills within an organization. With multi-level hierarchical organization, fine-grained RBAC/ABAC, L4 security controls, and full compliance with SOC2/ISO27001, the system enables enterprises to govern their skill ecosystem while maintaining agility and innovation.

The modular architecture allows for incremental deployment, starting with core skill management and progressively adding advanced security, compliance, and analytics features. The QoderWork-compatible skill format ensures seamless integration with existing AI agent workflows, while the enterprise-grade infrastructure provides the reliability, security, and auditability required for production use.

Key differentiators from the public marketplace include tenant isolation with row-level security, mandatory review workflows with automated security scanning, data loss prevention with classification-based controls, comprehensive audit trails with tamper-evident logging, and multi-region disaster recovery with automated failover. The CLI tool and TypeScript SDK enable seamless CI/CD integration, while the analytics dashboard provides visibility into skill adoption and usage patterns across the organization.

The 20-week phased implementation roadmap allows organizations to start with a functional MVP and progressively harden the system for enterprise requirements. Infrastructure costs scale from approximately $470/month for small deployments to $12,500/month for large multi-region installations, with multiple cost optimization strategies available.
