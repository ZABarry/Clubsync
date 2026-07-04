import { config } from "dotenv";
import { UserRole, CampStatus } from "@prisma/client";
import { createPrismaClient } from "../lib/db/create-prisma-client";

config({ path: ".env.local" });
config();

const prisma = createPrismaClient(
  process.env.DIRECT_URL ?? process.env.DATABASE_URL,
);

const LOCATIONS = [
  { name: "New Malden", lat: 51.401, lng: -0.256 },
  { name: "Kingston", lat: 51.412, lng: -0.301 },
  { name: "Wimbledon", lat: 51.421, lng: -0.206 },
  { name: "Surbiton", lat: 51.393, lng: -0.307 },
  { name: "Worcester Park", lat: 51.376, lng: -0.235 },
  { name: "Raynes Park", lat: 51.409, lng: -0.231 },
  { name: "Epsom", lat: 51.336, lng: -0.267 },
  { name: "Sutton", lat: 51.361, lng: -0.192 },
  { name: "Richmond", lat: 51.461, lng: -0.303 },
];

const ACTIVITIES = [
  "football",
  "tennis",
  "swimming",
  "coding",
  "STEM",
  "drama",
  "arts",
  "multi-activity",
  "dance",
  "gymnastics",
];

const PROVIDERS = [
  {
    name: "Kingston Grammar Sports",
    description: "Multi-sport holiday programmes for children aged 5-14.",
    website: "https://example.com/kgs-sports",
    contactEmail: "camps@kgsports.example",
    phone: "020 8546 1200",
  },
  {
    name: "Wimbledon Tennis Academy",
    description: "Professional tennis coaching camps on Wimbledon Common.",
    website: "https://example.com/wta",
    contactEmail: "hello@wta.example",
    phone: "020 8946 3300",
  },
  {
    name: "CodeCamp SW London",
    description: "Coding and robotics camps for curious young minds.",
    website: "https://example.com/codecamp",
    contactEmail: "info@codecamp.example",
    phone: "020 8942 5500",
  },
  {
    name: "Malden Active Kids",
    description: "Affordable multi-activity camps in the heart of New Malden.",
    website: "https://example.com/malden-active",
    contactEmail: "bookings@maldenactive.example",
    phone: "020 8942 1100",
  },
  {
    name: "Surrey Swim School",
    description: "Intensive swimming courses and water confidence camps.",
    website: "https://example.com/surrey-swim",
    contactEmail: "swim@surrey.example",
    phone: "01372 720800",
  },
  {
    name: "Stage & Scene Drama",
    description: "Performing arts and drama workshops for ages 6-16.",
    website: "https://example.com/stage-scene",
    contactEmail: "drama@stage-scene.example",
    phone: "020 8332 4400",
  },
  {
    name: "Richmond STEM Lab",
    description: "Science, technology and engineering holiday camps.",
    website: "https://example.com/richmond-stem",
    contactEmail: "stem@richmondlab.example",
    phone: "020 8940 2200",
  },
  {
    name: "Dance Dynamics Sutton",
    description: "Dance, gymnastics and movement camps for all abilities.",
    website: "https://example.com/dance-dynamics",
    contactEmail: "dance@dynamics.example",
    phone: "020 8643 7700",
  },
  {
    name: "Epsom Football Club",
    description: "Football development camps led by FA-qualified coaches.",
    website: "https://example.com/epsom-fc",
    contactEmail: "youth@epsomfc.example",
    phone: "01372 726000",
  },
  {
    name: "Surbiton Arts Collective",
    description: "Creative arts, crafts and design holiday programmes.",
    website: "https://example.com/surbiton-arts",
    contactEmail: "arts@surbiton.example",
    phone: "020 8399 3300",
  },
];

const CAMP_TEMPLATES = [
  { suffix: "Summer Football Camp", activities: ["football"], ageMin: 6, ageMax: 14, price: 180, outdoor: true },
  { suffix: "Tennis Week", activities: ["tennis"], ageMin: 7, ageMax: 16, price: 220, outdoor: true },
  { suffix: "Swim Intensive", activities: ["swimming"], ageMin: 5, ageMax: 12, price: 150, outdoor: false },
  { suffix: "Code Creators", activities: ["coding", "STEM"], ageMin: 8, ageMax: 14, price: 280, outdoor: false },
  { suffix: "Drama Stars", activities: ["drama", "arts"], ageMin: 6, ageMax: 12, price: 175, outdoor: false },
  { suffix: "Multi-Activity Adventure", activities: ["multi-activity"], ageMin: 5, ageMax: 11, price: 160, outdoor: true },
  { suffix: "Dance & Gymnastics", activities: ["dance", "gymnastics"], ageMin: 4, ageMax: 10, price: 140, outdoor: false },
  { suffix: "STEM Explorers", activities: ["STEM"], ageMin: 7, ageMax: 13, price: 250, outdoor: false },
  { suffix: "Art Studio Week", activities: ["arts"], ageMin: 6, ageMax: 14, price: 165, outdoor: false },
  { suffix: "Holiday Sports Mix", activities: ["football", "tennis", "multi-activity"], ageMin: 6, ageMax: 12, price: 195, outdoor: true },
];

function jitter(value: number, amount: number) {
  return value + (Math.random() - 0.5) * amount;
}

function campDates(weekOffset: number) {
  const start = new Date("2026-07-06");
  start.setDate(start.getDate() + weekOffset * 7);
  const end = new Date(start);
  end.setDate(end.getDate() + 4);
  return { startDate: start, endDate: end };
}

async function main() {
  console.log("Seeding ClubSync database...");

  await prisma.sharedCampParticipant.deleteMany();
  await prisma.sharedCamp.deleteMany();
  await prisma.plannedCamp.deleteMany();
  await prisma.trustedParentConnection.deleteMany();
  await prisma.rating.deleteMany();
  await prisma.campChangeRequest.deleteMany();
  await prisma.campSubmission.deleteMany();
  await prisma.childProfile.deleteMany();
  await prisma.parentProfile.deleteMany();
  await prisma.camp.deleteMany();
  await prisma.provider.deleteMany();
  await prisma.user.deleteMany();

  const providers = await Promise.all(
    PROVIDERS.map((p) => prisma.provider.create({ data: p })),
  );

  const camps = [];
  let weekOffset = 0;
  for (let i = 0; i < 35; i++) {
    const provider = providers[i % providers.length];
    const template = CAMP_TEMPLATES[i % CAMP_TEMPLATES.length];
    const location = LOCATIONS[i % LOCATIONS.length];
    const dates = campDates(weekOffset);
    weekOffset = (weekOffset + 1) % 8;

    const camp = await prisma.camp.create({
      data: {
        providerId: provider.id,
        name: `${location.name} ${template.suffix}`,
        description: `A fantastic ${template.activities.join(" & ")} camp in ${location.name}. Fun, safe and engaging for children aged ${template.ageMin}-${template.ageMax}.`,
        locationName: location.name,
        address: `${10 + i} High Street, ${location.name}, London`,
        latitude: jitter(location.lat, 0.008),
        longitude: jitter(location.lng, 0.008),
        activities: template.activities,
        ageMin: template.ageMin,
        ageMax: template.ageMax,
        startDate: dates.startDate,
        endDate: dates.endDate,
        dailyStartTime: "09:00",
        dailyEndTime: "15:30",
        price: template.price + (i % 3) * 15,
        bookingUrl: `https://example.com/book/${i + 1}`,
        imageUrl: `https://picsum.photos/seed/camp${i}/800/400`,
        ratingAverage: 3.5 + (i % 15) / 10,
        ratingCount: 2 + (i % 20),
        status: CampStatus.ACTIVE,
        isIndoor: !template.outdoor,
        isOutdoor: template.outdoor,
        sendFriendly: i % 5 === 0,
        accessibilityNotes: i % 7 === 0 ? "Wheelchair accessible venue" : null,
      },
    });
    camps.push(camp);
  }

  const parent1 = await prisma.user.create({
    data: {
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
    include: { parentProfile: true },
  });

  const parent2 = await prisma.user.create({
    data: {
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
    include: { parentProfile: true },
  });

  await prisma.user.create({
    data: {
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
  });

  const child1 = await prisma.childProfile.create({
    data: {
      parentProfileId: parent1.parentProfile!.id,
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
      parentProfileId: parent2.parentProfile!.id,
      nickname: "Oliver",
      age: 10,
      schoolYear: "Year 5",
      interests: ["coding", "STEM", "tennis"],
      availabilityStart: new Date("2026-07-01"),
      availabilityEnd: new Date("2026-08-31"),
    },
  });

  await prisma.plannedCamp.createMany({
    data: [
      {
        parentProfileId: parent1.parentProfile!.id,
        childProfileId: child1.id,
        campId: camps[0].id,
        status: "PLANNED",
      },
      {
        parentProfileId: parent1.parentProfile!.id,
        childProfileId: child1.id,
        campId: camps[2].id,
        status: "INTERESTED",
      },
      {
        parentProfileId: parent2.parentProfile!.id,
        childProfileId: child2.id,
        campId: camps[0].id,
        status: "INTERESTED",
      },
      {
        parentProfileId: parent2.parentProfile!.id,
        childProfileId: child2.id,
        campId: camps[3].id,
        status: "BOOKED",
      },
    ],
  });

  await prisma.trustedParentConnection.create({
    data: {
      requesterParentId: parent1.parentProfile!.id,
      recipientParentId: parent2.parentProfile!.id,
      status: "ACCEPTED",
      inviteToken: "a".repeat(64),
      acceptedAt: new Date(),
    },
  });

  const sharedCamp = await prisma.sharedCamp.create({
    data: {
      campId: camps[0].id,
      createdByParentId: parent1.parentProfile!.id,
      title: "Football camp buddies",
      notes: "Let's coordinate drop-off at 8:45am",
    },
  });

  await prisma.sharedCampParticipant.createMany({
    data: [
      {
        sharedCampId: sharedCamp.id,
        parentProfileId: parent1.parentProfile!.id,
        childProfileId: child1.id,
        status: "PLANNED",
      },
      {
        sharedCampId: sharedCamp.id,
        parentProfileId: parent2.parentProfile!.id,
        childProfileId: child2.id,
        status: "INTERESTED",
      },
    ],
  });

  await prisma.rating.createMany({
    data: [
      {
        campId: camps[0].id,
        parentProfileId: parent1.parentProfile!.id,
        rating: 5,
        reviewText: "Lily loved it! Great coaches.",
        moderationStatus: "APPROVED",
      },
      {
        campId: camps[3].id,
        parentProfileId: parent2.parentProfile!.id,
        rating: 4,
        reviewText: "Really engaging coding projects.",
        moderationStatus: "APPROVED",
      },
    ],
  });

  console.log(`Seeded ${providers.length} providers, ${camps.length} camps, 3 users`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
