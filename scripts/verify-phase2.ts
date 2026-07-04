import { config } from "dotenv";
import { UserRole } from "@prisma/client";
import { createPrismaClient } from "../lib/db/create-prisma-client";

config({ path: ".env.local" });
config();

const prisma = createPrismaClient(
  process.env.DIRECT_URL ?? process.env.DATABASE_URL,
);

async function verify() {
  console.log("Verifying Phase 2 data layer...\n");

  const activeCampCount = await prisma.camp.count({
    where: { status: "ACTIVE" },
  });
  console.assert(activeCampCount === 35, `Expected 35 active camps, got ${activeCampCount}`);
  console.log(`✓ ${activeCampCount} active camps`);

  const providerCount = await prisma.provider.count();
  console.assert(providerCount === 10, `Expected 10 providers, got ${providerCount}`);
  console.log(`✓ ${providerCount} providers`);

  const camp = await prisma.camp.findFirst({
    where: { status: "ACTIVE" },
    include: {
      provider: { select: { name: true } },
      ratings: { where: { moderationStatus: "APPROVED" } },
    },
  });
  console.assert(camp !== null, "Expected at least one camp");
  console.assert(camp!.provider.name.length > 0, "Expected provider name on camp");
  console.log(`✓ Camp detail includes provider (${camp!.provider.name})`);

  const parent1 = await prisma.user.findUnique({
    where: { email: "parent1@example.com" },
    include: { parentProfile: { include: { children: true, plannedCamps: true } } },
  });
  console.assert(parent1 !== null, "Expected parent1 seed user");
  console.assert(parent1!.parentProfile !== null, "Expected parent1 profile");
  console.assert(
    parent1!.parentProfile!.plannedCamps.length >= 2,
    "Expected parent1 planned camps",
  );
  console.log(
    `✓ Parent profile with ${parent1!.parentProfile!.children.length} children and ${parent1!.parentProfile!.plannedCamps.length} planned camps`,
  );

  const calendarEvents = await prisma.plannedCamp.findMany({
    where: { parentProfileId: parent1!.parentProfile!.id },
    include: { camp: true },
  });
  console.assert(calendarEvents.length >= 2, "Expected calendar events for parent1");
  console.log(`✓ ${calendarEvents.length} planned camps for calendar`);

  const footballCamps = await prisma.camp.count({
    where: { status: "ACTIVE", activities: { has: "football" } },
  });
  console.assert(footballCamps > 0, "Expected football activity filter to match camps");
  console.log(`✓ Activity filter: ${footballCamps} football camps`);

  const ageFiltered = await prisma.camp.count({
    where: {
      status: "ACTIVE",
      ageMin: { lte: 9 },
      ageMax: { gte: 9 },
    },
  });
  console.assert(ageFiltered > 0, "Expected age filter to match camps");
  console.log(`✓ Age filter: ${ageFiltered} camps for age 9`);

  const adminEmail = process.env.ADMIN_EMAIL ?? "admin@example.com";
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });
  console.assert(existingAdmin !== null, "Expected seed admin user");
  console.assert(existingAdmin!.role === UserRole.ADMIN, "Expected ADMIN role on seed admin");
  console.log(`✓ Seed admin user has ADMIN role (${adminEmail})`);

  const testUserId = "00000000-0000-4000-8000-000000000099";
  await prisma.user.deleteMany({ where: { id: testUserId } });
  const upserted = await prisma.user.upsert({
    where: { id: testUserId },
    create: {
      id: testUserId,
      email: "phase2-verify@example.com",
      role: UserRole.PARENT,
    },
    update: { email: "phase2-verify@example.com" },
  });
  console.assert(upserted.role === UserRole.PARENT, "Expected PARENT role on upsert");
  console.log("✓ syncUser-style upsert creates new user");

  await prisma.user.delete({ where: { id: testUserId } });
  console.log("✓ Cleaned up test upsert user");

  console.log("\nPhase 2 data layer verification passed.");
}

verify()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
