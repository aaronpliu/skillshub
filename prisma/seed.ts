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
