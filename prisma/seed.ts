import { readFileSync } from "node:fs";
import { join } from "node:path";
import { config } from "dotenv";
import { ClubStatus, UserRole } from "@prisma/client";
import { createPrismaClient } from "../lib/db/create-prisma-client";

config({ path: ".env.local" });
config();

const prisma = createPrismaClient(
  process.env.DIRECT_URL ?? process.env.DATABASE_URL,
);

type ProviderSeed = {
  providerId: string;
  name: string;
  website?: string;
  contactEmail?: string;
  phone?: string;
  sourceUrl?: string;
};

type ClubSeed = {
  providerId: string;
  name: string;
  locationName: string;
  address?: string;
  lat: number;
  lon: number;
  activities: string;
  ageMin: number;
  ageMax: number;
  startDate?: string;
  endDate?: string;
  dailyStartTime?: string;
  dailyEndTime?: string;
  priceFrom?: string;
  bookingUrl?: string;
  description?: string;
  sourceUrl?: string;
  dataConfidence?: string;
  ratingAverage?: string | number;
  ratingCount?: number;
  status?: string;
  indoorOutdoor?: string;
  sendFriendly?: string;
};

function loadJson<T>(filename: string): T {
  const filePath = join(__dirname, "seed-data", filename);
  return JSON.parse(readFileSync(filePath, "utf-8")) as T;
}

function emptyToNull(value?: string): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function parseDate(value?: string): Date | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  const parsed = new Date(`${trimmed}T00:00:00.000Z`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function parseActivities(value?: string): string[] {
  if (!value?.trim()) return [];
  return value
    .split(";")
    .map((activity) => activity.trim().toLowerCase())
    .filter(Boolean);
}

function parsePriceFrom(priceFrom?: string): {
  price: number | null;
  priceNote: string | null;
  dailyRate: number | null;
} {
  const note = emptyToNull(priceFrom);
  if (!note) return { price: null, priceNote: null, dailyRate: null };
  const match = note.match(/(\d+(?:\.\d+)?)/);
  const price = match ? Number.parseFloat(match[1]) : null;
  const lower = note.toLowerCase();
  const dailyRate =
    price != null && (lower.includes("per day") || lower.includes("/ day"))
      ? price
      : null;
  return {
    price,
    priceNote: note,
    dailyRate,
  };
}

function parseClubStatus(status?: string): ClubStatus {
  switch (status?.trim().toLowerCase()) {
    case "draft":
      return ClubStatus.DRAFT;
    case "archived":
      return ClubStatus.ARCHIVED;
    default:
      return ClubStatus.ACTIVE;
  }
}

function parseIndoorOutdoor(value?: string): {
  isIndoor: boolean;
  isOutdoor: boolean;
} {
  switch (value?.trim().toLowerCase()) {
    case "indoor":
      return { isIndoor: true, isOutdoor: false };
    case "outdoor":
      return { isIndoor: false, isOutdoor: true };
    default:
      return { isIndoor: true, isOutdoor: true };
  }
}

function parseSendFriendly(value?: string): boolean {
  return value?.trim().toLowerCase() === "yes";
}

function parseRatingAverage(value?: string | number): number {
  if (typeof value === "number" && !Number.isNaN(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number.parseFloat(value);
    if (!Number.isNaN(parsed)) return parsed;
  }
  return 0;
}

async function upsertProvider(provider: ProviderSeed) {
  const slug = provider.providerId.trim();
  const data = {
    slug,
    name: provider.name.trim(),
    website: emptyToNull(provider.website),
    contactEmail: emptyToNull(provider.contactEmail),
    phone: emptyToNull(provider.phone),
    sourceUrl: emptyToNull(provider.sourceUrl),
  };

  const bySlug = await prisma.provider.findUnique({ where: { slug } });
  if (bySlug) {
    return prisma.provider.update({ where: { id: bySlug.id }, data });
  }

  const byName = await prisma.provider.findFirst({
    where: { name: provider.name.trim() },
  });
  if (byName) {
    return prisma.provider.update({ where: { id: byName.id }, data });
  }

  return prisma.provider.create({ data });
}

async function seedProvidersFromJson() {
  const providers = loadJson<ProviderSeed[]>("providers.json");
  const providerIdBySlug = new Map<string, string>();

  for (const provider of providers) {
    const record = await upsertProvider(provider);
    providerIdBySlug.set(provider.providerId, record.id);
  }

  console.log(`Upserted ${providers.length} providers from seed data`);
  return providerIdBySlug;
}

async function seedClubsFromJson(providerIdBySlug: Map<string, string>) {
  const clubs = loadJson<ClubSeed[]>("clubs.json");
  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const club of clubs) {
    const providerId = providerIdBySlug.get(club.providerId);
    if (!providerId) {
      console.warn(
        `Skipping club "${club.name}" — unknown provider slug "${club.providerId}"`,
      );
      skipped += 1;
      continue;
    }

    const { price, priceNote, dailyRate } = parsePriceFrom(club.priceFrom);
    const { isIndoor, isOutdoor } = parseIndoorOutdoor(club.indoorOutdoor);
    const data = {
      providerId,
      name: club.name.trim(),
      locationName: club.locationName.trim(),
      description: emptyToNull(club.description),
      address: emptyToNull(club.address),
      latitude: club.lat,
      longitude: club.lon,
      activities: parseActivities(club.activities),
      ageMin: club.ageMin,
      ageMax: club.ageMax,
      startDate: parseDate(club.startDate),
      endDate: parseDate(club.endDate),
      dailyStartTime: emptyToNull(club.dailyStartTime),
      dailyEndTime: emptyToNull(club.dailyEndTime),
      price,
      dailyRate,
      priceNote,
      bookingUrl: emptyToNull(club.bookingUrl),
      sourceUrl: emptyToNull(club.sourceUrl),
      dataConfidence: emptyToNull(club.dataConfidence),
      ratingAverage: parseRatingAverage(club.ratingAverage),
      ratingCount: club.ratingCount ?? 0,
      status: parseClubStatus(club.status),
      isIndoor,
      isOutdoor,
      sendFriendly: parseSendFriendly(club.sendFriendly),
    };

    const existing = await prisma.club.findUnique({
      where: {
        providerId_name_locationName: {
          providerId,
          name: data.name,
          locationName: data.locationName,
        },
      },
    });

    if (existing) {
      await prisma.club.update({
        where: { id: existing.id },
        data,
      });
      updated += 1;
    } else {
      await prisma.club.create({ data });
      created += 1;
    }
  }

  console.log(
    `Upserted ${clubs.length} clubs (${created} created, ${updated} updated, ${skipped} skipped)`,
  );
}

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
      role: UserRole.ADMIN,
      parentProfile: {
        create: {
          displayName: "ClubZer Admin",
          homePostcode: "KT3 4AA",
          latitude: 51.401,
          longitude: -0.256,
        },
      },
    },
    update: {},
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
          inviteToken: "a".repeat(64),
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

  console.log("Seeded demo users and sample relationships");
}

async function main() {
  console.log("Seeding ClubZer database from JSON (upsert, no deletes)...");

  const providerIdBySlug = await seedProvidersFromJson();
  await seedClubsFromJson(providerIdBySlug);
  await seedDemoUsersIfMissing();

  const [providerCount, clubCount, activeClubCount] = await Promise.all([
    prisma.provider.count(),
    prisma.club.count(),
    prisma.club.count({ where: { status: ClubStatus.ACTIVE } }),
  ]);

  console.log(
    `Done. Database now has ${providerCount} providers and ${clubCount} clubs (${activeClubCount} active).`,
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
