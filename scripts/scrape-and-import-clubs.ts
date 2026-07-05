/**
 * Comprehensive scrape + DB import for clubs within 30km of New Malden.
 *
 * Usage:
 *   npx tsx scripts/scrape-and-import-clubs.ts
 *   npx tsx scripts/scrape-and-import-clubs.ts --dry-run
 */
import { config } from "dotenv";
import { ClubStatus, ClubPromotionStatus } from "@prisma/client";
import { decideClubPublishStatus } from "../lib/clubs/club-publish-rules";
import {
  distanceFromNewMaldenKm,
  geocodePostcode,
  isWithinRadius,
  MAX_RADIUS_KM,
  NEW_MALDON_ORIGIN,
} from "../lib/clubs/geo-utils";
import { parseClubPrice } from "../lib/clubs/parse-club-price";
import { scrapeClubPage, type ScrapedClubData } from "../lib/clubs/scrape-page-data";
import { createPrismaClient } from "../lib/db/create-prisma-client";

config({ path: ".env.local" });
config();

const DRY_RUN = process.argv.includes("--dry-run");

type ProviderSeed = {
  slug: string;
  name: string;
  website: string;
  sourceUrl?: string;
};

type ClubSeed = {
  providerSlug: string;
  name: string;
  locationName: string;
  address: string;
  postcode: string;
  /** Use when postcodes.io is unavailable */
  latitude?: number;
  longitude?: number;
  activities: string[];
  ageMin: number;
  ageMax: number;
  scrapeUrl: string;
  bookingUrl?: string;
  description?: string;
  isIndoor?: boolean;
  isOutdoor?: boolean;
  /** Manual overrides when scrape is incomplete */
  overrides?: Partial<ScrapedClubData>;
};

const PROVIDER_SEEDS: ProviderSeed[] = [
  {
    slug: "prov_barracudas",
    name: "Barracudas Activity Camps",
    website: "https://www.barracudas.co.uk/",
    sourceUrl: "https://www.barracudas.co.uk/camps",
  },
  {
    slug: "prov_sparks",
    name: "Sparks Film School",
    website: "https://sparksarts.co.uk/",
  },
  {
    slug: "prov_guildford_spectrum",
    name: "Guildford Spectrum Holiday Club",
    website: "https://www.guildfordspectrum.co.uk/",
  },
  {
    slug: "prov_outdoor_owls",
    name: "Outdoor Owls",
    website: "https://www.outdoorowls.com/",
  },
  {
    slug: "prov_mother_nature",
    name: "Mother Nature Science",
    website: "https://www.mnature.co.uk/",
  },
  {
    slug: "prov_mad_science",
    name: "Mad Science Surrey",
    website: "https://surrey.madscience.org/",
  },
  {
    slug: "prov_youth_ultimate",
    name: "Youth Ultimate UK",
    website: "https://www.youthultimate.co.uk/",
  },
];

const CLUB_SEEDS: ClubSeed[] = [
  {
    providerSlug: "prov_barracudas",
    name: "Barracudas Cobham Holiday Camp",
    locationName: "Notre Dame School Cobham",
    address: "Notre Dame School, Convent Lane, Cobham, Surrey, KT11 1HA",
    postcode: "KT11 1HA",
    activities: ["multi-activity", "swimming", "sports", "drama", "arts and crafts"],
    ageMin: 4,
    ageMax: 14,
    scrapeUrl: "https://front-facing-live.barracudas.co.uk/camps/cobham/",
    description:
      "Ofsted-registered multi-activity holiday camp with swimming pool, 80+ activities and Skills Builder courses.",
    isIndoor: true,
    isOutdoor: true,
    overrides: {
      startDate: "2026-07-27",
      endDate: "2026-08-21",
      dailyStartTime: "08:30",
      dailyEndTime: "17:30",
      dailyRate: 49.8,
      priceNote: "£49.80 per day; £249 per week (summer 2026)",
    },
  },
  {
    providerSlug: "prov_barracudas",
    name: "Barracudas Tadworth Holiday Camp",
    locationName: "Aberdour School Tadworth",
    address: "Aberdour School, Brighton Road, Burgh Heath, Tadworth, Surrey, KT20 6AJ",
    postcode: "KT20 6AJ",
    activities: ["multi-activity", "swimming", "sports", "dance", "arts and crafts"],
    ageMin: 4,
    ageMax: 14,
    scrapeUrl: "https://front-facing-live.barracudas.co.uk/camps/tadworth/",
    isIndoor: true,
    isOutdoor: true,
    overrides: {
      startDate: "2026-07-27",
      endDate: "2026-08-21",
      dailyStartTime: "08:30",
      dailyEndTime: "17:30",
      dailyRate: 43,
      priceNote: "£43 per day; £215 per week (summer 2026)",
    },
  },
  {
    providerSlug: "prov_barracudas",
    name: "Barracudas Twickenham Waldegrave Holiday Camp",
    locationName: "Waldegrave School Twickenham",
    address: "Waldegrave School, Fifth Cross Road, Twickenham, TW2 5LH",
    postcode: "TW2 5LH",
    activities: ["multi-activity", "sports", "drama", "dance", "water park"],
    ageMin: 4,
    ageMax: 14,
    scrapeUrl: "https://front-facing-live.barracudas.co.uk/camps/twickenham-waldegrave/",
    isIndoor: true,
    isOutdoor: true,
    overrides: {
      startDate: "2026-07-27",
      endDate: "2026-08-21",
      dailyStartTime: "08:30",
      dailyEndTime: "17:30",
      dailyRate: 51.8,
      priceNote: "£51.80 per day; £259 per week (summer 2026)",
    },
  },
  {
    providerSlug: "prov_barracudas",
    name: "Barracudas Twickenham St Catherine's Holiday Camp",
    locationName: "St Catherine's School Twickenham",
    address: "St Catherine's School, Cross Deep, Twickenham, TW1 4QJ",
    postcode: "TW1 4QJ",
    activities: ["multi-activity", "swimming", "sports", "drama", "arts and crafts"],
    ageMin: 4,
    ageMax: 14,
    scrapeUrl: "https://front-facing-live.barracudas.co.uk/camps/twickenham-st-catherines/",
    isIndoor: true,
    isOutdoor: true,
    overrides: {
      startDate: "2026-07-27",
      endDate: "2026-08-28",
      dailyStartTime: "08:30",
      dailyEndTime: "17:30",
      dailyRate: 51.8,
      priceNote: "£51.80 per day; verify weekly rate on Barracudas booking page",
    },
  },
  {
    providerSlug: "prov_barracudas",
    name: "Barracudas Woking Holiday Camp",
    locationName: "Gordon's School Woking",
    address: "Gordon's School, West End, Woking, Surrey, GU24 9PT",
    postcode: "GU24 9PT",
    activities: ["multi-activity", "swimming", "sports", "drama", "arts and crafts"],
    ageMin: 4,
    ageMax: 14,
    scrapeUrl: "https://front-facing-live.barracudas.co.uk/camps/woking/",
    isIndoor: true,
    isOutdoor: true,
    overrides: {
      startDate: "2026-07-27",
      endDate: "2026-08-21",
      dailyStartTime: "08:30",
      dailyEndTime: "17:30",
      dailyRate: 51.8,
      priceNote: "£51.80 per day; £259 per week (summer 2026)",
    },
  },
  {
    providerSlug: "prov_sparks",
    name: "Sparks Animation Summer Camp Wimbledon",
    locationName: "Donhead Prep School",
    address: "Donhead Prep School, 33 Edge Hill, London, SW19 4NP",
    postcode: "SW19 4NP",
    activities: ["animation", "filmmaking", "stop motion", "creative arts"],
    ageMin: 5,
    ageMax: 15,
    scrapeUrl:
      "https://sparksarts.co.uk/product/animation-summer-camps-at-sparks-film-school-wimbledon/",
    overrides: {
      priceNote: "£395 per week (5-day camp, 10:00-16:00); extended hours available",
      weeklyPrice: 395,
      startDate: "2026-07-20",
      endDate: "2026-08-21",
      dailyStartTime: "10:00",
      dailyEndTime: "16:00",
    },
  },
  {
    providerSlug: "prov_guildford_spectrum",
    name: "Guildford Spectrum Xtreme Activate Holiday Club",
    locationName: "Guildford Spectrum",
    address: "Guildford Spectrum, Parkway, Guildford, GU1 1UP",
    postcode: "GU1 1UP",
    activities: ["multi-activity", "swimming", "ice skating", "bowling", "sports"],
    ageMin: 5,
    ageMax: 12,
    scrapeUrl:
      "https://www.guildfordspectrum.co.uk/extra-activities/xtreme-activate-holiday-day-camps/",
    overrides: {
      startDate: "2026-07-23",
      endDate: "2026-09-02",
      dailyStartTime: "08:30",
      dailyEndTime: "18:00",
      priceNote: "Contact provider for daily rates; extended hours 8:30am-6:00pm",
    },
  },
  {
    providerSlug: "prov_mother_nature",
    name: "Mother Nature Science Kingston Holiday Camp",
    locationName: "Kingston venues (multiple)",
    address: "Kingston upon Thames, KT1",
    postcode: "KT1 1EU",
    activities: ["science", "STEM", "experiments"],
    ageMin: 5,
    ageMax: 12,
    scrapeUrl: "https://www.mnature.co.uk/product/july-august-summer-science-activity-camp-swlondon/",
    bookingUrl:
      "https://www.mnature.co.uk/product/july-august-summer-science-activity-camp-swlondon/",
    overrides: {
      startDate: "2026-07-06",
      endDate: "2026-08-28",
      dailyStartTime: "09:00",
      dailyEndTime: "15:30",
      priceNote: "Week blocks Mon-Fri; extended hours 8:30-16:00 +£10/day",
    },
  },
  {
    providerSlug: "prov_mad_science",
    name: "Mad Science Guildford Summer Camp",
    locationName: "Guildford venues",
    address: "Guildford, GU1",
    postcode: "GU1 1AA",
    activities: ["science", "STEM", "experiments"],
    ageMin: 5,
    ageMax: 11,
    scrapeUrl: "https://surrey.madscience.org/parents-register-camps.aspx",
    bookingUrl: "https://surrey.madscience.org/parents-register-camps.aspx",
    overrides: {
      startDate: "2026-07-20",
      endDate: "2026-08-28",
      priceNote: "Verify dates and pricing on Mad Science Surrey booking page",
    },
  },
  {
    providerSlug: "prov_youth_ultimate",
    name: "Youth Ultimate MultiSports Guildford Camp",
    locationName: "St Peter's Catholic Primary School",
    address: "St Peter's Catholic Primary School, Eastgate Gardens, Guildford, GU1 4AZ",
    postcode: "GU1 4AZ",
    activities: ["multi-sport", "football", "cricket", "athletics"],
    ageMin: 4,
    ageMax: 16,
    scrapeUrl: "https://www.youthultimate.co.uk/",
    bookingUrl: "https://www.youthultimate.co.uk/",
    overrides: {
      startDate: "2026-07-27",
      endDate: "2026-07-31",
      dailyStartTime: "09:00",
      dailyEndTime: "16:00",
      priceNote: "Ofsted registered; verify pricing on Youth Ultimate booking page",
    },
  },

  // --- SW London discovery pass (Jul 2026) ---

  {
    providerSlug: "prov_am_sports",
    name: "AM Sports Academy Floreat Wandsworth",
    locationName: "Floreat Wandsworth Primary School",
    address: "Floreat Wandsworth Primary School, 305 Garratt Lane, London, SW18 4EQ",
    postcode: "SW18 4EQ",
    latitude: 51.456,
    longitude: -0.189,
    activities: ["multi-sport", "football", "cricket", "athletics", "tennis"],
    ageMin: 4,
    ageMax: 12,
    scrapeUrl: "https://www.amsportsacademy.co.uk/camps/",
    overrides: {
      startDate: "2026-07-20",
      endDate: "2026-08-28",
      dailyStartTime: "09:30",
      dailyEndTime: "16:30",
      dailyRate: 48.5,
      priceNote: "£48.50 per day (9:30am–4:30pm); 20% EARLYBIRD until 5 Jul 2026",
    },
  },
  {
    providerSlug: "prov_activ_camps",
    name: "Activ Camps Emanuel School",
    locationName: "Emanuel School",
    address: "Emanuel School, Battersea Rise, London, SW11 1HS",
    postcode: "SW11 1HS",
    latitude: 51.461,
    longitude: -0.176,
    activities: ["multi-activity", "swimming", "climbing", "sports", "inflatables"],
    ageMin: 4,
    ageMax: 14,
    scrapeUrl: "https://www.activcamps.com/emanuel-school/",
    isIndoor: true,
    isOutdoor: true,
    overrides: {
      startDate: "2026-07-20",
      endDate: "2026-08-28",
      dailyStartTime: "08:30",
      dailyEndTime: "17:00",
      dailyRate: 56,
      priceNote: "From £56 per day; £50/day full week; after-camp until 6pm +£6.50",
    },
  },
  {
    providerSlug: "prov_activ_camps",
    name: "Activ Camps Graveney School",
    locationName: "Graveney School",
    address: "Graveney School, Welham Road, London, SW17 9BU",
    postcode: "SW17 9BU",
    latitude: 51.428,
    longitude: -0.148,
    activities: ["multi-activity", "climbing", "sports", "inflatables"],
    ageMin: 4,
    ageMax: 14,
    scrapeUrl: "https://www.activcamps.com/graveney-school/",
    isIndoor: true,
    isOutdoor: true,
    overrides: {
      startDate: "2026-07-20",
      endDate: "2026-08-28",
      dailyStartTime: "08:30",
      dailyEndTime: "17:00",
      dailyRate: 56,
      priceNote: "From £56 per day; sibling discount available",
    },
  },
  {
    providerSlug: "prov_activ_camps",
    name: "Activ Camps La Retraite School",
    locationName: "La Retraite School",
    address: "La Retraite Roman Catholic Girls' School, Atkins Road, London, SW12 0AB",
    postcode: "SW12 0AB",
    latitude: 51.435,
    longitude: -0.132,
    activities: ["multi-activity", "dance", "sports", "inflatables"],
    ageMin: 4,
    ageMax: 14,
    scrapeUrl: "https://www.activcamps.com/la-retraite-school/",
    isIndoor: true,
    isOutdoor: true,
    overrides: {
      startDate: "2026-07-20",
      endDate: "2026-08-28",
      dailyStartTime: "08:30",
      dailyEndTime: "17:00",
      dailyRate: 56,
      priceNote: "From £56 per day; sibling discount available",
    },
  },
  {
    providerSlug: "prov_activ_camps",
    name: "Activ Camps Barn Elms Sports Trust",
    locationName: "Barn Elms Sports Trust",
    address: "Barn Elms Sports Centre, Queen Elizabeth Walk, London, SW13 9SA",
    postcode: "SW13 9SA",
    latitude: 51.471,
    longitude: -0.232,
    activities: ["multi-activity", "athletics", "sports", "inflatables"],
    ageMin: 4,
    ageMax: 14,
    scrapeUrl: "https://www.activcamps.com/barn-elms-sports-trust/",
    isIndoor: true,
    isOutdoor: true,
    overrides: {
      startDate: "2026-07-20",
      endDate: "2026-08-28",
      dailyStartTime: "08:30",
      dailyEndTime: "17:00",
      dailyRate: 56,
      priceNote: "From £56 per day; sibling discount available",
    },
  },
  {
    providerSlug: "prov_activ_camps",
    name: "Activ Camps St Paul's School",
    locationName: "St Paul's School",
    address: "St Paul's School, Lonsdale Road, Barnes, London, SW13 9JT",
    postcode: "SW13 9JT",
    latitude: 51.488,
    longitude: -0.243,
    activities: ["multi-activity", "swimming", "sports", "inflatables"],
    ageMin: 4,
    ageMax: 14,
    scrapeUrl: "https://www.activcamps.com/st-pauls-school/",
    isIndoor: true,
    isOutdoor: true,
    overrides: {
      startDate: "2026-07-20",
      endDate: "2026-08-28",
      dailyStartTime: "08:30",
      dailyEndTime: "17:00",
      dailyRate: 56,
      priceNote: "From £56 per day; sibling discount available",
    },
  },
  {
    providerSlug: "prov_outdoor_owls",
    name: "Outdoor Owls Putney Holiday Camp",
    locationName: "Putney Station drop-off",
    address: "Putney Station (Stop H), Putney High Street, London, SW15 1RT",
    postcode: "SW15 1RT",
    latitude: 51.461,
    longitude: -0.216,
    activities: ["forest school", "arts and crafts", "outdoor adventure", "nature"],
    ageMin: 4,
    ageMax: 7,
    scrapeUrl: "https://www.outdoorowls.com/holiday-camps-putney",
    bookingUrl: "https://www.outdoorowls.com/holiday-camps-putney",
    description:
      "Forest school holiday camp for ages 4–7. Drop-off at Putney Station; minibus to Cobham nature site included.",
    isIndoor: false,
    isOutdoor: true,
    overrides: {
      startDate: "2026-07-27",
      endDate: "2026-08-28",
      dailyStartTime: "08:00",
      dailyEndTime: "17:30",
      dailyRate: 86,
      priceNote: "£86 per day (8am–5:30pm); minibus to Cobham included; book 2 weekdays ahead",
    },
  },
  {
    providerSlug: "prov_outdoor_owls",
    name: "Outdoor Owls Fulham Holiday Camp",
    locationName: "Sands End Arts & Community Centre",
    address: "Sands End Arts & Community Centre, Peterborough Road, Fulham, SW6 3EZ",
    postcode: "SW6 3EZ",
    latitude: 51.471,
    longitude: -0.195,
    activities: ["forest school", "arts and crafts", "outdoor adventure", "nature"],
    ageMin: 4,
    ageMax: 7,
    scrapeUrl: "https://www.outdoorowls.com/holiday-camps-fulham",
    bookingUrl: "https://www.outdoorowls.com/holiday-camps-fulham",
    description:
      "Forest school holiday camp for ages 4–7. Drop-off at Sands End; minibus to Cobham nature site included.",
    isIndoor: false,
    isOutdoor: true,
    overrides: {
      startDate: "2026-07-27",
      endDate: "2026-08-28",
      dailyStartTime: "08:00",
      dailyEndTime: "17:30",
      dailyRate: 86,
      priceNote: "£86 per day (8am–5:30pm); minibus to Cobham included",
    },
  },
  {
    providerSlug: "prov_outdoor_owls",
    name: "Outdoor Owls Richmond Holiday Camp",
    locationName: "Richmond & Putney Unitarians Church",
    address: "Richmond & Putney Unitarians Church, Ormond Road, Richmond, TW10 6TH",
    postcode: "TW10 6TH",
    latitude: 51.458,
    longitude: -0.31,
    activities: ["forest school", "arts and crafts", "outdoor adventure", "nature"],
    ageMin: 4,
    ageMax: 7,
    scrapeUrl: "https://www.outdoorowls.com/holiday-camps-richmond",
    bookingUrl: "https://www.outdoorowls.com/holiday-camps-richmond",
    description:
      "Forest school holiday camp for ages 4–7. Drop-off near Richmond Bridge; minibus to Cobham nature site included.",
    isIndoor: false,
    isOutdoor: true,
    overrides: {
      startDate: "2026-07-27",
      endDate: "2026-08-28",
      dailyStartTime: "08:00",
      dailyEndTime: "17:30",
      dailyRate: 86,
      priceNote: "£86 per day (8am–5:30pm); minibus to Cobham included",
    },
  },
  {
    providerSlug: "prov_camp_beaumont",
    name: "Camp Beaumont Richmond - Unicorn School",
    locationName: "Unicorn School Richmond",
    address: "Unicorn School, 238 Kew Road, Richmond, TW9 3JX",
    postcode: "TW9 3JX",
    latitude: 51.4766,
    longitude: -0.2908,
    activities: ["multi-activity", "sports", "arts and crafts", "drama"],
    ageMin: 3,
    ageMax: 14,
    scrapeUrl: "https://www.campbeaumont.co.uk/our-camps/unicorn-school",
    isIndoor: true,
    isOutdoor: true,
    overrides: {
      startDate: "2026-07-20",
      endDate: "2026-08-28",
      dailyStartTime: "08:30",
      dailyEndTime: "17:30",
      dailyRate: 55,
      priceNote: "£55 per day; extended hours from £6 per half day",
    },
  },
  {
    providerSlug: "prov_camp_beaumont",
    name: "Camp Beaumont Esher - Claremont Fan Court",
    locationName: "Claremont Fan Court School",
    address: "Claremont Fan Court School, Portsmouth Road, Esher, KT10 9HZ",
    postcode: "KT10 9HZ",
    latitude: 51.3593,
    longitude: -0.3746,
    activities: ["multi-activity", "sports", "arts and crafts", "swimming"],
    ageMin: 3,
    ageMax: 14,
    scrapeUrl: "https://www.campbeaumont.co.uk/our-camps/claremont-fan-court-school",
    isIndoor: true,
    isOutdoor: true,
    overrides: {
      startDate: "2026-07-20",
      endDate: "2026-08-28",
      dailyStartTime: "08:30",
      dailyEndTime: "17:30",
      dailyRate: 55,
      priceNote: "£55 per day; extended hours from £6 per half day",
    },
  },
  {
    providerSlug: "prov_camp_beaumont",
    name: "Camp Beaumont Tadworth - Chinthurst School",
    locationName: "Chinthurst School Tadworth",
    address: "Chinthurst School, 52 Tadworth Street, Tadworth, KT20 5QZ",
    postcode: "KT20 5QZ",
    latitude: 51.2872,
    longitude: -0.2388,
    activities: ["multi-activity", "sports", "arts and crafts"],
    ageMin: 3,
    ageMax: 14,
    scrapeUrl: "https://www.campbeaumont.co.uk/our-camps/chinthurst-school",
    isIndoor: true,
    isOutdoor: true,
    overrides: {
      startDate: "2026-07-20",
      endDate: "2026-08-28",
      dailyStartTime: "08:30",
      dailyEndTime: "17:30",
      dailyRate: 55,
      priceNote: "£55 per day; extended hours from £6 per half day",
    },
  },
  {
    providerSlug: "prov_camp_beaumont",
    name: "Camp Beaumont Oxshott - Danes Hill School",
    locationName: "Danes Hill School Oxshott",
    address: "Danes Hill School, Leatherhead Road, Oxshott, KT22 0JG",
    postcode: "KT22 0JG",
    latitude: 51.3289,
    longitude: -0.3597,
    activities: ["multi-activity", "sports", "arts and crafts"],
    ageMin: 3,
    ageMax: 14,
    scrapeUrl: "https://www.campbeaumont.co.uk/our-camps/danes-hill-school",
    isIndoor: true,
    isOutdoor: true,
    overrides: {
      startDate: "2026-07-20",
      endDate: "2026-08-28",
      dailyStartTime: "08:30",
      dailyEndTime: "17:30",
      dailyRate: 55,
      priceNote: "£55 per day; extended hours from £6 per half day",
    },
  },
  {
    providerSlug: "prov_brilliant_play",
    name: "Marble Hill Adventure Playground Holiday Camp",
    locationName: "Marble Hill Playcentres",
    address: "Marble Hill Playcentres, Twickenham, TW1 2NL",
    postcode: "TW1 2NL",
    latitude: 51.451,
    longitude: -0.316,
    activities: ["adventure playground", "outdoor play", "multi-activity"],
    ageMin: 5,
    ageMax: 16,
    scrapeUrl: "https://brilliantplay.co.uk/fuel-holiday-camps/",
    bookingUrl: "https://brilliantplay.co.uk/fuel-holiday-camps/",
    description:
      "FUEL and paid holiday adventure camps at Marble Hill Playcentres, Twickenham. Free FUEL places for eligible families.",
    isIndoor: false,
    isOutdoor: true,
    overrides: {
      startDate: "2026-07-27",
      endDate: "2026-08-21",
      dailyStartTime: "10:30",
      dailyEndTime: "14:30",
      priceNote: "FUEL free places for eligible families; paid camps also available",
    },
  },
  {
    providerSlug: "prov_koosa",
    name: "KOOSA Kids Hampton Holiday Club",
    locationName: "St Mary's Hampton Primary School",
    address: "St Mary's Hampton Primary School, Oldfield Road, Hampton, TW12 2HP",
    postcode: "TW12 2HP",
    latitude: 51.4151,
    longitude: -0.376,
    activities: ["multi-activity", "sports", "arts and crafts", "themed days"],
    ageMin: 4,
    ageMax: 13,
    scrapeUrl:
      "https://www.koosakids.co.uk/greater-london/hampton/st-marys-hampton-primary-school-hampton/holiday-club",
    overrides: {
      startDate: "2026-07-20",
      endDate: "2026-08-28",
      dailyStartTime: "10:00",
      dailyEndTime: "16:00",
      dailyRate: 31.5,
      priceNote: "From £31.50 standard day (10am–4pm); extended 8:15am–6pm available",
    },
  },
  {
    providerSlug: "prov_koosa",
    name: "KOOSA Kids Whitton Holiday Club",
    locationName: "Whitton Sports Centre",
    address: "Whitton Sports Centre, Percy Road, Whitton, TW2 6JW",
    postcode: "TW2 6JW",
    latitude: 51.448,
    longitude: -0.358,
    activities: ["multi-activity", "sports", "arts and crafts", "themed days"],
    ageMin: 4,
    ageMax: 13,
    scrapeUrl:
      "https://www.koosakids.co.uk/greater-london/whitton/whitton-sports-centre-whitton/holiday-club",
    overrides: {
      startDate: "2026-07-20",
      endDate: "2026-08-28",
      dailyStartTime: "10:00",
      dailyEndTime: "16:00",
      dailyRate: 31.5,
      priceNote: "From £31.50 standard day; third sibling goes free",
    },
  },
  {
    providerSlug: "prov_ultimate",
    name: "Fulham Ultimate Activity Camp",
    locationName: "Fulham Cross Girls' School",
    address: "Fulham Cross Girls' School, Munster Road, Fulham, SW6 6BP",
    postcode: "SW6 6BP",
    latitude: 51.4814,
    longitude: -0.2142,
    activities: ["multi-activity", "sports", "arts and crafts", "cookery"],
    ageMin: 4,
    ageMax: 14,
    scrapeUrl: "https://www.ultimateactivity.co.uk/locations/fulham-cross-girls-school",
    isIndoor: true,
    isOutdoor: true,
    overrides: {
      startDate: "2026-07-20",
      endDate: "2026-08-21",
      dailyStartTime: "08:30",
      dailyEndTime: "17:15",
      dailyRate: 58,
      priceNote: "From £58 per day; Ultimate Cookery 10–20 Aug; extended hours +£9.30/day",
    },
  },
];

/** Draft clubs to enrich via their booking/source URLs */
const DRAFT_ENRICHMENT: Array<{
  matchName: string;
  scrapeUrl?: string;
  overrides?: Partial<ScrapedClubData>;
}> = [
  {
    matchName: "The Strings Club Kingston Holiday Camp",
    scrapeUrl: "https://www.thestringsclub.org/pages/kingston-upon-thames-holiday-camp",
    overrides: {
      startDate: "2026-07-20",
      endDate: "2026-08-28",
      dailyStartTime: "09:30",
      dailyEndTime: "16:00",
      priceNote: "From £61.50 standard day (9:30-16:00); £71.50 extended (8:00-17:30)",
      dailyRate: 61.5,
    },
  },
  {
    matchName: "The Science of Sound Kingston STEM Camp",
    scrapeUrl: "https://www.scienceofsound.co.uk/the-tiffin-girls-school",
    overrides: {
      startDate: "2026-07-20",
      endDate: "2026-08-28",
      dailyStartTime: "09:00",
      dailyEndTime: "15:00",
      priceNote: "Early bird pricing available; select dates at checkout",
    },
  },
  {
    matchName: "Supersharks Holiday Crash Courses",
    scrapeUrl: "https://www.supersharksswimschool.co.uk/swimming-lessons/crash-courses/",
    overrides: {
      priceNote: "Intensive swim crash courses; contact for 2026 schedule and daily rates",
    },
  },
  {
    matchName: "Stagecoach New Malden Holiday Workshop",
    scrapeUrl: "https://www.stagecoach.co.uk/newmalden",
    overrides: {
      priceNote: "Holiday workshops run during school holidays; contact for 2026 dates and fees",
    },
  },
  {
    matchName: "Stagecoach Kingston and Surbiton Holiday Workshop",
    scrapeUrl: "https://www.stagecoach.co.uk/kingstonandsurbiton",
    overrides: {
      priceNote: "Holiday workshops run during school holidays; contact for 2026 dates and fees",
    },
  },
  {
    matchName: "Rose Theatre Play in a Week 2026",
    scrapeUrl: "https://www.rosetheatre.org/play-in-a-week-2026-tj3c",
    overrides: {
      startDate: "2026-07-27",
      endDate: "2026-08-29",
      dailyStartTime: "09:30",
      dailyEndTime: "16:30",
      priceNote: "£325 per week (Mon-Sat, 9:30am-4:30pm); sibling discount 25% on second course",
    },
  },
  {
    matchName: "Rose Theatre Create in Three Days 2026",
    scrapeUrl: "https://www.rosetheatre.org/create-in-three-days-2026-cyw1",
    overrides: {
      startDate: "2026-07-29",
      endDate: "2026-08-14",
      dailyStartTime: "10:00",
      dailyEndTime: "16:00",
      priceNote: "£200 per 3-day course (Wed-Fri, 10am-4pm); weeks 29-31 Jul, 5-7 Aug, 12-14 Aug",
    },
  },
  {
    matchName: "Love the Ball Holiday Camp",
    scrapeUrl: "https://lovetheball.com/courses/holidaycamps.html",
  },
  {
    matchName: "Planet Warriors Kids Club Thames Ditton",
    scrapeUrl: "https://www.planetwarriorskidsclub.co.uk/",
  },
  {
    matchName: "Let's Sew Club Surbiton Camp",
    scrapeUrl: "https://letssewclub.com/",
    overrides: {
      dailyStartTime: "10:00",
      dailyEndTime: "16:00",
    },
  },
  {
    matchName: "Beyond Blocks Lego Robotics Surbiton",
    scrapeUrl: "https://www.beyondblocks.co.uk/",
  },
  {
    matchName: "BG Coaching Kingston Football Camp",
    scrapeUrl: "https://www.bgcoaching.co.uk/",
  },
  {
    matchName: "Barnfield Riding School Pony Days",
    scrapeUrl: "https://www.barnfieldridingschool.org/for-kids",
    overrides: {
      priceNote: "Pony days and riding camps; contact for 2026 dates and pricing",
    },
  },
  {
    matchName: "Chess Club Kingston Holiday Camp",
    scrapeUrl: "https://www.chessclubkingston.co.uk/",
    overrides: {
      priceNote: "Chess holiday camps at Holy Cross Prep; contact for 2026 schedule",
    },
  },
  {
    matchName: "Magic Moments Holiday Camp New Malden",
    scrapeUrl: "https://magicmomentschildcaregroup.co.uk/",
  },
  {
    matchName: "Camp Hogwarts New Malden",
    scrapeUrl: "https://www.quidditchformuggles.co.uk/",
    overrides: {
      priceNote: "Theatre and Harry Potter themed camp; contact for 2026 dates",
    },
  },
  {
    matchName: "Playball Camp Tiffin Girls' School",
    scrapeUrl: "https://www.playball.co.uk/",
  },
  {
    matchName: "South Side Theatre Academy Holiday Camp",
    scrapeUrl: "https://www.southsidetheatre.com/",
  },
  {
    matchName: "Junior Golf Academy London Kingston Camp",
    scrapeUrl: "https://juniorgolflondon.co.uk/",
  },
  {
    matchName: "Teddy Tennis Hawker Centre Camp",
    scrapeUrl: "https://www.teddytennis.com/",
  },
];

function mergeScraped(
  base: ScrapedClubData,
  scraped: ScrapedClubData | null,
  overrides?: Partial<ScrapedClubData>,
): ScrapedClubData {
  return {
    ...base,
    ...(scraped ?? {}),
    ...(overrides ?? {}),
    activities: overrides?.activities ?? scraped?.activities ?? base.activities,
  };
}

function toDate(value?: string | null): Date | null {
  if (!value) return null;
  const d = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

async function sleep(ms: number) {
  await new Promise((r) => setTimeout(r, ms));
}

async function main() {
  const prisma = createPrismaClient(
    process.env.DIRECT_URL ?? process.env.DATABASE_URL,
  );

  const stats = {
    providersCreated: 0,
    providersUpdated: 0,
    clubsCreated: 0,
    clubsUpdated: 0,
    clubsPublished: 0,
    clubsDraft: 0,
    skippedOutsideRadius: 0,
    enrichmentUpdates: 0,
  };

  try {
    console.log(`\n=== ClubZer scrape & import (${MAX_RADIUS_KM}km from New Malden) ===`);
    if (DRY_RUN) console.log("DRY RUN — no database writes\n");

    const providerIdBySlug = new Map<string, string>();

    const existingProviders = await prisma.provider.findMany();
    for (const p of existingProviders) {
      if (p.slug) providerIdBySlug.set(p.slug, p.id);
    }

    for (const seed of PROVIDER_SEEDS) {
      const existing = existingProviders.find((p) => p.slug === seed.slug);
      if (existing) {
        providerIdBySlug.set(seed.slug, existing.id);
        if (!DRY_RUN) {
          await prisma.provider.update({
            where: { id: existing.id },
            data: {
              name: seed.name,
              website: seed.website,
              sourceUrl: seed.sourceUrl ?? seed.website,
            },
          });
        }
        stats.providersUpdated++;
      } else if (!DRY_RUN) {
        const created = await prisma.provider.create({
          data: {
            slug: seed.slug,
            name: seed.name,
            website: seed.website,
            sourceUrl: seed.sourceUrl ?? seed.website,
          },
        });
        providerIdBySlug.set(seed.slug, created.id);
        stats.providersCreated++;
      } else {
        stats.providersCreated++;
      }
    }

    for (const seed of CLUB_SEEDS) {
      const providerId = providerIdBySlug.get(seed.providerSlug);
      if (!providerId && !DRY_RUN) {
        console.warn(`  Skip ${seed.name}: provider ${seed.providerSlug} missing`);
        continue;
      }

      const geocoded = await geocodePostcode(seed.postcode);
      const coords =
        geocoded ??
        (seed.latitude != null && seed.longitude != null
          ? { lat: seed.latitude, lon: seed.longitude }
          : null);
      if (!coords) {
        console.warn(`  Skip ${seed.name}: could not geocode ${seed.postcode}`);
        continue;
      }

      if (!isWithinRadius(coords.lat, coords.lon)) {
        const dist = distanceFromNewMaldenKm(coords.lat, coords.lon);
        console.log(`  Skip ${seed.name}: ${dist.toFixed(1)}km (outside ${MAX_RADIUS_KM}km)`);
        stats.skippedOutsideRadius++;
        continue;
      }

      console.log(`  Scraping ${seed.name}...`);
      await sleep(400);
      const scraped = await scrapeClubPage(seed.scrapeUrl, seed.activities);
      const merged = mergeScraped(
        {
          bookingUrl: seed.bookingUrl ?? seed.scrapeUrl,
          activities: seed.activities,
        },
        scraped,
        seed.overrides,
      );

      const parsed = parseClubPrice(merged.priceNote);
      const startDate = toDate(merged.startDate);
      const endDate = toDate(merged.endDate);

      const publish = decideClubPublishStatus({
        name: seed.name,
        locationName: seed.locationName,
        latitude: coords.lat,
        longitude: coords.lon,
        activities: merged.activities ?? seed.activities,
        ageMin: merged.ageMin ?? seed.ageMin,
        ageMax: merged.ageMax ?? seed.ageMax,
        startDate,
        endDate,
        bookingUrl: merged.bookingUrl ?? seed.scrapeUrl,
        price: parsed.price,
        dailyRate: merged.dailyRate ?? parsed.dailyRate,
        priceNote: merged.priceNote ?? parsed.priceNote,
        dataConfidence: null,
      });

      if (publish.status === "ACTIVE") stats.clubsPublished++;
      else stats.clubsDraft++;

      const clubData = {
        providerId: providerId!,
        name: seed.name,
        description: merged.description ?? seed.description ?? null,
        locationName: seed.locationName,
        address: merged.address ?? seed.address,
        latitude: coords.lat,
        longitude: coords.lon,
        activities: merged.activities ?? seed.activities,
        ageMin: merged.ageMin ?? seed.ageMin,
        ageMax: merged.ageMax ?? seed.ageMax,
        startDate,
        endDate,
        dailyStartTime: merged.dailyStartTime ?? null,
        dailyEndTime: merged.dailyEndTime ?? null,
        price: parsed.price,
        dailyRate: merged.dailyRate ?? parsed.dailyRate,
        priceNote: merged.priceNote ?? parsed.priceNote,
        bookingUrl: merged.bookingUrl ?? seed.scrapeUrl,
        imageUrl: merged.imageUrl ?? null,
        sourceUrl: seed.scrapeUrl,
        dataConfidence: publish.dataConfidence,
        status: publish.status as ClubStatus,
        promotionStatus: ClubPromotionStatus.OFFICIAL,
        isIndoor: seed.isIndoor ?? false,
        isOutdoor: seed.isOutdoor ?? true,
      };

      if (DRY_RUN) {
        console.log(
          `    → ${publish.status} (${publish.missing.join(", ") || "all criteria met"})`,
        );
        continue;
      }

      const existing = await prisma.club.findFirst({
        where: {
          providerId: providerId!,
          name: seed.name,
        },
      });

      if (existing) {
        await prisma.club.update({ where: { id: existing.id }, data: clubData });
        stats.clubsUpdated++;
      } else {
        await prisma.club.create({ data: clubData });
        stats.clubsCreated++;
      }
    }

    console.log("\n=== Enriching draft clubs ===");
    for (const item of DRAFT_ENRICHMENT) {
      const club = await prisma.club.findFirst({
        where: { name: item.matchName, status: ClubStatus.DRAFT },
      });
      if (!club) continue;

      console.log(`  Enriching ${club.name}...`);
      await sleep(400);
      const url = item.scrapeUrl ?? club.bookingUrl ?? club.sourceUrl;
      const scraped = url ? await scrapeClubPage(url, club.activities) : null;
      const merged = mergeScraped({}, scraped, item.overrides);

      const parsed = parseClubPrice(merged.priceNote ?? club.priceNote);
      const startDate = toDate(merged.startDate) ?? club.startDate;
      const endDate = toDate(merged.endDate) ?? club.endDate;

      const publish = decideClubPublishStatus({
        name: club.name,
        locationName: club.locationName,
        latitude: club.latitude,
        longitude: club.longitude,
        activities: club.activities,
        ageMin: club.ageMin,
        ageMax: club.ageMax,
        startDate,
        endDate,
        bookingUrl: club.bookingUrl,
        price: parsed.price ?? club.price,
        dailyRate: merged.dailyRate ?? parsed.dailyRate ?? club.dailyRate,
        priceNote: merged.priceNote ?? parsed.priceNote ?? club.priceNote,
        dataConfidence: club.dataConfidence,
      });

      if (DRY_RUN) {
        console.log(
          `    → would set ${publish.status} (missing: ${publish.missing.join(", ") || "none"})`,
        );
        continue;
      }

      await prisma.club.update({
        where: { id: club.id },
        data: {
          startDate,
          endDate,
          dailyStartTime: merged.dailyStartTime ?? club.dailyStartTime,
          dailyEndTime: merged.dailyEndTime ?? club.dailyEndTime,
          price: parsed.price ?? club.price,
          dailyRate: merged.dailyRate ?? parsed.dailyRate ?? club.dailyRate,
          priceNote: merged.priceNote ?? parsed.priceNote ?? club.priceNote,
          imageUrl: merged.imageUrl ?? club.imageUrl,
          description: merged.description ?? club.description,
          dataConfidence: publish.dataConfidence,
          status: publish.status,
        },
      });
      stats.enrichmentUpdates++;
      if (publish.status === "ACTIVE") stats.clubsPublished++;
    }

    const [total, active, draft] = await Promise.all([
      prisma.club.count(),
      prisma.club.count({ where: { status: ClubStatus.ACTIVE } }),
      prisma.club.count({ where: { status: ClubStatus.DRAFT } }),
    ]);

    const maxDistClub = await prisma.club.findMany({
      select: { name: true, latitude: true, longitude: true, status: true },
    });
    let maxDist = 0;
    let maxDistName = "";
    for (const c of maxDistClub) {
      const d = distanceFromNewMaldenKm(c.latitude, c.longitude);
      if (d > maxDist) {
        maxDist = d;
        maxDistName = c.name;
      }
    }

    console.log("\n=== Summary ===");
    console.log(JSON.stringify(stats, null, 2));
    console.log(`\nDB totals: ${total} clubs (${active} published, ${draft} draft)`);
    console.log(
      `Max distance from ${NEW_MALDON_ORIGIN.label}: ${maxDist.toFixed(1)}km (${maxDistName})`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
