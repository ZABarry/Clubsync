import { randomBytes } from "crypto";
import { config } from "dotenv";
import { ClubPromotionStatus, ClubStatus, UserRole } from "@prisma/client";
import { createPrismaClient } from "../lib/db/create-prisma-client";

config({ path: ".env.local" });
config();

const prisma = createPrismaClient(
  process.env.DIRECT_URL ?? process.env.DATABASE_URL,
);

async function seedDemoUsersIfMissing() {
  const parent1 = await prisma.user.upsert({
    where: { email: "parent1@example.com" },
    create: {
      id: "00000000-0000-4000-8000-000000000001",
      email: "parent1@example.com",
      role: UserRole.PARENT,
      parentProfile: {
        create: {
          displayName: "Sarah M.",
          homePostcode: "KT3 4AA",
          latitude: 51.401,
          longitude: -0.256,
          defaultSearchRadiusKm: 10,
        },
      },
    },
    update: {},
    include: { parentProfile: true },
  });

  const parent2 = await prisma.user.upsert({
    where: { email: "parent2@example.com" },
    create: {
      id: "00000000-0000-4000-8000-000000000002",
      email: "parent2@example.com",
      role: UserRole.PARENT,
      parentProfile: {
        create: {
          displayName: "James T.",
          homePostcode: "KT1 1AA",
          latitude: 51.412,
          longitude: -0.301,
          defaultSearchRadiusKm: 8,
        },
      },
    },
    update: {},
    include: { parentProfile: true },
  });

  await prisma.user.upsert({
    where: { email: "admin@example.com" },
    create: {
      id: "00000000-0000-4000-8000-000000000003",
      email: "admin@example.com",
      role: UserRole.MASTER_ADMIN,
      parentProfile: {
        create: {
          displayName: "ClubZer Admin",
          homePostcode: "KT3 4AA",
          latitude: 51.401,
          longitude: -0.256,
        },
      },
    },
    update: { role: UserRole.MASTER_ADMIN },
  });

  await prisma.user.upsert({
    where: { email: "reviewer@example.com" },
    create: {
      id: "00000000-0000-4000-8000-000000000004",
      email: "reviewer@example.com",
      role: UserRole.REVIEWER,
      parentProfile: {
        create: {
          displayName: "Camp Reviewer",
          firstName: "Camp",
          lastName: "Reviewer",
          homePostcode: "SW15 1AA",
          latitude: 51.464,
          longitude: -0.215,
        },
      },
    },
    update: { role: UserRole.REVIEWER },
  });

  if (!parent1.parentProfile || !parent2.parentProfile) {
    console.log("Demo users present — skipped demo relationship seeding");
    return;
  }

  const existingChild = await prisma.childProfile.findFirst({
    where: { parentProfileId: parent1.parentProfile.id },
  });
  if (existingChild) {
    console.log("Demo children already exist — skipped demo relationship seeding");
    return;
  }

  const child1 = await prisma.childProfile.create({
    data: {
      parentProfileId: parent1.parentProfile.id,
      nickname: "Lily",
      age: 9,
      sex: "FEMALE",
      schoolYear: "Year 4",
      interests: ["football", "swimming", "arts"],
      availabilityStart: new Date("2026-07-01"),
      availabilityEnd: new Date("2026-08-31"),
    },
  });

  const child2 = await prisma.childProfile.create({
    data: {
      parentProfileId: parent2.parentProfile.id,
      nickname: "Oliver",
      age: 10,
      sex: "MALE",
      schoolYear: "Year 5",
      interests: ["coding", "STEM", "tennis"],
      availabilityStart: new Date("2026-07-01"),
      availabilityEnd: new Date("2026-08-31"),
    },
  });

  const sampleClubs = await prisma.club.findMany({
    where: { status: ClubStatus.ACTIVE },
    take: 4,
    orderBy: { createdAt: "asc" },
  });

  if (sampleClubs.length >= 2) {
    await prisma.plannedClub.createMany({
      data: [
        {
          parentProfileId: parent1.parentProfile.id,
          childProfileId: child1.id,
          clubId: sampleClubs[0].id,
          status: "PLANNED",
        },
        {
          parentProfileId: parent1.parentProfile.id,
          childProfileId: child1.id,
          clubId: sampleClubs[Math.min(2, sampleClubs.length - 1)].id,
          status: "INTERESTED",
        },
        {
          parentProfileId: parent2.parentProfile.id,
          childProfileId: child2.id,
          clubId: sampleClubs[0].id,
          status: "INTERESTED",
        },
        {
          parentProfileId: parent2.parentProfile.id,
          childProfileId: child2.id,
          clubId: sampleClubs[Math.min(3, sampleClubs.length - 1)].id,
          status: "BOOKED",
        },
      ],
      skipDuplicates: true,
    });

    const existingConnection = await prisma.trustedParentConnection.findFirst({
      where: {
        requesterParentId: parent1.parentProfile.id,
        recipientParentId: parent2.parentProfile.id,
      },
    });

    if (!existingConnection) {
      await prisma.trustedParentConnection.create({
        data: {
          requesterParentId: parent1.parentProfile.id,
          recipientParentId: parent2.parentProfile.id,
          status: "ACCEPTED",
          inviteToken: randomBytes(32).toString("hex"),
          acceptedAt: new Date(),
        },
      });
    }

    const existingSharedClub = await prisma.sharedClub.findFirst({
      where: {
        clubId: sampleClubs[0].id,
        createdByParentId: parent1.parentProfile.id,
      },
    });

    if (!existingSharedClub) {
      const sharedClub = await prisma.sharedClub.create({
        data: {
          clubId: sampleClubs[0].id,
          createdByParentId: parent1.parentProfile.id,
          title: "Football club buddies",
          notes: "Let's coordinate drop-off at 8:45am",
        },
      });

      await prisma.sharedClubParticipant.createMany({
        data: [
          {
            sharedClubId: sharedClub.id,
            parentProfileId: parent1.parentProfile.id,
            childProfileId: child1.id,
            status: "PLANNED",
          },
          {
            sharedClubId: sharedClub.id,
            parentProfileId: parent2.parentProfile.id,
            childProfileId: child2.id,
            status: "INTERESTED",
          },
        ],
        skipDuplicates: true,
      });
    }

    await prisma.rating.createMany({
      data: [
        {
          clubId: sampleClubs[0].id,
          parentProfileId: parent1.parentProfile.id,
          rating: 5,
          reviewText: "Lily loved it! Great coaches.",
          moderationStatus: "APPROVED",
        },
        {
          clubId: sampleClubs[Math.min(3, sampleClubs.length - 1)].id,
          parentProfileId: parent2.parentProfile.id,
          rating: 4,
          reviewText: "Really engaging coding projects.",
          moderationStatus: "APPROVED",
        },
      ],
      skipDuplicates: true,
    });
  }

  const communityProvider = await prisma.provider.upsert({
    where: { slug: "community-submission" },
    create: {
      slug: "community-submission",
      name: "Community submission",
      description: "Community-contributed clubs",
    },
    update: {},
  });

  if (parent1.parentProfile) {
    await prisma.club.upsert({
      where: {
        providerId_name_locationName: {
          providerId: communityProvider.id,
          name: "Neighbourhood Art Club",
          locationName: "Putney Library",
        },
      },
      create: {
        providerId: communityProvider.id,
        ownerParentProfileId: parent1.parentProfile.id,
        name: "Neighbourhood Art Club",
        locationName: "Putney Library",
        description: "Weekly art sessions shared by a local parent.",
        latitude: 51.463,
        longitude: -0.216,
        activities: ["art"],
        ageMin: 5,
        ageMax: 10,
        status: ClubStatus.ACTIVE,
        promotionStatus: ClubPromotionStatus.LOCAL,
      },
      update: {},
    });
  }

  console.log("Seeded demo users and sample relationships");
}

async function main() {
  console.log("Seeding demo users (clubs/providers live in the database)...");

  await seedDemoUsersIfMissing();

  const [providerCount, clubCount, activeClubCount] = await Promise.all([
    prisma.provider.count(),
    prisma.club.count(),
    prisma.club.count({ where: { status: ClubStatus.ACTIVE } }),
  ]);

  console.log(
    `Done. Database has ${providerCount} providers and ${clubCount} clubs (${activeClubCount} active).`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
