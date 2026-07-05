/**
 * Validates and summarizes prisma/seed-data camp import JSON.
 * Optional: geocode addresses via Nominatim (1 req/sec).
 *
 * Usage:
 *   npx tsx scripts/build-camp-import.ts
 *   npx tsx scripts/build-camp-import.ts --geocode "Holy Cross Prep School, KT2 7NU"
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";

const ORIGIN = { lat: 51.401, lon: -0.256, label: "KT3 3HL (New Malden)" };
const MAX_RADIUS_KM = 25;

type ClubSeed = {
  clubId?: string;
  providerId: string;
  name: string;
  locationName: string;
  address?: string;
  lat: number;
  lon: number;
  activities: string;
  ageMin: number;
  ageMax: number;
  startDate?: string;
  endDate?: string;
  dataConfidence?: string;
  status?: string;
  distanceFromKt33hlKm?: number;
  imageUrl?: string;
};

type ProviderSeed = {
  providerId: string;
  name: string;
};

function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function loadJson<T>(filename: string): T {
  const filePath = join(__dirname, "..", "prisma", "seed-data", filename);
  return JSON.parse(readFileSync(filePath, "utf-8")) as T;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function geocodeAddress(query: string): Promise<{
  lat: number;
  lon: number;
  displayName: string;
} | null> {
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", query);
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "1");
  url.searchParams.set("countrycodes", "gb");

  const response = await fetch(url.toString(), {
    headers: { "User-Agent": "ClubZer/1.0 camp-import-script" },
  });
  if (!response.ok) return null;

  const results = (await response.json()) as Array<{
    lat: string;
    lon: string;
    display_name: string;
  }>;
  if (results.length === 0) return null;

  return {
    lat: Number.parseFloat(results[0].lat),
    lon: Number.parseFloat(results[0].lon),
    displayName: results[0].display_name,
  };
}

function validateClub(club: ClubSeed, providerIds: Set<string>): string[] {
  const errors: string[] = [];
  if (!providerIds.has(club.providerId)) {
    errors.push(`unknown providerId: ${club.providerId}`);
  }
  if (!club.name?.trim()) errors.push("missing name");
  if (!club.locationName?.trim()) errors.push("missing locationName");
  if (!Number.isFinite(club.lat) || !Number.isFinite(club.lon)) {
    errors.push("invalid lat/lon");
  }
  if (club.ageMin > club.ageMax) errors.push("ageMin > ageMax");
  if (!club.activities && club.activities !== "") {
    errors.push("missing activities");
  }

  const distance = haversineKm(ORIGIN.lat, ORIGIN.lon, club.lat, club.lon);
  if (distance > MAX_RADIUS_KM) {
    errors.push(`outside ${MAX_RADIUS_KM}km radius (${distance.toFixed(1)}km)`);
  }

  const placeholderVenues = ["venue", "area venue", "local theatre"];
  if (
    placeholderVenues.some((p) => club.locationName.toLowerCase().includes(p))
  ) {
    errors.push(`placeholder locationName: ${club.locationName}`);
  }

  if (club.status === "active" && club.dataConfidence !== "high") {
    errors.push("active club without high dataConfidence");
  }

  if (club.status === "active" && (!club.startDate || !club.endDate)) {
    errors.push("active club missing dates");
  }

  return errors;
}

async function main() {
  const geocodeArg = process.argv.find((a) => a === "--geocode");
  const geocodeQuery = geocodeArg
    ? process.argv[process.argv.indexOf("--geocode") + 1]
    : null;

  if (geocodeQuery) {
    await sleep(1000);
    const result = await geocodeAddress(geocodeQuery);
    if (!result) {
      console.error(`No geocode result for: ${geocodeQuery}`);
      process.exit(1);
    }
    const distance = haversineKm(
      ORIGIN.lat,
      ORIGIN.lon,
      result.lat,
      result.lon,
    );
    console.log(JSON.stringify({ ...result, distanceKm: distance }, null, 2));
    return;
  }

  const providers = loadJson<ProviderSeed[]>("providers.json");
  const clubs = loadJson<ClubSeed[]>("clubs.json");
  const providerIds = new Set(providers.map((p) => p.providerId));

  let active = 0;
  let draft = 0;
  let withinRadius = 0;
  let withImage = 0;
  const allErrors: Array<{ clubId: string; errors: string[] }> = [];

  for (const club of clubs) {
    if (club.status === "active") active++;
    else draft++;
    if (club.imageUrl?.trim()) withImage++;

    const distance = haversineKm(ORIGIN.lat, ORIGIN.lon, club.lat, club.lon);
    if (distance <= MAX_RADIUS_KM) withinRadius++;

    const errors = validateClub(club, providerIds);
    if (errors.length > 0) {
      allErrors.push({
        clubId: club.clubId ?? club.name,
        errors,
      });
    }
  }

  console.log(`Origin: ${ORIGIN.label}`);
  console.log(`Providers: ${providers.length}`);
  console.log(`Clubs: ${clubs.length} (${active} active, ${draft} draft)`);
  console.log(`With imageUrl: ${withImage}/${clubs.length}`);
  console.log(`Within ${MAX_RADIUS_KM}km: ${withinRadius}/${clubs.length}`);

  if (allErrors.length > 0) {
    console.log(`\nValidation issues (${allErrors.length}):`);
    for (const item of allErrors) {
      console.log(`  ${item.clubId}:`);
      for (const err of item.errors) {
        console.log(`    - ${err}`);
      }
    }
    process.exit(1);
  }

  console.log("\nAll records passed validation.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
