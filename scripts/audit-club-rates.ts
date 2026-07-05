import { config } from "dotenv";
import { createPrismaClient } from "../lib/db/create-prisma-client";

config({ path: ".env.local" });
config();

async function main() {
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

    console.log("=== DATABASE (clubs with price or dailyRate) ===");
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
