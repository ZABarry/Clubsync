import { isWithinRadius } from "@/lib/clubs/geo-utils";

const PLACEHOLDER_LOCATIONS = new Set([
  "venue",
  "local theatre",
  "local school",
  "tbc",
  "various",
]);

export type ClubPublishInput = {
  name: string;
  locationName: string;
  latitude: number;
  longitude: number;
  activities: string[];
  ageMin: number;
  ageMax: number;
  startDate: Date | string | null | undefined;
  endDate: Date | string | null | undefined;
  bookingUrl: string | null | undefined;
  price: number | null | undefined;
  dailyRate: number | null | undefined;
  priceNote: string | null | undefined;
  dataConfidence: string | null | undefined;
};

export type PublishDecision = {
  status: "ACTIVE" | "DRAFT";
  dataConfidence: "high" | "medium";
  missing: string[];
};

function hasPrice(input: ClubPublishInput): boolean {
  return (
    input.price != null ||
    input.dailyRate != null ||
    Boolean(input.priceNote?.trim())
  );
}

function hasDates(input: ClubPublishInput): boolean {
  return Boolean(input.startDate && input.endDate);
}

export function decideClubPublishStatus(input: ClubPublishInput): PublishDecision {
  const missing: string[] = [];

  if (!input.name?.trim()) missing.push("name");
  if (!input.locationName?.trim()) missing.push("locationName");
  if (PLACEHOLDER_LOCATIONS.has(input.locationName?.trim().toLowerCase() ?? "")) {
    missing.push("locationName placeholder");
  }
  if (!input.bookingUrl?.trim()) missing.push("bookingUrl");
  if (!input.activities?.length) missing.push("activities");
  if (!hasDates(input)) missing.push("dates");
  if (!hasPrice(input)) missing.push("price");
  if (!isWithinRadius(input.latitude, input.longitude)) missing.push("outside 30km radius");

  const canPublish = missing.length === 0;

  return {
    status: canPublish ? "ACTIVE" : "DRAFT",
    dataConfidence: canPublish ? "high" : "medium",
    missing,
  };
}
