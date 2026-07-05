/**
 * Enrich published club images from source pages and curated provider assets.
 * Run: npx tsx scripts/enrich-club-images.ts
 *      npx tsx scripts/enrich-club-images.ts --dry-run
 */
import { config } from "dotenv";
import { createPrismaClient } from "../lib/db/create-prisma-client";
import { extractImageFromPage } from "../lib/clubs/extract-page-image";

config({ path: ".env.local" });
config();

const DRY_RUN = process.argv.includes("--dry-run");

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
    u.includes("sc-master-300x300") ||
    u.includes("logo_fav") ||
    (u.includes("cropped-") && u.includes("32x32")) ||
    u.includes("32x32") ||
    u.includes("64x64") ||
    u.includes("192x192")
  ) {
    return "logo";
  }
  if (
    u.includes("cb-og") ||
    u.includes("website-blog") ||
    u.includes("img_0729_x.webp") ||
    u.includes("promo_panel_photo_zorb")
  ) {
    return "provider_brand";
  }
  return "venue_specific";
}

function needsBetterImage(url: string | null | undefined): boolean {
  const q = classifyImage(url);
  if (q === "missing" || q === "placeholder" || q === "logo" || q === "generic_stock") {
    return true;
  }
  // Camp Beaumont generic OG image — venue pages have better photos
  if (url?.toLowerCase().includes("cb-og-image")) return true;
  return false;
}

/** Provider-wide fallback when venue scrape fails */
const PROVIDER_IMAGES: Record<string, string> = {
  prov_playball: "https://www.playballkids.com/images/images-camps-header.png",
  prov_activ_camps:
    "https://www.activcamps.com/wp-content/uploads/2024/02/Website-blog-images-1200-x-628-39.png",
  prov_barracudas:
    "https://front-facing-live.barracudas.co.uk/media/4471/camp-page-banners.jpg?mode=max&width=2000&format=webp",
  prov_camp_beaumont:
    "https://cdn.prod.website-files.com/6007f0762975c344c6976d5d/602e4efdffbbbcd713557ddf_CB-OG-Image.jpg",
  prov_outdoor_owls:
    "https://images.squarespace-cdn.com/content/v1/63e6ae140bcd53533065af9d/c787319b-e1f2-431f-b5a9-7e9e0d5f3dbd/IMG_0599.jpg",
  prov_brilliant_play:
    "https://brilliantplay.co.uk/wp-content/uploads/2020/01/cropped-BrilliantPlayCiC-3.jpg",
  prov_koosa: "https://www.koosakids.co.uk/site/nrImages/img_0729_x.webp",
  prov_ultimate:
    "https://ultimateactivity.co.uk/sites/default/files/uploads/locations/%27Tear%27%20Collection%20of%20Photos/Promo_panel_photo_zorb.jpg",
  prov_funtech: "https://www.funtech.co.uk/img/2020/home/camp-swap.png",
  prov_stagecoach:
    "https://www.stagecoach.co.uk/wp-content/uploads/2024/10/HW_Extra_1-1920x0-c-default.webp",
  prov_supersharks:
    "https://www.supersharksswimschool.co.uk/wp-content/uploads/2015/08/crash_0236.jpg",
  prov_guildford_spectrum:
    "https://guildfordspectrum.s3.amazonaws.com/Photo%20Library/Holiday%20Club/Pebble%20-%20Pools%2001.jpg",
  prov_mad_science: "https://madsciencecamps.co.uk/wp-content/uploads/2025/05/camps-bnwW.png",
  prov_love_the_ball:
    "https://www.amsportsacademy.co.uk/wp-content/uploads/2024/04/IMG_5250-534x440.jpg",
  prov_magic_moments:
    "https://magicmomentschildcaregroup.co.uk/wp-content/uploads/2023/03/MM-Homepage-Hero.jpg",
};

/** Club name → best known image when scrape is unreliable */
const CLUB_IMAGES: Record<string, string> = {
  "Activ Camps Barn Elms Sports Trust": PROVIDER_IMAGES.prov_activ_camps,
  "Activ Camps Emanuel School": PROVIDER_IMAGES.prov_activ_camps,
  "Activ Camps Graveney School": PROVIDER_IMAGES.prov_activ_camps,
  "Activ Camps La Retraite School": PROVIDER_IMAGES.prov_activ_camps,
  "Activ Camps St Paul's School": PROVIDER_IMAGES.prov_activ_camps,
  "AM Sports Academy Floreat Wandsworth":
    "https://www.amsportsacademy.co.uk/wp-content/uploads/2024/04/IMG_5250-534x440.jpg",
  "Guildford Spectrum Xtreme Activate Holiday Club": PROVIDER_IMAGES.prov_guildford_spectrum,
  "Mad Science Guildford Summer Camp": PROVIDER_IMAGES.prov_mad_science,
  "Love the Ball Summer Camp Coombe Hill": PROVIDER_IMAGES.prov_love_the_ball,
  "Rose Theatre Create in Three Days 2026":
    "https://www.rosetheatre.org/cms_files/system/images/img3200_orig.jpeg",
  "Rose Theatre Play in a Week 2026":
    "https://www.rosetheatre.org/cms_files/system/images/img3375_orig.png",
  "South Side School of Rock Summer Intensive 2026":
    "https://static.wixstatic.com/media/01dfe0_b81102aa12d048708f30e677851dc355~mv2.png/v1/crop/x_0,y_1246,w_3508,h_2469/fill/w_1226,h_866,al_c,q_90,usm_0.66_1.00_0.01,enc_avif,quality_auto/SCHOOL%20OF%20ROCK%20YAE_.png",
  "Stagecoach Magic of the Musicals Summer Workshop": PROVIDER_IMAGES.prov_stagecoach,
  "Supersharks Holiday Crash Courses": PROVIDER_IMAGES.prov_supersharks,
  "Wilderness Club Holiday Camp": PROVIDER_IMAGES.prov_brilliant_play,
  "Marble Hill Adventure Playground Holiday Camp": PROVIDER_IMAGES.prov_brilliant_play,
};

/** URLs that never yield useful camp photos */
const SKIP_SCRAPE_URL_PATTERN = /playballkids\.com\/find-classes\.php/i;

/** Providers where booking search pages should not be scraped for images */
const SKIP_BOOKING_SCRAPE_PROVIDERS = new Set(["prov_playball"]);

async function resolveImage(
  club: {
    name: string;
    sourceUrl: string | null;
    bookingUrl: string | null;
    provider: { slug: string | null };
  },
): Promise<{ url: string | null; source: string }> {
  if (CLUB_IMAGES[club.name]) {
    return { url: CLUB_IMAGES[club.name], source: "manual" };
  }

  const scrapeTargets = [club.sourceUrl, club.bookingUrl].filter((u): u is string => {
    if (!u?.startsWith("https://")) return false;
    if (SKIP_SCRAPE_URL_PATTERN.test(u)) return false;
    if (
      club.provider.slug &&
      SKIP_BOOKING_SCRAPE_PROVIDERS.has(club.provider.slug) &&
      u === club.bookingUrl
    ) {
      return false;
    }
    return true;
  });
  const uniqueTargets = [...new Set(scrapeTargets)];

  for (const url of uniqueTargets) {
    const scraped = await extractImageFromPage(url);
    if (scraped && classifyImage(scraped) !== "logo") {
      return { url: scraped, source: `scraped:${url}` };
    }
  }

  const providerSlug = club.provider.slug;
  if (providerSlug && PROVIDER_IMAGES[providerSlug]) {
    return { url: PROVIDER_IMAGES[providerSlug], source: "provider-fallback" };
  }

  return { url: null, source: "none" };
}

async function main() {
  const prisma = createPrismaClient(process.env.DIRECT_URL ?? process.env.DATABASE_URL);

  const clubs = await prisma.club.findMany({
    where: { status: "ACTIVE" },
    include: { provider: { select: { slug: true, name: true } } },
    orderBy: { name: "asc" },
  });

  const targets = clubs.filter((c) => needsBetterImage(c.imageUrl));
  console.log(`\nEnriching images for ${targets.length} / ${clubs.length} published clubs${DRY_RUN ? " (dry run)" : ""}\n`);

  let updated = 0;
  let unchanged = 0;
  let failed = 0;

  for (const club of targets) {
    const { url, source } = await resolveImage(club);
    if (!url) {
      console.log(`  ✗ ${club.name} — no image found`);
      failed++;
      continue;
    }

    if (url === club.imageUrl) {
      unchanged++;
      continue;
    }

    const quality = classifyImage(url);
    console.log(`  → ${club.name}`);
    console.log(`    ${club.imageUrl ?? "(none)"} → ${url}`);
    console.log(`    via ${source} (${quality})`);

    if (!DRY_RUN) {
      await prisma.club.update({
        where: { id: club.id },
        data: { imageUrl: url },
      });
    }
    updated++;
  }

  console.log(`\nDone: ${updated} updated, ${unchanged} unchanged, ${failed} failed`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
