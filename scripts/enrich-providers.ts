/**
 * Scrape provider websites and enrich missing Provider fields.
 *
 * Usage:
 *   npx tsx scripts/enrich-providers.ts
 *   npx tsx scripts/enrich-providers.ts --dry-run
 *   npx tsx scripts/enrich-providers.ts --provider "Camp Beaumont"
 */
import { config } from "dotenv";
import { createPrismaClient } from "../lib/db/create-prisma-client";
import {
  getProviderScrapeUrl,
  scrapeProviderPage,
} from "../lib/clubs/scrape-provider-data";

// Re-use phone validation from scraper
function phoneIsValid(phone: string): boolean {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 10 || digits.length > 13) return false;
  if (/^0+$/.test(digits) || digits.startsWith("0000")) return false;
  if (/(\d)\1{5,}/.test(digits)) return false;
  return true;
}

config({ path: ".env.local" });
config();

const DRY_RUN = process.argv.includes("--dry-run");
const providerFilter = (() => {
  const idx = process.argv.indexOf("--provider");
  return idx >= 0 ? process.argv[idx + 1] : undefined;
})();

function isPlaceholder(value: string | null | undefined): boolean {
  if (!value) return false;
  return value.includes("example.com") || value.includes(".example");
}

function isInvalidPhone(value: string | null | undefined): boolean {
  if (!value) return false;
  return !phoneIsValid(value);
}

/** Websites that should be replaced even when a non-placeholder URL is set */
const WEBSITE_OVERRIDES: Record<string, string> = {
  "Playball Camp": "https://www.playballkids.com/franchise/kingston",
};
const MANUAL_OVERRIDES: Record<
  string,
  {
    website?: string;
    description?: string;
    contactEmail?: string;
    phone?: string;
    logoUrl?: string;
    slug?: string;
    forceFields?: Array<"description" | "contactEmail" | "phone" | "logoUrl" | "website" | "slug">;
  }
> = {
  "Beyond Blocks Lego Robotics": {
    contactEmail: "hello@beyondblocks.co.uk",
    forceFields: ["phone"],
  },
  "Chess Club Kingston": {
    website: "https://kingstonchess.com/",
    description:
      "Kingston Chess Academy offers junior chess coaching and holiday camps in Kingston upon Thames for ages 8–14.",
    contactEmail: "info@kingstonchess.com",
    phone: "07850 045805",
  },
  "Junior Golf Academy London": {
    description:
      "Holiday golf camps for children aged 5–16 at Coombe Wood Golf Club and other SW London venues, run by PGA professionals.",
    contactEmail: "caron@juniorgolflondon.co.uk",
    phone: "07969 558525",
  },
  "Love the Ball": {
    description:
      "FA-qualified football and multi-sport holiday camps across SW London including Kingston Grammar School.",
  },
  "Mad Science Surrey": {
    website: "https://madsciencecamps.co.uk/",
    description:
      "Mad Science holiday camps with hands-on STEM experiments and workshops for children across Surrey and SW London.",
    contactEmail: "office@madsciencesw.co.uk",
    phone: "01792 348205",
  },
  "Magic Moments Childcare Group": {
    description:
      "Holiday camp for ages 7–12 in New Malden with sports, cooking, arts and crafts, and outdoor play.",
    contactEmail: "magicmomentschildcaregroup@gmail.com",
    phone: "07748 378061",
  },
  "Playball Camp": {
    website: "https://www.playballkids.com/franchise/kingston",
    description:
      "Multi-sport holiday camps for ages 3–9 teaching fundamental ball skills at venues across Kingston and Richmond.",
    contactEmail: "kingston@playballkids.com",
    phone: "07850 324116",
  },
  "Quidditch for Muggles": {
    website: "https://www.quidditchformuggles.com/",
    description:
      "Harry Potter-themed Camp Hogwarts and Quidditch holiday sessions for children across SW London.",
    contactEmail: "info@quidditchformuggles.com",
    phone: "07400 759823",
  },
  "Brilliant Play Solutions": {
    description:
      "Brilliant Play runs FUEL and paid holiday adventure camps at Marble Hill and The Wilderness in Richmond and Kingston.",
  },
  "Roar Academy": {
    description:
      "Roar Kids Academy runs multi-activity holiday camps with sports, arts and team games for children in SW London.",
  },
  "Youth Ultimate UK": {
    description:
      "Youth Ultimate UK delivers ultimate frisbee coaching, school clubs and holiday camps for children across London.",
  },
  "Supersharks Swim School": {
    description:
      "Supersharks Swim School offers intensive swimming holiday courses and water confidence camps across SW London.",
  },
  "CodeCamp SW London": {
    website: "https://www.funtech.co.uk/",
    description:
      "FunTech coding and tech camps for children — robotics, game design, and programming holiday courses across SW London.",
    contactEmail: "info@funtech.co.uk",
    slug: "prov_codecamp_sw",
  },
  "Dance Dynamics Sutton": {
    website: "https://scd.org.uk/",
    description: "Dance, gymnastics and movement holiday camps at Sutton Community Dance Studios for all abilities.",
    contactEmail: "info@scd.org.uk",
    phone: "07709 884738",
    slug: "prov_dance_dynamics",
  },
  "Epsom Football Club": {
    website: "https://www.epsomandewellfc.com/",
    description: "Youth football development and holiday camps led by FA-qualified coaches at Epsom & Ewell FC.",
    contactEmail: "info@epsomandewellfc.com",
    slug: "prov_epsom_fc",
  },
  "Kingston Grammar Sports": {
    website: "https://www.kgs.org.uk/",
    description: "Multi-sport holiday programmes run at Kingston Grammar School for children aged 5–14.",
    contactEmail: "info@kgs.org.uk",
    phone: "020 8546 1200",
    slug: "prov_kgs_sports",
  },
  "Malden Active Kids": {
    website: "https://magicmomentschildcaregroup.co.uk/",
    description: "Affordable multi-activity holiday camps in New Malden for ages 7–12 with sports, cooking and arts.",
    contactEmail: "magicmomentschildcaregroup@gmail.com",
    phone: "07748 378061",
    slug: "prov_malden_active",
    forceFields: ["phone"],
  },
  "AM Sports Academy": {
    contactEmail: "info@amsportsacademy.co.uk",
  },
  "Move it Sports Coaching": {
    contactEmail: "info@moveitsportscoaching.co.uk",
  },
  "Camp Beaumont": {
    contactEmail: "info@campbeaumont.co.uk",
  },
  "FunTech": {
    contactEmail: "info@funtech.co.uk",
  },
  "Jigsaw Performing Arts": {
    contactEmail: "info@jigsaw-arts.co.uk",
  },
  "Mother Nature Science": {
    contactEmail: "info@mnature.co.uk",
  },
  "Planet Warriors Kids Club": {
    contactEmail: "hello@planetwarriorskidsclub.co.uk",
    phone: "07511 524982",
    forceFields: ["phone"],
  },
  "Richmond STEM Lab": {
    website: "https://www.mnature.co.uk/",
    description: "Science, technology and engineering holiday camps — Mother Nature Science STEM programmes.",
    contactEmail: "info@mnature.co.uk",
    slug: "prov_richmond_stem",
  },
  "Stage & Scene Drama": {
    website: "https://www.stagecoach.co.uk/",
    description: "Performing arts and drama holiday workshops for ages 6–16 through Stagecoach Performing Arts.",
    slug: "prov_stage_scene",
  },
  "Surbiton Arts Collective": {
    website: "https://www.jigsaw-arts.co.uk/",
    description: "Creative arts, dance and drama holiday programmes through Jigsaw Performing Arts Surbiton.",
    slug: "prov_surbiton_arts",
  },
  "Surrey Swim School": {
    website: "https://www.springboardswimmers.co.uk/",
    description: "Intensive swimming courses and water confidence holiday camps across Surrey and SW London.",
    contactEmail: "info@springboardswimmers.co.uk",
    phone: "020 8239 0081",
    slug: "prov_surrey_swim",
  },
  "Wimbledon Tennis Academy": {
    website: "https://www.wimbledonparktennis.co.uk/",
    description: "Professional tennis coaching and holiday camps on Wimbledon Park and surrounding courts.",
    contactEmail: "info@livelovesport.com",
    phone: "020 8150 5242",
    slug: "prov_wimbledon_tennis",
    forceFields: ["contactEmail", "phone"],
  },
  "Rose Theatre Kingston": {
    contactEmail: "info@rosetheatre.org",
    phone: "020 8174 0090",
  },
  "Springboard Swimmers": {
    contactEmail: "info@springboardswimmers.co.uk",
  },
  "Stagecoach Performing Arts": {
    contactEmail: "info@stagecoach.co.uk",
    phone: "01923 336376",
  },
  "The Science of Sound": {
    contactEmail: "info@scienceofsound.co.uk",
  },
  "Brilliant Play Solutions": {
    contactEmail: "info@brilliantplay.co.uk",
  },
  "Guildford Spectrum Holiday Club": {
    contactEmail: "info@guildfordspectrum.co.uk",
    phone: "01483 443443",
  },
  "Camp England": {
    website: "https://www.englandsportsgroup.com/",
    description:
      "England Sports Group runs multi-sport holiday camps across Surrey and SW London including football, cricket and athletics.",
  },
};

type EnrichmentResult = {
  id: string;
  name: string;
  updated: string[];
  skipped: string[];
  scrapeUrl?: string;
};

async function main() {
  const prisma = createPrismaClient();

  const providers = await prisma.provider.findMany({
    where: providerFilter
      ? { name: { contains: providerFilter, mode: "insensitive" } }
      : undefined,
    orderBy: { name: "asc" },
  });

  console.log(`Found ${providers.length} providers${DRY_RUN ? " (dry run)" : ""}\n`);

  const results: EnrichmentResult[] = [];
  let updatedCount = 0;

  for (const provider of providers) {
    const result: EnrichmentResult = {
      id: provider.id,
      name: provider.name,
      updated: [],
      skipped: [],
    };

    const manual = MANUAL_OVERRIDES[provider.name];
    const websiteOverride = WEBSITE_OVERRIDES[provider.name];
    const scrapeUrl = getProviderScrapeUrl({
      website: websiteOverride ?? manual?.website ?? provider.website,
      sourceUrl: provider.sourceUrl,
    });

    result.scrapeUrl = scrapeUrl ?? undefined;

    const scraped = scrapeUrl ? await scrapeProviderPage(scrapeUrl) : null;
    if (scraped?.phone && !phoneIsValid(scraped.phone)) {
      delete scraped.phone;
    }
    if (!scrapeUrl) result.skipped.push("no scrape URL");
    if (scrapeUrl && !scraped) result.skipped.push("scrape failed");

    const patch: Record<string, string | null> = {};

    const fields: Array<{
      key: "description" | "contactEmail" | "phone" | "logoUrl" | "website" | "slug";
      current: string | null | undefined;
      scraped?: string;
      manual?: string;
    }> = [
      { key: "description", current: provider.description, scraped: scraped?.description, manual: manual?.description },
      { key: "contactEmail", current: provider.contactEmail, scraped: scraped?.contactEmail, manual: manual?.contactEmail },
      { key: "phone", current: provider.phone, scraped: scraped?.phone, manual: manual?.phone },
      { key: "logoUrl", current: provider.logoUrl, scraped: scraped?.logoUrl, manual: manual?.logoUrl },
      {
        key: "website",
        current: provider.website,
        manual: websiteOverride ?? manual?.website,
      },
      {
        key: "slug",
        current: provider.slug,
        manual: manual?.slug,
      },
    ];

    for (const field of fields) {
      const currentWebsiteOverride =
        field.key === "website" &&
        (websiteOverride != null || isPlaceholder(field.current));
      const currentIsPlaceholder =
        (field.key === "website" || field.key === "contactEmail") &&
        isPlaceholder(field.current);
      const currentPhoneInvalid =
        field.key === "phone" && isInvalidPhone(field.current);

      const forceUpdate = manual?.forceFields?.includes(field.key) ?? false;

      if (field.current && !currentIsPlaceholder && !currentPhoneInvalid && !currentWebsiteOverride && !forceUpdate) {
        result.skipped.push(`${field.key} already set`);
        continue;
      }
      const value = field.manual ?? field.scraped;
      if (!value && !(forceUpdate && field.key === "phone" && currentPhoneInvalid)) {
        if (forceUpdate && field.key === "phone" && currentPhoneInvalid) {
          patch[field.key] = null as unknown as string;
          result.updated.push(`${field.key} (cleared)`);
          continue;
        }
        result.skipped.push(`${field.key} not found`);
        continue;
      }
      if (field.key === "website" && value.includes("example.com")) {
        result.skipped.push("website is placeholder");
        continue;
      }
      if (field.key === "contactEmail" && value.includes(".example")) {
        result.skipped.push("email is placeholder");
        continue;
      }
      patch[field.key] = value;
      result.updated.push(field.key);
    }

    if (Object.keys(patch).length > 0) {
      updatedCount++;
      console.log(`✓ ${provider.name}`);
      console.log(`  scrape: ${scrapeUrl ?? "none"}`);
      console.log(`  update: ${result.updated.join(", ")}`);
      if (!DRY_RUN) {
        await prisma.provider.update({
          where: { id: provider.id },
          data: patch,
        });
      }
    } else {
      console.log(`– ${provider.name} (no changes)`);
    }

    results.push(result);

    // Be polite to provider sites
    await new Promise((r) => setTimeout(r, 500));
  }

  console.log(`\nDone: ${updatedCount} providers enriched${DRY_RUN ? " (dry run — no DB writes)" : ""}`);

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
