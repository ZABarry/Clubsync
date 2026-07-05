/**
 * Fetches camp images from website pages and writes imageUrl into clubs.json.
 *
 * Usage:
 *   npx tsx scripts/fetch-club-images.ts
 *   npx tsx scripts/fetch-club-images.ts --dry-run
 *   npx tsx scripts/fetch-club-images.ts --club-id camp_ultimate_kingston_activity_2026
 */

import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { extractImageFromPage } from "../lib/clubs/extract-page-image";

type ClubSeed = {
  clubId?: string;
  providerId: string;
  name: string;
  sourceUrl?: string;
  bookingUrl?: string;
  imageUrl?: string;
};

type ProviderSeed = {
  providerId: string;
  website?: string;
};

function loadJson<T>(filename: string): T {
  const filePath = join(__dirname, "..", "prisma", "seed-data", filename);
  return JSON.parse(readFileSync(filePath, "utf-8")) as T;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function uniqueUrls(urls: Array<string | undefined>): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const url of urls) {
    const trimmed = url?.trim();
    if (!trimmed || seen.has(trimmed)) continue;
    seen.add(trimmed);
    result.push(trimmed);
  }

  return result;
}

function parseArgs(argv: string[]) {
  return {
    dryRun: argv.includes("--dry-run"),
    clubId: argv.includes("--club-id")
      ? argv[argv.indexOf("--club-id") + 1]
      : undefined,
  };
}

async function findImageForClub(
  club: ClubSeed,
  providerWebsite?: string,
): Promise<string | null> {
  const urls = uniqueUrls([club.sourceUrl, club.bookingUrl, providerWebsite]);

  for (const url of urls) {
    const imageUrl = await extractImageFromPage(url);
    if (imageUrl) return imageUrl;
    await sleep(1000);
  }

  return null;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const clubs = loadJson<ClubSeed[]>("clubs.json");
  const providers = loadJson<ProviderSeed[]>("providers.json");

  const providerWebsiteById = new Map(
    providers.map((provider) => [provider.providerId, provider.website?.trim() || ""]),
  );

  const targetClubs = args.clubId
    ? clubs.filter((club) => club.clubId === args.clubId)
    : clubs;

  if (args.clubId && targetClubs.length === 0) {
    console.error(`No club found with clubId "${args.clubId}"`);
    process.exit(1);
  }

  let found = 0;
  let missing = 0;
  let errors = 0;
  const byDomain = new Map<string, { found: number; missing: number; errors: number }>();

  function bumpDomain(url: string | undefined, field: "found" | "missing" | "errors") {
    if (!url) return;
    try {
      const domain = new URL(url).hostname;
      const current = byDomain.get(domain) ?? { found: 0, missing: 0, errors: 0 };
      current[field] += 1;
      byDomain.set(domain, current);
    } catch {
      // ignore invalid URLs
    }
  }

  for (const club of targetClubs) {
    const providerWebsite = providerWebsiteById.get(club.providerId);
    process.stdout.write(`Fetching image for ${club.name}... `);

    try {
      const imageUrl = await findImageForClub(club, providerWebsite || undefined);
      club.imageUrl = imageUrl ?? "";

      if (imageUrl) {
        found += 1;
        bumpDomain(club.sourceUrl ?? club.bookingUrl, "found");
        console.log(`found ${imageUrl}`);
      } else {
        missing += 1;
        bumpDomain(club.sourceUrl ?? club.bookingUrl, "missing");
        console.log("missing");
      }
    } catch (error) {
      errors += 1;
      club.imageUrl = "";
      bumpDomain(club.sourceUrl ?? club.bookingUrl, "errors");
      console.log(`error (${error instanceof Error ? error.message : "unknown"})`);
    }

    if (!args.clubId) await sleep(1000);
  }

  if (!args.dryRun) {
    const clubsPath = join(__dirname, "..", "prisma", "seed-data", "clubs.json");
    writeFileSync(clubsPath, `${JSON.stringify(clubs, null, 2)}\n`);
    console.log(`\nUpdated ${clubsPath}`);
  } else {
    console.log("\nDry run — clubs.json not written");
  }

  console.log(`\nSummary: found=${found}, missing=${missing}, errors=${errors}`);
  console.log("By domain:");
  for (const [domain, stats] of [...byDomain.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    console.log(`  ${domain}: found=${stats.found}, missing=${stats.missing}, errors=${stats.errors}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
