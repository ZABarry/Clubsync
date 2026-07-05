/**
 * Enrich draft clubs with web-researched data (Jul 2026 scrape pass).
 * Run: npx tsx scripts/enrich-draft-clubs.ts
 */
import { config } from "dotenv";
import { ClubStatus } from "@prisma/client";
import { decideClubPublishStatus } from "../lib/clubs/club-publish-rules";
import { geocodePostcode } from "../lib/clubs/geo-utils";
import { createPrismaClient } from "../lib/db/create-prisma-client";

config({ path: ".env.local" });
config();

type Enrichment = {
  matchName: string;
  updates: {
    name?: string;
    description?: string;
    locationName?: string;
    address?: string;
    postcode?: string;
    bookingUrl?: string;
    sourceUrl?: string;
    startDate?: string;
    endDate?: string;
    dailyStartTime?: string | null;
    dailyEndTime?: string | null;
    price?: number | null;
    dailyRate?: number | null;
    priceNote?: string | null;
    imageUrl?: string | null;
    activities?: string[];
    ageMin?: number;
    ageMax?: number;
  };
};

const ENRICHMENTS: Enrichment[] = [
  {
    matchName: "Barnfield Riding School Pony Days",
    updates: {
      description:
        "Own-a-Pony days and ride-and-groom sessions for ages 5-16 at Barnfield Riding School, Kingston. Pony days run Tuesday-Friday during school holidays; hats and boots available for hire.",
      dailyStartTime: null,
      dailyEndTime: null,
      price: null,
      priceNote: "Own-a-Pony days Tue-Fri; call 020 8546 3616 for dates and pricing",
      sourceUrl: "https://www.barnfieldridingschool.org/for-kids",
    },
  },
  {
    matchName: "Beyond Blocks Lego Robotics Surbiton",
    updates: {
      description:
        "Holiday LEGO robotics sessions teaching programming, engineering and design. Runs clubs at Surbiton Hill Methodist Church and local schools.",
      bookingUrl: "https://beyondblocks.co.uk/booking/",
      sourceUrl: "https://beyondblocks.co.uk/holiday-sessions/",
      dailyStartTime: null,
      dailyEndTime: null,
      priceNote: "Holiday sessions available; book via beyondblocks.co.uk/booking",
      imageUrl:
        "https://beyondblocks.co.uk/wp-content/uploads/2022/06/We_Love_Lego-26-1024x683-optimized.jpg",
    },
  },
  {
    matchName: "BG Coaching Kingston Football Camp",
    updates: {
      description:
        "FA-qualified football holiday camps for ages 6-13. Runs most days during the summer break at Fern Hill Primary School.",
      locationName: "Fern Hill Primary School",
      address: "Fern Hill Primary School, Richmond Road, Kingston upon Thames, KT2 5PE",
      postcode: "KT2 5PE",
      bookingUrl: "https://www.bgcoaching.co.uk/camp-booking",
      sourceUrl: "https://www.fernhillprimary.org/curriculum/clubs-activities/weekend-holiday-activities-at-fern-hill",
      startDate: "2026-07-23",
      endDate: "2026-08-29",
      dailyStartTime: null,
      dailyEndTime: null,
      priceNote: "Summer camps most days 23 Jul-29 Aug 2026; book via bgcoaching.co.uk or email bgcoaching@gmail.com",
    },
  },
  {
    matchName: "Camp Hogwarts New Malden",
    updates: {
      name: "Camp Hogwarts (Quidditch for Muggles)",
      description:
        "Wizarding-themed holiday camp with Quidditch, potions, charms and more for ages 5-12. Summer 2026 venues include Motspur Park and Putney (not Coombe Girls). From £40 per day.",
      locationName: "South West London venues",
      address: "Motspur Park / Putney area (see quidditchformuggles.com for 2026 venues)",
      bookingUrl: "https://www.quidditchformuggles.com/camp-hogwarts",
      sourceUrl: "https://www.quidditchformuggles.com/latest-news",
      dailyStartTime: null,
      dailyEndTime: null,
      price: 40,
      dailyRate: 40,
      priceNote: "From £40 per day; summer 2026 at Motspur Park, Putney and St Briavel's Castle trip",
    },
  },
  {
    matchName: "Chess Club Kingston Holiday Camp",
    updates: {
      description:
        "ChessPlus/Kingston Chess Club runs Brain Camps (chess and strategy games) at Holy Cross Prep for ages 7-11. No summer 2026 holiday camp announced yet; August 2026 hosts the 5th Kingston Invitational tournament.",
      bookingUrl: "https://kingstonchess.com/",
      sourceUrl: "https://kingstonchess.com/tag/chess-camp/",
      price: null,
      priceNote: "No summer 2026 holiday camp listed; check kingstonchess.com for Brain Camp dates",
    },
  },
  {
    matchName: "Junior Golf Academy London Kingston Camp",
    updates: {
      description:
        "Junior golf academy at Coombe Wood Golf Club with term-time weekend sessions and school holiday camps. PGA Professional Dean Jeeves; group sessions from £22.",
      bookingUrl: "https://juniorgolflondon.co.uk/",
      sourceUrl: "https://juniorgolflondon.co.uk/",
      priceNote: "Academy sessions £22; contact Dean Jeeves for 2026 holiday camp dates",
      imageUrl: "https://juniorgolflondon.co.uk/wp-content/uploads/2020/03/jga-logo.png",
    },
  },
  {
    matchName: "Let's Sew Club Surbiton Camp",
    updates: {
      locationName: "Surbiton Hill Methodist Church",
      address: "Surbiton Hill Methodist Church, 39 Ewell Road, Surbiton, KT6 6AF",
      postcode: "KT6 6AF",
      description:
        "Summer sewing workshops for ages 6+. UAL-trained, DBS-checked instructor leads hand and machine sewing projects; all materials included. Book individual Thu/Fri sessions via the online form.",
      bookingUrl: "https://letssewclub.com/booking",
      sourceUrl: "https://letssewclub.com/booking",
      startDate: "2026-07-23",
      endDate: "2026-08-21",
      dailyStartTime: "10:00",
      dailyEndTime: "14:00",
      price: 60,
      dailyRate: 60,
      ageMax: 18,
      priceNote:
        "£60/day 10am-2pm; book Thu/Fri sessions 23-24 Jul, 30-31 Jul, 6-7 Aug, 13-14 Aug, 20-21 Aug 2026",
    },
  },
  {
    matchName: "Love the Ball Holiday Camp",
    updates: {
      name: "Love the Ball Summer Camp Coombe Hill",
      locationName: "Coombe Hill Junior School",
      address: "Coombe Hill Junior School, Coombe Lane West, Kingston upon Thames, KT2 7DD",
      postcode: "KT2 7DD",
      description:
        "FA-qualified football and multi-sport holiday camps for ages 4-11 at Coombe Hill Junior School. Full and half-day options with early drop-off and late pickup.",
      startDate: "2026-07-20",
      endDate: "2026-08-07",
      dailyStartTime: "09:00",
      dailyEndTime: "15:00",
      price: 34,
      dailyRate: 34,
      priceNote: "£34 full day (9am-3pm); £144 per week; half-day £24; early/late care available",
      bookingUrl: "https://lovetheball.com/courses/holidaycamps.html",
      sourceUrl: "https://lovetheball.com/courses/holidaycamps.html",
      ageMin: 4,
      ageMax: 11,
    },
  },
  {
    matchName: "Magic Moments Holiday Camp New Malden",
    updates: {
      locationName: "7th Malden Scout Hall",
      address: "7th Malden Scout Hall, Green Lane, New Malden, KT3 5AS",
      postcode: "KT3 5AS",
      description:
        "Ofsted-style holiday camp for ages 7-12 with sports, cooking, arts and crafts at the 7th Malden Scout Hall. Indoor hall and outdoor garden.",
      startDate: "2026-07-28",
      endDate: "2026-08-29",
      dailyStartTime: "08:30",
      dailyEndTime: "15:30",
      price: 55,
      dailyRate: 55,
      priceNote: "£55 per day; £250 per week; extended hours to 6pm +£10",
      bookingUrl: "https://magicmomentschildcaregroup.co.uk/pricing/",
      sourceUrl: "https://magicmomentschildcaregroup.co.uk/location/",
    },
  },
  {
    matchName: "Planet Warriors Kids Club Thames Ditton",
    updates: {
      description:
        "Ofsted-registered wraparound and holiday club for ages 4-11 at Vital Village Community Hub. Themed activities including football, forest school, LEGO and crafts.",
      dailyStartTime: null,
      dailyEndTime: null,
      priceNote: "Holiday camps now offered; contact via planetwarriorskidsclub.co.uk for dates and pricing",
      sourceUrl: "https://www.planetwarriorskidsclub.co.uk/",
    },
  },
  {
    matchName: "Playball Camp Tiffin Girls' School",
    updates: {
      name: "Playball Summer Camp Tiffin Girls' School",
      locationName: "Tiffin Girls' School",
      address: "Tiffin Girls' School, Richmond Road, Kingston upon Thames, KT2 5PL",
      postcode: "KT2 5PL",
      description:
        "Multi-sport Playball summer camp for ages 3-10. Covers tennis, hockey, cricket, football, rugby, basketball and more. Run by Playball Kingston franchise.",
      bookingUrl:
        "https://www.playballkids.com/find-classes.php?postcode=KT33HL&radius=15&termtime=Summer&agegroup=All+Ages&dow=-1&tod=Any+Time+&login=login&type=camps",
      sourceUrl:
        "https://www.playballkids.com/find-classes.php?postcode=KT33HL&radius=15&termtime=Summer&agegroup=All+Ages&dow=-1&tod=Any+Time+&login=login&type=camps",
      startDate: "2026-07-20",
      endDate: "2026-08-18",
      dailyStartTime: "09:30",
      dailyEndTime: "13:00",
      ageMin: 3,
      ageMax: 10,
      priceNote:
        "Summer 2026 Mon-Fri blocks 20 Jul-18 Aug, 9:30am-1pm; book via playballkids.com (select UK region). 20+ camps within 15 miles of New Malden",
    },
  },
  {
    matchName: "South Side Theatre Academy Holiday Camp",
    updates: {
      name: "South Side School of Rock Summer Intensive 2026",
      locationName: "ACT Theatre Kingston",
      address: "ACT Theatre, Kingston upon Thames (rehearsals); performances at ACT Theatre",
      description:
        "Two-week musical theatre intensive performing School of Rock for Year 6-13. Rehearsals weekdays with performances on 20-21 August 2026.",
      startDate: "2026-08-10",
      endDate: "2026-08-21",
      dailyStartTime: null,
      dailyEndTime: null,
      bookingUrl: "https://www.southsidetheatre.com/post/school-of-rock-summer-musical-intensive-announced",
      sourceUrl: "https://www.southsidetheatre.com/post/school-of-rock-summer-musical-intensive-announced",
      ageMin: 10,
      ageMax: 18,
      priceNote: "Booking opens January 2026; sign up to mailing list at southsidetheatre.com",
    },
  },
  {
    matchName: "Stagecoach Kingston and Surbiton Holiday Workshop",
    updates: {
      name: "Stagecoach Magic of the Musicals Summer Workshop",
      locationName: "The Kingston Academy",
      address: "The Kingston Academy, Richmond Road, Kingston upon Thames, KT2 5PE",
      postcode: "KT2 5PE",
      description:
        "4-day summer performing arts workshop with Tom O'Neill — dance, drama and singing culminating in a family presentation on the final afternoon. Ages 6-18.",
      bookingUrl: "https://www.stagecoach.co.uk/kingstonandsurbiton#workshops",
      sourceUrl: "https://www.stagecoach.co.uk/kingstonandsurbiton#workshops",
      startDate: "2026-08-03",
      endDate: "2026-08-06",
      dailyStartTime: "10:00",
      dailyEndTime: "16:00",
      price: 160,
      ageMin: 6,
      ageMax: 18,
      priceNote: "£160 standard / £130 sibling; Mon-Thu 3-6 Aug 2026, 10am-4pm; presentation Thu 3-4pm",
    },
  },
  {
    matchName: "Stagecoach New Malden Holiday Workshop",
    updates: {
      description:
        "Stagecoach New Malden runs weekly performing arts classes (ages 4-18) at Burlington Junior School and Coombe Hill Infants. Ofsted registered; accepts childcare vouchers.",
      bookingUrl: "https://www.stagecoach.co.uk/newmalden#workshops",
      sourceUrl: "https://www.stagecoach.co.uk/newmalden#workshops",
      locationName: "Burlington Junior School",
      address: "Burlington Junior School, Burlington Road, New Malden, KT3 4LT",
      postcode: "KT3 4LT",
      dailyStartTime: null,
      dailyEndTime: null,
      priceNote: "No summer 2026 holiday workshops listed on newmalden#workshops; Autumn term classes from Sep 2026",
    },
  },
  {
    matchName: "Teddy Tennis Hawker Centre Camp",
    updates: {
      description:
        "Teddy Tennis holiday camps for ages 2-7 using music and games to teach tennis fundamentals. Summer 2026 camps at YMCA Hawker, Canbury Gardens and other Kingston venues.",
      startDate: "2026-07-20",
      endDate: "2026-08-28",
      bookingUrl: "https://teddytennisuk.co.uk/centre/kingston/",
      sourceUrl: "https://teddytennisuk.co.uk/centre/kingston/",
      dailyStartTime: null,
      dailyEndTime: null,
      priceNote: "Summer camps 20 Jul-28 Aug 2026; book at teddytennisuk.co.uk/centre/kingston or call 020 3475 3666",
    },
  },
];

function toDate(value?: string | null): Date | null {
  if (!value) return null;
  const d = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

async function main() {
  const prisma = createPrismaClient(
    process.env.DIRECT_URL ?? process.env.DATABASE_URL,
  );

  try {
    let updated = 0;
    let published = 0;
    let stillDraft = 0;

    for (const item of ENRICHMENTS) {
      const club = await prisma.club.findFirst({
        where: { name: item.matchName, status: ClubStatus.DRAFT },
      });
      if (!club) {
        console.warn(`  Not found: ${item.matchName}`);
        continue;
      }

      const u = item.updates;
      let latitude = club.latitude;
      let longitude = club.longitude;

      if (u.postcode) {
        const coords = await geocodePostcode(u.postcode);
        if (coords) {
          latitude = coords.lat;
          longitude = coords.lon;
        }
      }

      const startDate = toDate(u.startDate) ?? club.startDate;
      const endDate = toDate(u.endDate) ?? club.endDate;
      const price = u.price !== undefined ? u.price : club.price;
      const dailyRate = u.dailyRate !== undefined ? u.dailyRate : club.dailyRate;
      const priceNote = u.priceNote !== undefined ? u.priceNote : club.priceNote;

      const publish = decideClubPublishStatus({
        name: u.name ?? club.name,
        locationName: u.locationName ?? club.locationName,
        latitude,
        longitude,
        activities: u.activities ?? club.activities,
        ageMin: u.ageMin ?? club.ageMin,
        ageMax: u.ageMax ?? club.ageMax,
        startDate,
        endDate,
        bookingUrl: u.bookingUrl ?? club.bookingUrl,
        price,
        dailyRate,
        priceNote,
        dataConfidence: null,
      });

      await prisma.club.update({
        where: { id: club.id },
        data: {
          name: u.name ?? club.name,
          description: u.description ?? club.description,
          locationName: u.locationName ?? club.locationName,
          address: u.address ?? club.address,
          latitude,
          longitude,
          activities: u.activities ?? club.activities,
          ageMin: u.ageMin ?? club.ageMin,
          ageMax: u.ageMax ?? club.ageMax,
          startDate,
          endDate,
          dailyStartTime: u.dailyStartTime !== undefined ? u.dailyStartTime : club.dailyStartTime,
          dailyEndTime: u.dailyEndTime !== undefined ? u.dailyEndTime : club.dailyEndTime,
          price,
          dailyRate,
          priceNote,
          bookingUrl: u.bookingUrl ?? club.bookingUrl,
          sourceUrl: u.sourceUrl ?? club.sourceUrl,
          imageUrl: u.imageUrl ?? club.imageUrl,
          dataConfidence: publish.dataConfidence,
          status: publish.status,
        },
      });

      updated++;
      if (publish.status === "ACTIVE") published++;
      else stillDraft++;

      console.log(
        `  ${publish.status === "ACTIVE" ? "✓ Published" : "○ Draft"}: ${u.name ?? item.matchName}${publish.missing.length ? ` (missing: ${publish.missing.join(", ")})` : ""}`,
      );
    }

    console.log(`\nUpdated ${updated} clubs (${published} published, ${stillDraft} remain draft)`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
