/**
 * Import Playball summer camp venues within 15 miles of New Malden.
 * Run: npx tsx scripts/import-playball-venues.ts
 */
import { config } from "dotenv";
import { ClubPromotionStatus, ClubStatus } from "@prisma/client";
import { decideClubPublishStatus } from "../lib/clubs/club-publish-rules";
import {
  distanceFromNewMaldenKm,
  geocodePostcode,
  isWithinRadius,
  MAX_RADIUS_KM,
} from "../lib/clubs/geo-utils";
import { createPrismaClient } from "../lib/db/create-prisma-client";

config({ path: ".env.local" });
config();

const PROVIDER_SLUG = "prov_playball";
const BOOKING_URL =
  "https://www.playballkids.com/find-classes.php?postcode=KT33HL&radius=15&termtime=Summer&agegroup=All+Ages&dow=-1&tod=Any+Time+&login=login&type=camps";
const ACTIVITIES = ["multi-sport", "ball skills", "coordination", "games"];
const IMAGE_URL = "https://www.playballkids.com/images/images-camps-header.png";

type PlayballVenue = {
  name: string;
  locationName: string;
  address: string;
  postcode: string;
  startDate: string;
  endDate: string;
  dailyStartTime: string;
  dailyEndTime: string;
  ageMin: number;
  ageMax: number;
  priceNote: string;
};

const VENUES: PlayballVenue[] = [
  {
    name: "Playball Summer Camp Raynes Park Scout Hut",
    locationName: "19th Wimbledon Scout Hut",
    address: "19th Wimbledon Scout Hut, 106 Cottenham Park Road, Raynes Park, London",
    postcode: "SW20 0TH",
    startDate: "2026-07-20",
    endDate: "2026-08-27",
    dailyStartTime: "10:00",
    dailyEndTime: "14:00",
    ageMin: 3,
    ageMax: 9,
    priceNote: "Summer 2026 multi-sport camp Mon-Fri blocks; book via playballkids.com",
  },
  {
    name: "Playball Summer Camp Cheam Common Infants",
    locationName: "Cheam Common Infants School",
    address: "Cheam Common Infants School, Balmoral Road, Sutton",
    postcode: "SM2 6BH",
    startDate: "2026-07-20",
    endDate: "2026-08-13",
    dailyStartTime: "10:00",
    dailyEndTime: "13:00",
    ageMin: 3,
    ageMax: 8,
    priceNote: "Summer 2026 multi-sport camp; book via playballkids.com",
  },
  {
    name: "Playball Summer Camp Wimbledon Park",
    locationName: "Wimbledon Park Tennis Courts",
    address: "Wimbledon Park Tennis Courts, Home Park Road, Wimbledon, London",
    postcode: "SW19 7HR",
    startDate: "2026-07-20",
    endDate: "2026-08-28",
    dailyStartTime: "09:00",
    dailyEndTime: "13:00",
    ageMin: 2,
    ageMax: 9,
    priceNote: "Summer 2026; includes I Can Do sessions for ages 2-3; book via playballkids.com",
  },
  {
    name: "Playball Summer Camp The Orchard School",
    locationName: "The Orchard School",
    address: "The Orchard School, Bridge Road, East Molesey",
    postcode: "KT8 9HT",
    startDate: "2026-08-06",
    endDate: "2026-08-21",
    dailyStartTime: "09:30",
    dailyEndTime: "13:30",
    ageMin: 2,
    ageMax: 13,
    priceNote: "Summer 2026 Aug blocks including ages 7-13 week; book via playballkids.com",
  },
  {
    name: "Playball Summer Camp The Spencer Club",
    locationName: "The Spencer Club",
    address: "The Spencer Club, Fieldview, East Molesey",
    postcode: "KT8 2HY",
    startDate: "2026-07-20",
    endDate: "2026-08-20",
    dailyStartTime: "09:30",
    dailyEndTime: "13:30",
    ageMin: 3,
    ageMax: 8,
    priceNote: "Summer 2026 multi-sport camp; book via playballkids.com",
  },
  {
    name: "Playball Summer Camp Old Deer Park Richmond",
    locationName: "London Welsh Rugby Grounds",
    address: "Old Deer Park, 187 Kew Road, Richmond",
    postcode: "TW9 2AZ",
    startDate: "2026-07-14",
    endDate: "2026-08-27",
    dailyStartTime: "09:30",
    dailyEndTime: "13:00",
    ageMin: 2,
    ageMax: 9,
    priceNote: "Summer 2026; includes I Can Do sessions for ages 2-3; book via playballkids.com",
  },
  {
    name: "Playball Summer Camp Barn Elms",
    locationName: "Barn Elms Sports Trust",
    address: "Barn Elms Sports Trust, London Marathon Pavilion, Queen Elizabeth Walk, London",
    postcode: "SW13 9SA",
    startDate: "2026-07-21",
    endDate: "2026-09-02",
    dailyStartTime: "09:30",
    dailyEndTime: "13:00",
    ageMin: 2,
    ageMax: 8,
    priceNote: "Summer 2026 multi-sport camp; book via playballkids.com",
  },
  {
    name: "Playball Summer Camp West End Esher Cricket Club",
    locationName: "West End Esher Cricket Club",
    address: "West End Esher Cricket Club, West End Lane, Esher",
    postcode: "KT10 8LG",
    startDate: "2026-07-29",
    endDate: "2026-08-21",
    dailyStartTime: "09:30",
    dailyEndTime: "13:30",
    ageMin: 5,
    ageMax: 13,
    priceNote: "Summer 2026; separate sessions for ages 5-10 and 7-13; book via playballkids.com",
  },
  {
    name: "Playball Summer Camp Banstead Infant School",
    locationName: "Banstead Infant School",
    address: "Banstead Infant School, The Horseshoe, Banstead",
    postcode: "SM7 2BQ",
    startDate: "2026-08-11",
    endDate: "2026-08-27",
    dailyStartTime: "09:30",
    dailyEndTime: "14:00",
    ageMin: 3,
    ageMax: 10,
    priceNote: "Summer 2026 individual camp days Aug; toilet-trained children only; book via playballkids.com",
  },
  {
    name: "Playball Summer Camp Ravenscourt Park",
    locationName: "Ravenscourt Park Tennis Courts",
    address: "Ravenscourt Park Tennis Courts (King St Side), Hammersmith, London",
    postcode: "W6 0RF",
    startDate: "2026-07-21",
    endDate: "2026-08-27",
    dailyStartTime: "10:00",
    dailyEndTime: "13:00",
    ageMin: 2,
    ageMax: 9,
    priceNote: "Summer 2026 multi-sport camp; book via playballkids.com",
  },
  {
    name: "Playball Summer Camp Xcel Leisure Centre Walton",
    locationName: "Xcel Leisure Centre",
    address: "Xcel Leisure Centre, Waterside Drive, Walton-on-Thames",
    postcode: "KT12 2JG",
    startDate: "2026-07-28",
    endDate: "2026-08-27",
    dailyStartTime: "09:30",
    dailyEndTime: "13:30",
    ageMin: 2,
    ageMax: 13,
    priceNote: "Summer 2026; includes ages 7-13 blocks; book via playballkids.com",
  },
  {
    name: "Playball Summer Camp Oxshott Village Sports Club",
    locationName: "Oxshott Village Sports Club",
    address: "Oxshott Village Sports Club, Steels Lane, Oxshott",
    postcode: "KT22 0RE",
    startDate: "2026-07-23",
    endDate: "2026-08-11",
    dailyStartTime: "10:00",
    dailyEndTime: "13:00",
    ageMin: 4,
    ageMax: 6,
    priceNote: "Summer 2026 ages 4-6 camp; book via playballkids.com",
  },
  {
    name: "Playball Summer Camp The Vale Primary Epsom",
    locationName: "The Vale Primary School",
    address: "The Vale Primary School, 84-92 Beaconsfield Road, Epsom",
    postcode: "KT18 6HP",
    startDate: "2026-07-28",
    endDate: "2026-07-28",
    dailyStartTime: "09:00",
    dailyEndTime: "13:00",
    ageMin: 3,
    ageMax: 10,
    priceNote: "Summer 2026 camp day 28 Jul; book via playballkids.com",
  },
  {
    name: "Playball Summer Camp Beckenham County Ground",
    locationName: "Kent County Cricket Club",
    address: "The County Ground, Beckenham",
    postcode: "BR3 1DR",
    startDate: "2026-07-27",
    endDate: "2026-08-06",
    dailyStartTime: "09:30",
    dailyEndTime: "13:00",
    ageMin: 3,
    ageMax: 10,
    priceNote: "Summer 2026 multi-sport camp; book via playballkids.com",
  },
  {
    name: "Playball Summer Camp Marden Lodge Caterham",
    locationName: "Marden Lodge Primary School",
    address: "Marden Lodge Primary School, Croydon Road, Caterham",
    postcode: "CR3 6QH",
    startDate: "2026-07-29",
    endDate: "2026-08-20",
    dailyStartTime: "09:30",
    dailyEndTime: "14:00",
    ageMin: 3,
    ageMax: 10,
    priceNote: "Summer 2026 individual camp days Jul-Aug; book via playballkids.com",
  },
  {
    name: "Playball Summer Camp Dunottar School Reigate",
    locationName: "Dunottar School",
    address: "Dunottar School, 27 High Trees Road, Reigate",
    postcode: "RH2 7EL",
    startDate: "2026-07-28",
    endDate: "2026-08-20",
    dailyStartTime: "09:30",
    dailyEndTime: "14:00",
    ageMin: 3,
    ageMax: 10,
    priceNote: "Summer 2026 individual camp days; some dates waitlist; toilet-trained only; book via playballkids.com",
  },
  {
    name: "Playball Summer Camp Northway Gardens Hampstead",
    locationName: "Northway Gardens Tennis Centre",
    address: "Northway Gardens Tennis Centre, Falloden Way, Hampstead Garden Suburb, London",
    postcode: "NW11 6RJ",
    startDate: "2026-07-27",
    endDate: "2026-09-04",
    dailyStartTime: "09:30",
    dailyEndTime: "13:00",
    ageMin: 3,
    ageMax: 8,
    priceNote: "Summer 2026 multi-sport camp; book via playballkids.com",
  },
  {
    name: "Playball Summer Camp Queen Anne First School",
    locationName: "Queen Anne First School",
    address: "Queen Anne First School, Chaucer Close, Windsor",
    postcode: "SL4 3NL",
    startDate: "2026-08-10",
    endDate: "2026-08-28",
    dailyStartTime: "10:00",
    dailyEndTime: "15:00",
    ageMin: 3,
    ageMax: 9,
    priceNote: "Summer 2026 morning and afternoon sessions; book via playballkids.com",
  },
  {
    name: "Playball Summer Camp Sutherland Memorial Park Guildford",
    locationName: "Sutherland Memorial Park",
    address: "Sutherland Memorial Park Tennis Courts, Clay Lane, Guildford",
    postcode: "GU4 7LX",
    startDate: "2026-08-03",
    endDate: "2026-08-07",
    dailyStartTime: "10:00",
    dailyEndTime: "13:00",
    ageMin: 2,
    ageMax: 8,
    priceNote: "Summer 2026 week camp 3-7 Aug; book via playballkids.com",
  },
  {
    name: "Playball Summer Camp Clewer Green Windsor",
    locationName: "Clewer Green C of E First School",
    address: "Clewer Green C of E First School, Hatch Lane, Windsor",
    postcode: "SL4 3RL",
    startDate: "2026-08-03",
    endDate: "2026-08-07",
    dailyStartTime: "10:00",
    dailyEndTime: "15:00",
    ageMin: 3,
    ageMax: 9,
    priceNote: "Summer 2026 week camp 3-7 Aug; morning and afternoon sessions; book via playballkids.com",
  },
];

function toDate(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

async function main() {
  const prisma = createPrismaClient(
    process.env.DIRECT_URL ?? process.env.DATABASE_URL,
  );

  const provider = await prisma.provider.findFirst({
    where: { slug: PROVIDER_SLUG },
  });
  if (!provider) {
    throw new Error(`Provider ${PROVIDER_SLUG} not found`);
  }

  let created = 0;
  let updated = 0;
  let published = 0;
  let draft = 0;
  let skipped = 0;

  for (const venue of VENUES) {
    const coords = await geocodePostcode(venue.postcode);
    if (!coords) {
      console.warn(`  Skip ${venue.name}: geocode failed for ${venue.postcode}`);
      skipped++;
      continue;
    }

    if (!isWithinRadius(coords.lat, coords.lon)) {
      const dist = distanceFromNewMaldenKm(coords.lat, coords.lon);
      console.warn(`  Skip ${venue.name}: ${dist.toFixed(1)}km outside ${MAX_RADIUS_KM}km`);
      skipped++;
      continue;
    }

    const startDate = toDate(venue.startDate);
    const endDate = toDate(venue.endDate);

    const publish = decideClubPublishStatus({
      name: venue.name,
      locationName: venue.locationName,
      latitude: coords.lat,
      longitude: coords.lon,
      activities: ACTIVITIES,
      ageMin: venue.ageMin,
      ageMax: venue.ageMax,
      startDate,
      endDate,
      bookingUrl: BOOKING_URL,
      price: null,
      dailyRate: null,
      priceNote: venue.priceNote,
      dataConfidence: null,
    });

    const clubData = {
      providerId: provider.id,
      name: venue.name,
      description: `Multi-sport Playball summer camp for ages ${venue.ageMin}-${venue.ageMax} at ${venue.locationName}. Tennis, hockey, cricket, football, rugby, basketball and more.`,
      locationName: venue.locationName,
      address: venue.address,
      latitude: coords.lat,
      longitude: coords.lon,
      activities: ACTIVITIES,
      ageMin: venue.ageMin,
      ageMax: venue.ageMax,
      startDate,
      endDate,
      dailyStartTime: venue.dailyStartTime,
      dailyEndTime: venue.dailyEndTime,
      price: null,
      dailyRate: null,
      priceNote: venue.priceNote,
      bookingUrl: BOOKING_URL,
      sourceUrl: BOOKING_URL,
      imageUrl: IMAGE_URL,
      dataConfidence: publish.dataConfidence,
      status: publish.status as ClubStatus,
      promotionStatus: ClubPromotionStatus.OFFICIAL,
      isIndoor: false,
      isOutdoor: true,
    };

    const existing = await prisma.club.findFirst({
      where: { providerId: provider.id, name: venue.name },
    });

    if (existing) {
      await prisma.club.update({ where: { id: existing.id }, data: clubData });
      updated++;
    } else {
      await prisma.club.create({ data: clubData });
      created++;
    }

    if (publish.status === "ACTIVE") published++;
    else draft++;

    console.log(
      `  ${publish.status === "ACTIVE" ? "✓" : "○"} ${venue.name} (${distanceFromNewMaldenKm(coords.lat, coords.lon).toFixed(1)}km)`,
    );
  }

  console.log(
    `\nDone: ${created} created, ${updated} updated, ${published} published, ${draft} draft, ${skipped} skipped`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    const prisma = createPrismaClient(process.env.DIRECT_URL ?? process.env.DATABASE_URL);
    await prisma.$disconnect();
  });
