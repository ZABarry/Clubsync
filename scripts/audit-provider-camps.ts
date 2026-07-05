/**
 * Compare provider websites against DB clubs (SW London, 30km from New Malden).
 *
 * Usage:
 *   npx tsx scripts/audit-provider-camps.ts
 */
import { config } from "dotenv";
import { createPrismaClient } from "../lib/db/create-prisma-client";
import { distanceFromNewMaldenKm, isWithinRadius } from "../lib/clubs/geo-utils";

config({ path: ".env.local" });
config();

/** Venues discovered on provider websites (Jul 2026 research pass) */
type KnownVenue = {
  providerSlug: string;
  locationName: string;
  postcode: string;
  sourceUrl: string;
  notes?: string;
};

const KNOWN_VENUES: KnownVenue[] = [
  // Activ Camps — booking.activcamps.com/venues (SW London)
  { providerSlug: "prov_activ_camps", locationName: "Wimbledon College", postcode: "SW19 4NS", sourceUrl: "https://www.activcamps.com/wimbledoncollege/" },
  { providerSlug: "prov_activ_camps", locationName: "Emanuel School", postcode: "SW11 1HS", sourceUrl: "https://www.activcamps.com/emanuel-school/" },
  { providerSlug: "prov_activ_camps", locationName: "Graveney School", postcode: "SW17 9BU", sourceUrl: "https://www.activcamps.com/graveney-school/" },
  { providerSlug: "prov_activ_camps", locationName: "La Retraite School", postcode: "SW12 0AB", sourceUrl: "https://www.activcamps.com/la-retraite-school/" },
  { providerSlug: "prov_activ_camps", locationName: "Barn Elms Sports Trust", postcode: "SW13 9SA", sourceUrl: "https://www.activcamps.com/barn-elms-sports-trust/" },
  { providerSlug: "prov_activ_camps", locationName: "St Paul's School", postcode: "SW13 9JT", sourceUrl: "https://www.activcamps.com/st-pauls-school/" },

  // AM Sports Academy
  { providerSlug: "prov_am_sports", locationName: "Wimbledon Park Primary School", postcode: "SW19 8EJ", sourceUrl: "https://www.amsportsacademy.co.uk/camps/" },
  { providerSlug: "prov_am_sports", locationName: "Floreat Wandsworth Primary School", postcode: "SW18 4EQ", sourceUrl: "https://www.amsportsacademy.co.uk/camps/" },

  // Camp Beaumont — campbeaumont.co.uk/dates-prices/summer-camps (within radius)
  { providerSlug: "prov_camp_beaumont", locationName: "Hollyfield School", postcode: "KT6 4TU", sourceUrl: "https://www.campbeaumont.co.uk/our-camps/hollyfield-school" },
  { providerSlug: "prov_camp_beaumont", locationName: "Donhead Preparatory School", postcode: "SW19 4NP", sourceUrl: "https://www.campbeaumont.co.uk/our-camps/donhead-preparatory-school" },
  { providerSlug: "prov_camp_beaumont", locationName: "King's College School Wimbledon", postcode: "SW19 4TT", sourceUrl: "https://www.campbeaumont.co.uk/our-camps/kings-college-school" },
  { providerSlug: "prov_camp_beaumont", locationName: "Unicorn School Richmond", postcode: "TW9 3JX", sourceUrl: "https://www.campbeaumont.co.uk/our-camps/unicorn-school" },
  { providerSlug: "prov_camp_beaumont", locationName: "Claremont Fan Court School", postcode: "KT10 9HZ", sourceUrl: "https://www.campbeaumont.co.uk/our-camps/claremont-fan-court-school" },
  { providerSlug: "prov_camp_beaumont", locationName: "Chinthurst School Tadworth", postcode: "KT20 5QZ", sourceUrl: "https://www.campbeaumont.co.uk/our-camps/chinthurst-school" },
  { providerSlug: "prov_camp_beaumont", locationName: "Danes Hill School Oxshott", postcode: "KT22 0JG", sourceUrl: "https://www.campbeaumont.co.uk/our-camps/danes-hill-school" },

  // Outdoor Owls — outdoorowls.com/holiday-camps
  { providerSlug: "prov_outdoor_owls", locationName: "Putney drop-off (Putney Station)", postcode: "SW15 1RT", sourceUrl: "https://www.outdoorowls.com/holiday-camps-putney" },
  { providerSlug: "prov_outdoor_owls", locationName: "Sands End Arts & Community Centre Fulham", postcode: "SW6 3EZ", sourceUrl: "https://www.outdoorowls.com/holiday-camps-fulham" },
  { providerSlug: "prov_outdoor_owls", locationName: "Richmond & Putney Unitarians Church", postcode: "TW10 6TH", sourceUrl: "https://www.outdoorowls.com/holiday-camps-richmond" },

  // Brilliant Play
  { providerSlug: "prov_brilliant_play", locationName: "The Wilderness", postcode: "TW11 9RP", sourceUrl: "https://brilliantplay.co.uk/fuel-holiday-camps/" },
  { providerSlug: "prov_brilliant_play", locationName: "Marble Hill Playcentres", postcode: "TW1 2NL", sourceUrl: "https://brilliantplay.co.uk/fuel-holiday-camps/" },

  // Ultimate Activity — ultimateactivity.co.uk/locations
  { providerSlug: "prov_ultimate", locationName: "Holy Cross Prep School", postcode: "KT1 2ET", sourceUrl: "https://www.ultimateactivity.co.uk/locations/holy-cross-school" },
  { providerSlug: "prov_ultimate", locationName: "Shrewsbury House Prep School", postcode: "KT6 4QQ", sourceUrl: "https://www.ultimateactivity.co.uk/locations/surbiton-shrewsbury-house" },
  { providerSlug: "prov_ultimate", locationName: "Hinchley Wood Sports Ground", postcode: "KT10 0QY", sourceUrl: "https://www.ultimateactivity.co.uk/locations/surbiton-hinchley" },
  { providerSlug: "prov_ultimate", locationName: "Fulham Cross Girls' School", postcode: "SW6 6BP", sourceUrl: "https://www.ultimateactivity.co.uk/locations/fulham-cross-girls-school", notes: "Running summer 2026" },
  { providerSlug: "prov_ultimate", locationName: "Prospect House School Putney", postcode: "SW15 3NT", sourceUrl: "https://www.ultimateactivity.co.uk/locations/prospect-house-school", notes: "NOT running 2026" },

  // KOOSA Kids — koosakids.co.uk
  { providerSlug: "prov_koosa", locationName: "King Athelstan Primary School", postcode: "KT1 3AR", sourceUrl: "https://www.koosakids.co.uk/greater-london/kingston-upon-thames/king-athelstan-primary-school-kingston-upon-thames/holiday-club" },
  { providerSlug: "prov_koosa", locationName: "Castle Hill Primary School", postcode: "KT9 1HR", sourceUrl: "https://www.koosakids.co.uk/greater-london/chessington/castle-hill-primary-school-chessington/holiday-club" },
  { providerSlug: "prov_koosa", locationName: "Wallace Fields Infant School", postcode: "KT19 9JW", sourceUrl: "https://www.koosakids.co.uk/surrey/epsom/wallace-fields-infant-school-epsom/holiday-club" },
  { providerSlug: "prov_koosa", locationName: "Danetree Primary School", postcode: "KT19 9RT", sourceUrl: "https://www.koosakids.co.uk/surrey/west-ewell/danetree-primary-school-west-ewell/holiday-club" },
  { providerSlug: "prov_koosa", locationName: "St Mary's Hampton Primary School", postcode: "TW12 2HP", sourceUrl: "https://www.koosakids.co.uk/greater-london/hampton/st-marys-hampton-primary-school-hampton/holiday-club" },
  { providerSlug: "prov_koosa", locationName: "Whitton Sports Centre", postcode: "TW2 6JW", sourceUrl: "https://www.koosakids.co.uk/greater-london/whitton/whitton-sports-centre-whitton/holiday-club" },

  // Fun Fest
  { providerSlug: "prov_fun_fest", locationName: "St Paul's CofE Primary School Kingston", postcode: "KT1 3EE", sourceUrl: "https://fun-fest.co.uk/kingston/" },
  { providerSlug: "prov_fun_fest", locationName: "Joseph Hood Primary School", postcode: "SW20 9DD", sourceUrl: "https://fun-fest.co.uk/wimbledonsouth/" },
  { providerSlug: "prov_fun_fest", locationName: "Malden Parochial CofE Primary School", postcode: "KT4 7AA", sourceUrl: "https://fun-fest.co.uk/worcesterpark/" },

  // Roar Academy
  { providerSlug: "prov_roar", locationName: "Fern Hill Primary School", postcode: "KT2 5PE", sourceUrl: "https://www.roarkidsacademy.com/locations" },
  { providerSlug: "prov_roar", locationName: "Malden Manor Primary and Nursery School", postcode: "KT3 5PX", sourceUrl: "https://www.roarkidsacademy.com/locations" },
  { providerSlug: "prov_roar", locationName: "St Agatha's Catholic Primary School", postcode: "KT1 2NY", sourceUrl: "https://www.roarkidsacademy.com/locations" },
  { providerSlug: "prov_roar", locationName: "St Luke's CofE Primary School", postcode: "KT3 5DW", sourceUrl: "https://www.roarkidsacademy.com/locations" },
];

function normalizeLocation(s: string): string {
  return s
    .toLowerCase()
    .replace(/['']/g, "")
    .replace(/\([^)]*\)/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function clubMatchesVenue(clubLocation: string, venueLocation: string): boolean {
  const a = normalizeLocation(clubLocation);
  const b = normalizeLocation(venueLocation);
  if (a.includes(b) || b.includes(a)) return true;
  const aWords = a.split(" ").filter((w) => w.length > 3);
  const bWords = b.split(" ").filter((w) => w.length > 3);
  const overlap = aWords.filter((w) => bWords.some((bw) => bw.includes(w) || w.includes(bw)));
  return overlap.length >= 2;
}

async function main() {
  const prisma = createPrismaClient();

  const providers = await prisma.provider.findMany({
    include: {
      clubs: {
        where: { status: { in: ["ACTIVE", "DRAFT"] } },
        select: {
          name: true,
          locationName: true,
          status: true,
          startDate: true,
          endDate: true,
          dailyRate: true,
          price: true,
          priceNote: true,
          bookingUrl: true,
          imageUrl: true,
          description: true,
          dataConfidence: true,
        },
      },
    },
    orderBy: { name: "asc" },
  });

  const providerBySlug = new Map(providers.filter((p) => p.slug).map((p) => [p.slug!, p]));

  console.log("\n=== Provider camp audit (SW London, 30km from New Malden) ===\n");

  const missingVenues: Array<{ provider: string; venue: KnownVenue }> = [];
  const providersNoClubs: string[] = [];
  const detailGaps: Array<{ provider: string; club: string; gaps: string[] }> = [];

  for (const provider of providers) {
    const liveClubs = provider.clubs;
    if (liveClubs.length === 0) {
      providersNoClubs.push(provider.name);
    }

    for (const club of liveClubs) {
      const gaps: string[] = [];
      if (!club.startDate || !club.endDate) gaps.push("dates");
      if (club.dailyRate == null && club.price == null && !club.priceNote) gaps.push("price");
      if (!club.bookingUrl) gaps.push("bookingUrl");
      if (!club.imageUrl) gaps.push("image");
      if (!club.description) gaps.push("description");
      if (club.dailyRate != null && club.dailyRate > 500) gaps.push("suspicious dailyRate");
      if (club.price != null && club.price > 500) gaps.push("suspicious price");

      if (gaps.length > 0) {
        detailGaps.push({ provider: provider.name, club: club.name, gaps });
      }
    }
  }

  for (const venue of KNOWN_VENUES) {
    const provider = providerBySlug.get(venue.providerSlug);
    if (!provider) continue;

    const matched = provider.clubs.some((c) => clubMatchesVenue(c.locationName, venue.locationName));
    if (!matched) {
      missingVenues.push({ provider: provider.name, venue });
    }
  }

  console.log("--- Providers with zero live clubs ---");
  for (const name of providersNoClubs) {
    console.log(`  • ${name}`);
  }

  console.log(`\n--- Missing venues on provider sites (${missingVenues.length}) ---`);
  for (const { provider, venue } of missingVenues) {
    const inRadius = isWithinRadius(51.4, -0.25);
    void inRadius;
    console.log(`  • ${provider}: ${venue.locationName} (${venue.postcode})`);
    if (venue.notes) console.log(`      ↳ ${venue.notes}`);
    console.log(`      ${venue.sourceUrl}`);
  }

  console.log(`\n--- Existing clubs with data gaps (${detailGaps.length}) ---`);
  for (const item of detailGaps) {
    console.log(`  • ${item.provider} / ${item.club}: ${item.gaps.join(", ")}`);
  }

  const draftCount = providers.reduce(
    (n, p) => n + p.clubs.filter((c) => c.status === "DRAFT").length,
    0,
  );
  const activeCount = providers.reduce(
    (n, p) => n + p.clubs.filter((c) => c.status === "ACTIVE").length,
    0,
  );

  console.log("\n--- Summary ---");
  console.log(`  Providers: ${providers.length}`);
  console.log(`  Live clubs: ${activeCount} active, ${draftCount} draft`);
  console.log(`  Known missing venues: ${missingVenues.length}`);
  console.log(`  Clubs needing detail work: ${detailGaps.length}`);

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
