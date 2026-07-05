/**
 * Review and fix club pricing in the database from seed data and source rules.
 *
 * Usage: npx tsx scripts/fix-club-rates.ts
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { config } from "dotenv";

import { parseClubPrice } from "../lib/clubs/parse-club-price";
import { createPrismaClient } from "../lib/db/create-prisma-client";

config({ path: ".env.local" });
config();

type ClubSeed = {
  name: string;
  locationName: string;
  providerId: string;
  priceFrom?: string;
};

const SEED_PRICE_OVERRIDES: Record<string, string> = {
  "Camp Beaumont Surbiton - Hollyfield School": "55 per day",
  "Camp Beaumont Wimbledon - Donhead Prep": "55 per day",
  "Camp Beaumont Wimbledon - King's College School": "55 per day",
};

function inferWeeklyPriceNote(name: string, price: number): string {
  if (/intensive|course|programme|program/i.test(name)) {
    return `£${price} course fee (not per day)`;
  }
  return `£${price} per week`;
}

async function main() {
  const seedPath = join(__dirname, "..", "prisma", "seed-data", "clubs.json");
  const seedClubs = JSON.parse(readFileSync(seedPath, "utf-8")) as ClubSeed[];

  const seedByKey = new Map(
    seedClubs.map((club) => [
      `${club.name.trim()}|${club.locationName.trim()}`,
      club,
    ]),
  );

  const prisma = createPrismaClient(
    process.env.DIRECT_URL ?? process.env.DATABASE_URL,
  );

  try {
    const clubs = await prisma.club.findMany({
      select: {
        id: true,
        name: true,
        locationName: true,
        price: true,
        dailyRate: true,
        priceNote: true,
        bookingUrl: true,
        sourceUrl: true,
      },
    });

    let updated = 0;

    for (const club of clubs) {
      const key = `${club.name.trim()}|${club.locationName.trim()}`;
      const seed = seedByKey.get(key);
      const overridePriceFrom = SEED_PRICE_OVERRIDES[club.name.trim()];
      const priceFrom = overridePriceFrom ?? seed?.priceFrom;

      let next = priceFrom
        ? parseClubPrice(priceFrom)
        : {
            price: club.price,
            dailyRate: null as number | null,
            priceNote: club.priceNote,
          };

      const isDemoClub = club.bookingUrl?.includes("example.com");
      const looksWeekly =
        isDemoClub ||
        /\bweek\b/i.test(club.name) ||
        /intensive/i.test(club.name);

      if (looksWeekly && club.price != null && !priceFrom?.trim()) {
        next = {
          price: club.price,
          dailyRate: null,
          priceNote: inferWeeklyPriceNote(club.name, club.price),
        };
      }

      if (
        next.dailyRate == null &&
        club.dailyRate != null &&
        !isDailyPriceNote(next.priceNote)
      ) {
        next = { ...next, dailyRate: null };
      }

      const changed =
        next.price !== club.price ||
        next.dailyRate !== club.dailyRate ||
        next.priceNote !== club.priceNote;

      if (!changed) continue;

      await prisma.club.update({
        where: { id: club.id },
        data: {
          price: next.price,
          dailyRate: next.dailyRate,
          priceNote: next.priceNote,
        },
      });

      console.log(
        JSON.stringify({
          name: club.name,
          before: {
            price: club.price,
            dailyRate: club.dailyRate,
            priceNote: club.priceNote,
          },
          after: next,
          source: club.sourceUrl ?? club.bookingUrl,
        }),
      );
      updated += 1;
    }

    console.log(`Updated ${updated} club(s).`);
  } finally {
    await prisma.$disconnect();
  }
}

function isDailyPriceNote(note: string | null | undefined): boolean {
  if (!note) return false;
  const lower = note.toLowerCase();
  return lower.includes("per day") || lower.includes("/ day");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
