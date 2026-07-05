/**
 * Audit imageUrl quality for all published (ACTIVE) clubs.
 * Run: npx tsx scripts/audit-published-images.ts
 */
import { config } from "dotenv";
import { createPrismaClient } from "../lib/db/create-prisma-client";

config({ path: ".env.local" });
config();

type ImageQuality = "missing" | "placeholder" | "logo" | "generic_stock" | "provider_brand" | "venue_specific";

function classifyImage(url: string | null | undefined): ImageQuality {
  if (!url?.trim()) return "missing";
  const u = url.toLowerCase();
  if (u.includes("picsum.photos")) return "placeholder";
  if (u.includes("unsplash.com")) return "generic_stock";
  if (u.includes("/flags/")) return "logo";
  if (
    u.includes("logo") ||
    u.includes("favicon") ||
    u.includes("/icon.") ||
    u.includes("-logo") ||
    u.endsWith(".svg") ||
    u.includes("logo.svg") ||
    u.includes("cropped-") && u.includes("32x32") ||
    u.includes("32x32") ||
    u.includes("64x64") ||
    u.includes("192x192")
  ) {
    return "logo";
  }
  if (
    u.includes("og-image") ||
    u.includes("og_image") ||
    u.includes("website-blog") ||
    u.includes("cb-og") ||
    u.includes("scaled-1.jpg") ||
    u.includes("fun-fest.co.uk") ||
    u.includes("activcamps.com") ||
    u.includes("campbeaumont") ||
    u.includes("ultimateactivity") ||
    u.includes("koosakids") ||
    u.includes("stagecoach.co.uk") ||
    u.includes("letssewclub") ||
    u.includes("beyondblocks") ||
    u.includes("barracudas") ||
    u.includes("outdoorowls") ||
    u.includes("familiesonline")
  ) {
    return "provider_brand";
  }
  return "venue_specific";
}

async function main() {
  const prisma = createPrismaClient(process.env.DIRECT_URL ?? process.env.DATABASE_URL);

  const clubs = await prisma.club.findMany({
    where: { status: "ACTIVE" },
    include: { provider: { select: { name: true, slug: true, logoUrl: true, website: true } } },
    orderBy: [{ provider: { name: "asc" } }, { name: "asc" }],
  });

  const byQuality: Record<ImageQuality, typeof clubs> = {
    missing: [],
    placeholder: [],
    logo: [],
    generic_stock: [],
    provider_brand: [],
    venue_specific: [],
  };

  for (const club of clubs) {
    byQuality[classifyImage(club.imageUrl)].push(club);
  }

  console.log(`\n=== Published clubs image audit (${clubs.length} total) ===\n`);
  for (const [quality, list] of Object.entries(byQuality) as [ImageQuality, typeof clubs][]) {
    if (!list.length) continue;
    console.log(`\n## ${quality.toUpperCase()} (${list.length})`);
    for (const c of list) {
      console.log(`  [${c.provider.name}] ${c.name}`);
      console.log(`    image: ${c.imageUrl ?? "(none)"}`);
      if (c.sourceUrl) console.log(`    source: ${c.sourceUrl}`);
    }
  }

  const needsImprovement = [
    ...byQuality.missing,
    ...byQuality.placeholder,
    ...byQuality.logo,
    ...byQuality.generic_stock,
  ];
  console.log(`\n=== NEEDS IMPROVEMENT: ${needsImprovement.length} / ${clubs.length} ===`);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
