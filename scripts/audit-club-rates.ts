import { readFileSync } from "node:fs";
import { join } from "node:path";
import { config } from "dotenv";
import { createPrismaClient } from "../lib/db/create-prisma-client";

config({ path: ".env.local" });
config();

type ClubSeed = {
  clubId?: string;
  name: string;
  priceFrom?: string;
  sourceUrl?: string;
  bookingUrl?: string;
};

function parsePriceFrom(priceFrom?: string) {
  const note = priceFrom?.trim();
  if (!note) return { price: null, priceNote: null, dailyRate: null };
  const match = note.match(/(\d+(?:\.\d+)?)/);
  const price = match ? Number.parseFloat(match[1]) : null;
  const lower = note.toLowerCase();
  const dailyRate =
    price != null &&
    (lower.includes("per day") ||
      lower.includes("/ day") ||
      lower.includes("per session") ||
      lower.includes("/session"))
      ? price
      : null;
  return { price, priceNote: note, dailyRate };
}

async function main() {
  const seedPath = join(__dirname, "..", "prisma", "seed-data", "clubs.json");
  const seedClubs = JSON.parse(readFileSync(seedPath, "utf-8")) as ClubSeed[];

  console.log("=== SEED DATA ===");
  for (const club of seedClubs) {
    if (!club.priceFrom?.trim()) continue;
    const parsed = parsePriceFrom(club.priceFrom);
    console.log(
      JSON.stringify({
        name: club.name,
        priceFrom: club.priceFrom,
        dailyRate: parsed.dailyRate,
        price: parsed.price,
        sourceUrl: club.sourceUrl,
      }),
    );
  }

  const prisma = createPrismaClient(
    process.env.DIRECT_URL ?? process.env.DATABASE_URL,
  );

  try {
    const dbClubs = await prisma.club.findMany({
      select: {
        id: true,
        name: true,
        price: true,
        dailyRate: true,
        priceNote: true,
        sourceUrl: true,
        bookingUrl: true,
      },
      orderBy: { name: "asc" },
    });

    console.log("\n=== DATABASE (clubs with price or dailyRate) ===");
    for (const club of dbClubs) {
      if (club.price == null && club.dailyRate == null && !club.priceNote) continue;
      console.log(JSON.stringify(club));
    }

    console.log("\n=== MISMATCHES (dailyRate set but note is not daily) ===");
    for (const club of dbClubs) {
      if (club.dailyRate == null) continue;
      const note = club.priceNote?.toLowerCase() ?? "";
      const looksDaily =
        note.includes("per day") ||
        note.includes("/ day") ||
        note.includes("per session") ||
        note.includes("/session") ||
        note.includes("daily");
      if (!looksDaily && club.priceNote) {
        console.log(JSON.stringify(club));
      }
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
