/**
 * Fix scraped data quality issues on live clubs (bad prices, missing fields).
 * Run: npx tsx scripts/fix-club-data-gaps.ts
 */
import { config } from "dotenv";
import { createPrismaClient } from "../lib/db/create-prisma-client";

config({ path: ".env.local" });
config();

type Fix = {
  matchName: string;
  data: Record<string, unknown>;
};

const FIXES: Fix[] = [
  {
    matchName: "Playball Summer Camp Tiffin Girls' School",
    data: {
      price: null,
      dailyRate: null,
      priceNote: "Holiday camps at Tiffin Girls' School; book via playballkids.com/franchise/kingston",
    },
  },
  {
    matchName: "Chess Club Kingston Holiday Camp",
    data: {
      price: null,
      dailyRate: null,
      priceNote: "Chess holiday camps at Holy Cross Prep; contact info@kingstonchess.com for 2026 schedule",
    },
  },
  {
    matchName: "Supersharks Holiday Crash Courses",
    data: {
      price: null,
      dailyRate: null,
      priceNote: "Intensive swim crash courses Jul–Aug 2026; contact for pool-specific pricing",
    },
  },
  {
    matchName: "Stagecoach New Malden Holiday Workshop",
    data: {
      price: null,
      dailyRate: null,
      priceNote: "Holiday workshops at Burlington Junior School; see stagecoach.co.uk/newmalden for 2026 dates and fees",
    },
  },
  {
    matchName: "Mad Science Guildford Summer Camp",
    data: {
      description:
        "Hands-on Mad Science holiday camps with experiments and STEM activities at Guildford venues. Book via Mad Science Surrey.",
    },
  },
  {
    matchName: "Youth Ultimate MultiSports Guildford Camp",
    data: {
      description:
        "Ofsted-registered multi-sport holiday camp with football, cricket and athletics for ages 4–16 at St Peter's Catholic Primary School, Guildford.",
    },
  },
];

async function main() {
  const prisma = createPrismaClient();
  let fixed = 0;

  for (const fix of FIXES) {
    const club = await prisma.club.findFirst({ where: { name: fix.matchName } });
    if (!club) {
      console.log(`– Not found: ${fix.matchName}`);
      continue;
    }
    await prisma.club.update({ where: { id: club.id }, data: fix.data });
    console.log(`✓ Fixed: ${fix.matchName}`);
    fixed++;
  }

  console.log(`\nDone: ${fixed} clubs updated`);
  await prisma.$disconnect();
}

main().catch(console.error);
