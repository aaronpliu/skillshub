import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // =========================================================================
  // Create Organization
  // =========================================================================
  const org = await db.organization.upsert({
    where: { slug: "acme-corp" },
    update: {},
    create: {
      name: "Acme Corp",
      slug: "acme-corp",
      domain: "acme.com",
      plan: "enterprise",
      settings: {
        defaultVisibility: "team",
        requireReview: true,
        maxSkillSize: 10 * 1024 * 1024, // 10MB
        allowedFileTypes: [".skill", ".md", ".py", ".js", ".ts", ".sh"],
      },
    },
  });
  console.log("Created organization:", org.name);

  // =========================================================================
  // Create Business Units
  // =========================================================================
  const cloudBU = await db.businessUnit.create({
    data: { orgId: org.id, name: "Cloud Division", slug: "cloud-division" },
  });
  const dataBU = await db.businessUnit.create({
    data: { orgId: org.id, name: "Data & AI", slug: "data-ai" },
  });
  console.log("Created business units");

  // =========================================================================
  // Create Departments
  // =========================================================================
  const engDept = await db.department.create({
    data: { orgId: org.id, buId: cloudBU.id, name: "Engineering", slug: "engineering" },
  });
  const productDept = await db.department.create({
    data: { orgId: org.id, buId: cloudBU.id, name: "Product", slug: "product" },
  });
  const dataDept = await db.department.create({
    data: { orgId: org.id, buId: dataBU.id, name: "Data Science", slug: "data-science" },
  });
  console.log("Created departments");

  // =========================================================================
  // Create Teams
  // =========================================================================
  const platformTeam = await db.team.create({
    data: { orgId: org.id, deptId: engDept.id, name: "Platform Team", slug: "platform-team" },
  });
  const aiTeam = await db.team.create({
    data: { orgId: org.id, deptId: dataDept.id, name: "AI Team", slug: "ai-team" },
  });
  const frontendTeam = await db.team.create({
    data: { orgId: org.id, deptId: engDept.id, name: "Frontend Team", slug: "frontend-team" },
  });
  console.log("Created teams");

  // =========================================================================
  // Create Users
  // =========================================================================
  const passwordHash = await bcrypt.hash("password123", 12);

  const alice = await db.user.upsert({
    where: { email: "alice@acme.com" },
    update: {},
    create: {
      email: "alice@acme.com",
      name: "Alice Chen",
      passwordHash,
    },
  });

  const bob = await db.user.upsert({
    where: { email: "bob@acme.com" },
    update: {},
    create: {
      email: "bob@acme.com",
      name: "Bob Smith",
      passwordHash,
    },
  });

  const carol = await db.user.upsert({
    where: { email: "carol@acme.com" },
    update: {},
    create: {
      email: "carol@acme.com",
      name: "Carol Lee",
      passwordHash,
    },
  });

  const dave = await db.user.upsert({
    where: { email: "dave@acme.com" },
    update: {},
    create: {
      email: "dave@acme.com",
      name: "Dave Park",
      passwordHash,
    },
  });

  const eve = await db.user.upsert({
    where: { email: "eve@acme.com" },
    update: {},
    create: {
      email: "eve@acme.com",
      name: "Eve Wang",
      passwordHash,
    },
  });
  console.log("Created users");

  // =========================================================================
  // Create Memberships
  // =========================================================================
  await db.member.upsert({
    where: { orgId_userId: { orgId: org.id, userId: alice.id } },
    update: {},
    create: {
      orgId: org.id,
      userId: alice.id,
      role: "owner",
      buId: cloudBU.id,
      deptId: engDept.id,
      teamIds: [platformTeam.id],
    },
  });

  await db.member.upsert({
    where: { orgId_userId: { orgId: org.id, userId: bob.id } },
    update: {},
    create: {
      orgId: org.id,
      userId: bob.id,
      role: "admin",
      buId: dataBU.id,
      deptId: dataDept.id,
      teamIds: [aiTeam.id],
    },
  });

  await db.member.upsert({
    where: { orgId_userId: { orgId: org.id, userId: carol.id } },
    update: {},
    create: {
      orgId: org.id,
      userId: carol.id,
      role: "member",
      buId: cloudBU.id,
      deptId: engDept.id,
      teamIds: [platformTeam.id],
    },
  });

  await db.member.upsert({
    where: { orgId_userId: { orgId: org.id, userId: dave.id } },
    update: {},
    create: {
      orgId: org.id,
      userId: dave.id,
      role: "member",
      buId: cloudBU.id,
      deptId: engDept.id,
      teamIds: [frontendTeam.id],
    },
  });

  await db.member.upsert({
    where: { orgId_userId: { orgId: org.id, userId: eve.id } },
    update: {},
    create: {
      orgId: org.id,
      userId: eve.id,
      role: "viewer",
      buId: cloudBU.id,
      deptId: productDept.id,
      teamIds: [],
    },
  });
  console.log("Created memberships");

  // =========================================================================
  // Create Roles
  // =========================================================================
  const systemRoles = [
    { name: "owner", description: "Full access to everything", permissions: ["*"] },
    { name: "admin", description: "Organization administrator", permissions: ["org:*", "skill:*", "review:*", "audit:*"] },
    { name: "bu_admin", description: "Business unit administrator", permissions: ["bu:*", "skill:*", "review:*"] },
    { name: "dept_admin", description: "Department administrator", permissions: ["dept:*", "skill:*", "review:*"] },
    { name: "team_admin", description: "Team administrator", permissions: ["team:*", "skill:own:*", "review:team:*"] },
    { name: "member", description: "Regular member", permissions: ["skill:own:*", "skill:read:team", "review:team:*"] },
    { name: "viewer", description: "Read-only access", permissions: ["skill:read:visible"] },
  ];

  for (const role of systemRoles) {
    await db.role.upsert({
      where: { orgId_name: { orgId: org.id, name: role.name } },
      update: {},
      create: {
        orgId: org.id,
        name: role.name,
        description: role.description,
        permissions: role.permissions,
        isSystem: true,
      },
    });
  }
  console.log("Created roles");

  // =========================================================================
  // Create Sample Skills
  // =========================================================================
  const skills = [
    {
      name: "data-analyzer",
      description: "Analyze CSV/Excel data and generate insights with charts and statistical analysis. Use when processing datasets.",
      category: "Analytics",
      tags: ["data", "csv", "excel", "analytics"],
      visibility: "organization",
      classification: "internal",
      authorId: alice.id,
      teamId: platformTeam.id,
      deptId: engDept.id,
      buId: cloudBU.id,
      content: `---
name: data-analyzer
description: Analyze CSV/Excel data and generate insights with charts and statistical analysis
version: 1.0.0
---

# Data Analyzer

Analyze CSV/Excel data and generate insights with charts and statistical analysis.

## When to Use
- Processing CSV or Excel datasets
- Generating statistical summaries and charts
- Exploring data distributions and correlations

## Steps
1. Load the dataset using the provided file path
2. Run automatic data quality checks (missing values, outliers)
3. Generate summary statistics and visualizations
4. Export insights as markdown or JSON

## Pitfalls
- Large datasets (>100MB) may require chunked processing
- Date columns should be pre-formatted as ISO 8601

## Verification
- Check that output charts render correctly
- Verify summary statistics match expected ranges`,
    },
    {
      name: "pdf-processor",
      description: "Process PDF documents: extract text, merge, split, watermark. Use when working with PDF files.",
      category: "Document",
      tags: ["pdf", "document"],
      visibility: "organization",
      classification: "internal",
      authorId: bob.id,
      teamId: aiTeam.id,
      deptId: dataDept.id,
      buId: dataBU.id,
      content: `---
name: pdf-processor
description: Process PDF documents - extract text, merge, split, watermark
version: 1.0.0
---

# PDF Processor

Process PDF documents: extract text, merge, split, watermark.

## When to Use
- Extracting text content from PDF files
- Merging multiple PDFs into one document
- Splitting large PDFs into smaller sections
- Adding watermarks to PDF pages

## Steps
1. Specify the operation (extract, merge, split, watermark)
2. Provide input file path(s)
3. Configure operation-specific options
4. Execute and receive output file

## Pitfalls
- Scanned PDFs require OCR before text extraction
- Password-protected PDFs need decryption key

## Verification
- Verify output file opens correctly in a PDF reader
- Check page count matches expectations`,
    },
    {
      name: "api-integration",
      description: "Helper for integrating with REST APIs with authentication and retry logic. Use when connecting to external services.",
      category: "Integration",
      tags: ["api", "rest", "http"],
      visibility: "organization",
      classification: "internal",
      authorId: carol.id,
      teamId: platformTeam.id,
      deptId: engDept.id,
      buId: cloudBU.id,
      content: `---
name: api-integration
description: Helper for integrating with REST APIs with auth and retry logic
version: 1.0.0
---

# API Integration

Helper for integrating with REST APIs with authentication and retry logic.

## When to Use
- Connecting to external REST APIs
- Setting up authenticated HTTP clients
- Implementing retry logic for flaky endpoints

## Steps
1. Configure the API endpoint and authentication method
2. Define request/response schemas
3. Set up retry policies (max retries, backoff)
4. Test with a health check endpoint

## Pitfalls
- Always validate SSL certificates in production
- Rate limiting should be respected to avoid bans

## Verification
- Confirm successful authentication handshake
- Verify retry logic handles 429/503 responses`,
    },
    {
      name: "code-reviewer",
      description: "Automated code review following team standards and best practices. Use when reviewing pull requests.",
      category: "Development",
      tags: ["code", "review", "quality"],
      visibility: "department",
      classification: "internal",
      authorId: dave.id,
      teamId: frontendTeam.id,
      deptId: engDept.id,
      buId: cloudBU.id,
      content: `---
name: code-reviewer
description: Automated code review following team standards
version: 1.0.0
---

# Code Reviewer

Automated code review following team standards and best practices.

## When to Use
- Reviewing pull requests for code quality
- Checking adherence to team coding standards
- Identifying potential bugs or security issues

## Steps
1. Analyze the diff for code changes
2. Check for common anti-patterns and style violations
3. Verify test coverage for new code
4. Generate review summary with actionable feedback

## Pitfalls
- Auto-generated code should be excluded from style checks
- Large diffs may need to be reviewed in chunks

## Verification
- All flagged issues should have clear fix suggestions
- Review report should be actionable within 5 minutes`,
    },
    {
      name: "report-generator",
      description: "Generate weekly and monthly reports from multiple data sources. Use when creating business reports.",
      category: "Analytics",
      tags: ["report", "analytics"],
      visibility: "organization",
      classification: "confidential",
      authorId: eve.id,
      teamId: undefined,
      deptId: productDept.id,
      buId: cloudBU.id,
      content: `---
name: report-generator
description: Generate weekly and monthly reports from multiple data sources
version: 1.0.0
---

# Report Generator

Generate weekly and monthly reports from multiple data sources.

## When to Use
- Creating weekly status reports
- Generating monthly business summaries
- Compiling data from multiple sources into one document

## Steps
1. Select report template (weekly, monthly, custom)
2. Configure data sources and date range
3. Generate report with charts and summaries
4. Export as PDF or share via link

## Pitfalls
- Ensure all data sources are accessible
- Large reports may take time to generate

## Verification
- Verify all data sources are included
- Check that charts render with correct data`,
    },
  ];

  for (const skillData of skills) {
    const skill = await db.skill.create({
      data: {
        orgId: org.id,
        name: skillData.name,
        description: skillData.description,
        category: skillData.category,
        tags: skillData.tags,
        visibility: skillData.visibility,
        classification: skillData.classification,
        authorId: skillData.authorId,
        teamId: skillData.teamId,
        deptId: skillData.deptId,
        buId: skillData.buId,
        status: "approved",
        installCount: Math.floor(Math.random() * 200),
        rating: 3.5 + Math.random() * 1.5,
        ratingCount: Math.floor(Math.random() * 30),
        versions: {
          create: {
            version: "1.0.0",
            changelog: "Initial release",
            content: skillData.content,
            packageUrl: "",
            packageHash: crypto.randomUUID(),
            packageSize: 1024,
            manifest: { name: skillData.name, version: "1.0.0" },
            publishedBy: skillData.authorId,
            reviewStatus: "approved",
          },
        },
      },
    });
    console.log("Created skill:", skill.name);
  }

  // =========================================================================
  // Create Sample Audit Logs
  // =========================================================================
  const auditActions = ["auth.login", "skill.create", "skill.publish", "review.approve"];
  for (let i = 0; i < 20; i++) {
    await db.auditLog.create({
      data: {
        orgId: org.id,
        actorId: alice.id,
        actorEmail: "alice@acme.com",
        actorIp: "192.168.1.100",
        action: auditActions[Math.floor(Math.random() * auditActions.length)],
        resource: { type: "skill", id: crypto.randomUUID() },
        result: "success",
        signature: crypto.randomUUID(),
        timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
      },
    });
  }
  console.log("Created audit logs");

  console.log("\nSeed completed successfully!");
  console.log("\nLogin credentials:");
  console.log("  Email: alice@acme.com");
  console.log("  Password: password123");
  console.log("  Org Slug: acme-corp");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
