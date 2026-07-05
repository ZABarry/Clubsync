import { config } from "dotenv";
import { createPrismaClient } from "../lib/db/create-prisma-client";
import { distanceFromNewMaldenKm } from "../lib/clubs/geo-utils";

config({ path: ".env.local" });
config();

async function main() {
  const prisma = createPrismaClient(
    process.env.DIRECT_URL ?? process.env.DATABASE_URL,
  );

  try {
    const [active, draft, total] = await Promise.all([
      prisma.club.findMany({
        where: { status: "ACTIVE" },
        select: {
          name: true,
          bookingUrl: true,
          priceNote: true,
          startDate: true,
          endDate: true,
          imageUrl: true,
          dataConfidence: true,
          latitude: true,
          longitude: true,
        },
      }),
      prisma.club.findMany({
        where: { status: "DRAFT" },
        select: { name: true, priceNote: true, startDate: true, bookingUrl: true },
        orderBy: { name: "asc" },
      }),
      prisma.club.count(),
    ]);

    let maxDist = 0;
    let maxName = "";
    for (const c of active) {
      const d = distanceFromNewMaldenKm(c.latitude, c.longitude);
      if (d > maxDist) {
        maxDist = d;
        maxName = c.name;
      }
    }

    console.log(
      JSON.stringify(
        {
          total,
          published: active.length,
          draft: draft.length,
          publishedWithBooking: active.filter((c) => c.bookingUrl).length,
          publishedWithDates: active.filter((c) => c.startDate && c.endDate).length,
          publishedWithPrice: active.filter((c) => c.priceNote).length,
          publishedWithImage: active.filter((c) => c.imageUrl).length,
          publishedHighConfidence: active.filter((c) => c.dataConfidence === "high")
            .length,
          maxDistanceKm: maxDist.toFixed(1),
          furthestClub: maxName,
        },
        null,
        2,
      ),
    );

    console.log("\nRemaining drafts:");
    for (const d of draft) {
      const missing = [
        !d.startDate && "dates",
        !d.priceNote && "price",
        !d.bookingUrl && "booking",
      ]
        .filter(Boolean)
        .join(", ");
      console.log(`  - ${d.name} (missing: ${missing || "review needed"})`);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);
