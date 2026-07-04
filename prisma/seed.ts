import { readFileSync } from "node:fs";
import { join } from "node:path";
import { config } from "dotenv";
import { CampStatus, UserRole } from "@prisma/client";
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

type CampSeed = {
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
} {
  const note = emptyToNull(priceFrom);
  if (!note) return { price: null, priceNote: null };
  const match = note.match(/(\d+(?:\.\d+)?)/);
  return {
    price: match ? Number.parseFloat(match[1]) : null,
    priceNote: note,
  };
}

function parseCampStatus(status?: string): CampStatus {
  switch (status?.trim().toLowerCase()) {
    case "draft":
      return CampStatus.DRAFT;
    case "archived":
      return CampStatus.ARCHIVED;
    default:
      return CampStatus.ACTIVE;
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

async function seedCampsFromJson(providerIdBySlug: Map<string, string>) {
  const camps = loadJson<CampSeed[]>("camps.json");
  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const camp of camps) {
    const providerId = providerIdBySlug.get(camp.providerId);
    if (!providerId) {
      console.warn(
        `Skipping camp "${camp.name}" — unknown provider slug "${camp.providerId}"`,
      );
      skipped += 1;
      continue;
    }

    const { price, priceNote } = parsePriceFrom(camp.priceFrom);
    const { isIndoor, isOutdoor } = parseIndoorOutdoor(camp.indoorOutdoor);
    const data = {
      providerId,
      name: camp.name.trim(),
      locationName: camp.locationName.trim(),
      description: emptyToNull(camp.description),
      address: emptyToNull(camp.address),
      latitude: camp.lat,
      longitude: camp.lon,
      activities: parseActivities(camp.activities),
      ageMin: camp.ageMin,
      ageMax: camp.ageMax,
      startDate: parseDate(camp.startDate),
      endDate: parseDate(camp.endDate),
      dailyStartTime: emptyToNull(camp.dailyStartTime),
      dailyEndTime: emptyToNull(camp.dailyEndTime),
      price,
      priceNote,
      bookingUrl: emptyToNull(camp.bookingUrl),
      sourceUrl: emptyToNull(camp.sourceUrl),
      dataConfidence: emptyToNull(camp.dataConfidence),
      ratingAverage: parseRatingAverage(camp.ratingAverage),
      ratingCount: camp.ratingCount ?? 0,
      status: parseCampStatus(camp.status),
      isIndoor,
      isOutdoor,
      sendFriendly: parseSendFriendly(camp.sendFriendly),
    };

    const existing = await prisma.camp.findUnique({
      where: {
        providerId_name_locationName: {
          providerId,
          name: data.name,
          locationName: data.locationName,
        },
      },
    });

    if (existing) {
      await prisma.camp.update({
        where: { id: existing.id },
        data,
      });
      updated += 1;
    } else {
      await prisma.camp.create({ data });
      created += 1;
    }
  }

  console.log(
    `Upserted ${camps.length} camps (${created} created, ${updated} updated, ${skipped} skipped)`,
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
          displayName: "ClubSync Admin",
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

  const sampleCamps = await prisma.camp.findMany({
    where: { status: CampStatus.ACTIVE },
    take: 4,
    orderBy: { createdAt: "asc" },
  });

  if (sampleCamps.length >= 2) {
    await prisma.plannedCamp.createMany({
      data: [
        {
          parentProfileId: parent1.parentProfile.id,
          childProfileId: child1.id,
          campId: sampleCamps[0].id,
          status: "PLANNED",
        },
        {
          parentProfileId: parent1.parentProfile.id,
          childProfileId: child1.id,
          campId: sampleCamps[Math.min(2, sampleCamps.length - 1)].id,
          status: "INTERESTED",
        },
        {
          parentProfileId: parent2.parentProfile.id,
          childProfileId: child2.id,
          campId: sampleCamps[0].id,
          status: "INTERESTED",
        },
        {
          parentProfileId: parent2.parentProfile.id,
          childProfileId: child2.id,
          campId: sampleCamps[Math.min(3, sampleCamps.length - 1)].id,
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

    const existingSharedCamp = await prisma.sharedCamp.findFirst({
      where: {
        campId: sampleCamps[0].id,
        createdByParentId: parent1.parentProfile.id,
      },
    });

    if (!existingSharedCamp) {
      const sharedCamp = await prisma.sharedCamp.create({
        data: {
          campId: sampleCamps[0].id,
          createdByParentId: parent1.parentProfile.id,
          title: "Football camp buddies",
          notes: "Let's coordinate drop-off at 8:45am",
        },
      });

      await prisma.sharedCampParticipant.createMany({
        data: [
          {
            sharedCampId: sharedCamp.id,
            parentProfileId: parent1.parentProfile.id,
            childProfileId: child1.id,
            status: "PLANNED",
          },
          {
            sharedCampId: sharedCamp.id,
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
          campId: sampleCamps[0].id,
          parentProfileId: parent1.parentProfile.id,
          rating: 5,
          reviewText: "Lily loved it! Great coaches.",
          moderationStatus: "APPROVED",
        },
        {
          campId: sampleCamps[Math.min(3, sampleCamps.length - 1)].id,
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
  console.log("Seeding ClubSync database from JSON (upsert, no deletes)...");

  const providerIdBySlug = await seedProvidersFromJson();
  await seedCampsFromJson(providerIdBySlug);
  await seedDemoUsersIfMissing();

  const [providerCount, campCount, activeCampCount] = await Promise.all([
    prisma.provider.count(),
    prisma.camp.count(),
    prisma.camp.count({ where: { status: CampStatus.ACTIVE } }),
  ]);

  console.log(
    `Done. Database now has ${providerCount} providers and ${campCount} camps (${activeCampCount} active).`,
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
