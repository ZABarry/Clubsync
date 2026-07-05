"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { requireReviewer } from "@/lib/auth/server";
import {
  clubSchema,
  providerSchema,
} from "@/lib/validation/schemas";

type ModerationDecision = "APPROVED" | "REJECTED";

function parseOptionalDate(value?: string) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

async function recalculateClubRating(clubId: string) {
  const ratings = await prisma.rating.findMany({
    where: { clubId, moderationStatus: "APPROVED" },
  });
  const count = ratings.length;
  const avg =
    count > 0
      ? ratings.reduce((sum, r) => sum + r.rating, 0) / count
      : 0;

  await prisma.club.update({
    where: { id: clubId },
    data: { ratingAverage: avg, ratingCount: count },
  });
}

function parseClubFieldValue(
  fieldName: string,
  value: string,
): string | number | boolean | Date | string[] {
  const numericFields = [
    "ageMin",
    "ageMax",
    "price",
    "latitude",
    "longitude",
  ];
  const booleanFields = ["isIndoor", "isOutdoor", "sendFriendly"];
  const dateFields = ["startDate", "endDate"];

  if (numericFields.includes(fieldName)) return Number(value);
  if (booleanFields.includes(fieldName)) return value === "true";
  if (dateFields.includes(fieldName)) return new Date(value);
  if (fieldName === "activities") return value.split(",").map((s) => s.trim());
  return value;
}

// --- Providers ---

export async function createProvider(data: unknown) {
  await requireReviewer();
  const parsed = providerSchema.parse(data);

  const provider = await prisma.provider.create({
    data: {
      name: parsed.name,
      description: parsed.description ?? null,
      website: parsed.website || null,
      contactEmail: parsed.contactEmail || null,
      phone: parsed.phone ?? null,
      logoUrl: parsed.logoUrl || null,
    },
  });

  revalidatePath("/admin");
  return provider;
}

export async function updateProvider(providerId: string, data: unknown) {
  await requireReviewer();
  const parsed = providerSchema.parse(data);

  const provider = await prisma.provider.update({
    where: { id: providerId },
    data: {
      name: parsed.name,
      description: parsed.description ?? null,
      website: parsed.website || null,
      contactEmail: parsed.contactEmail || null,
      phone: parsed.phone ?? null,
      logoUrl: parsed.logoUrl || null,
    },
  });

  revalidatePath("/admin");
  return provider;
}

export async function deleteProvider(providerId: string) {
  await requireReviewer();
  await prisma.provider.delete({ where: { id: providerId } });
  revalidatePath("/admin");
}

export async function getAdminProviders() {
  await requireReviewer();
  return prisma.provider.findMany({
    include: { _count: { select: { clubs: true } } },
    orderBy: { name: "asc" },
  });
}

// --- Clubs ---

export async function createClub(data: unknown) {
  await requireReviewer();
  const parsed = clubSchema.parse(data);

  const provider = await prisma.provider.findUnique({
    where: { id: parsed.providerId },
  });
  if (!provider) throw new Error("Provider not found");

  const club = await prisma.club.create({
    data: {
      providerId: parsed.providerId,
      name: parsed.name,
      description: parsed.description ?? null,
      locationName: parsed.locationName,
      address: parsed.address ?? null,
      latitude: parsed.latitude,
      longitude: parsed.longitude,
      activities: parsed.activities,
      ageMin: parsed.ageMin,
      ageMax: parsed.ageMax,
      startDate: parseOptionalDate(parsed.startDate),
      endDate: parseOptionalDate(parsed.endDate),
      dailyStartTime: parsed.dailyStartTime ?? null,
      dailyEndTime: parsed.dailyEndTime ?? null,
      price: parsed.price ?? null,
      dailyRate: parsed.dailyRate ?? null,
      priceNote: parsed.priceNote ?? null,
      bookingUrl: parsed.bookingUrl || null,
      sourceUrl: parsed.sourceUrl || null,
      dataConfidence: parsed.dataConfidence ?? null,
      region: parsed.region,
      imageUrl: parsed.imageUrl || null,
      status: parsed.status,
      isIndoor: parsed.isIndoor,
      isOutdoor: parsed.isOutdoor,
      sendFriendly: parsed.sendFriendly,
      accessibilityNotes: parsed.accessibilityNotes ?? null,
    },
  });

  revalidatePath("/admin");
  revalidatePath("/discover");
  return club;
}

export async function updateClub(clubId: string, data: unknown) {
  await requireReviewer();
  const parsed = clubSchema.parse(data);

  const club = await prisma.club.update({
    where: { id: clubId },
    data: {
      providerId: parsed.providerId,
      name: parsed.name,
      description: parsed.description ?? null,
      locationName: parsed.locationName,
      address: parsed.address ?? null,
      latitude: parsed.latitude,
      longitude: parsed.longitude,
      activities: parsed.activities,
      ageMin: parsed.ageMin,
      ageMax: parsed.ageMax,
      startDate: parseOptionalDate(parsed.startDate),
      endDate: parseOptionalDate(parsed.endDate),
      dailyStartTime: parsed.dailyStartTime ?? null,
      dailyEndTime: parsed.dailyEndTime ?? null,
      price: parsed.price ?? null,
      dailyRate: parsed.dailyRate ?? null,
      priceNote: parsed.priceNote ?? null,
      bookingUrl: parsed.bookingUrl || null,
      sourceUrl: parsed.sourceUrl || null,
      dataConfidence: parsed.dataConfidence ?? null,
      region: parsed.region,
      imageUrl: parsed.imageUrl || null,
      status: parsed.status,
      isIndoor: parsed.isIndoor,
      isOutdoor: parsed.isOutdoor,
      sendFriendly: parsed.sendFriendly,
      accessibilityNotes: parsed.accessibilityNotes ?? null,
    },
  });

  revalidatePath("/admin");
  revalidatePath("/discover");
  revalidatePath(`/clubs/${clubId}`);
  return club;
}

export async function deleteClub(clubId: string) {
  await requireReviewer();
  await prisma.club.update({
    where: { id: clubId },
    data: { status: "ARCHIVED" },
  });
  revalidatePath("/admin");
  revalidatePath("/discover");
  revalidatePath(`/clubs/${clubId}`);
}

export async function getAdminClubs() {
  await requireReviewer();
  return prisma.club.findMany({
    include: { provider: { select: { name: true } } },
    orderBy: { startDate: "asc" },
  });
}

// --- Change requests & ratings ---

export async function getPendingChangeRequests() {
  await requireReviewer();
  return prisma.clubChangeRequest.findMany({
    where: { moderationStatus: "PENDING" },
    include: {
      club: { select: { id: true, name: true } },
      submittedBy: { select: { displayName: true } },
    },
    orderBy: { createdAt: "asc" },
  });
}

export async function moderateChangeRequest(
  requestId: string,
  status: ModerationDecision,
) {
  await requireReviewer();

  const request = await prisma.clubChangeRequest.findUnique({
    where: { id: requestId },
  });
  if (!request) throw new Error("Change request not found");

  if (status === "APPROVED") {
    const value = parseClubFieldValue(
      request.fieldName,
      request.suggestedValue,
    );
    await prisma.club.update({
      where: { id: request.clubId },
      data: { [request.fieldName]: value },
    });
  }

  const updated = await prisma.clubChangeRequest.update({
    where: { id: requestId },
    data: { moderationStatus: status },
  });

  revalidatePath("/admin");
  revalidatePath(`/clubs/${request.clubId}`);
  revalidatePath("/discover");
  return updated;
}

export async function getPendingRatings() {
  await requireReviewer();
  return prisma.rating.findMany({
    where: { moderationStatus: "PENDING" },
    include: {
      club: { select: { id: true, name: true } },
      parent: { select: { displayName: true } },
    },
    orderBy: { createdAt: "asc" },
  });
}

export async function moderateRating(
  ratingId: string,
  status: ModerationDecision,
) {
  await requireReviewer();

  const rating = await prisma.rating.update({
    where: { id: ratingId },
    data: { moderationStatus: status },
  });

  await recalculateClubRating(rating.clubId);

  revalidatePath("/admin");
  revalidatePath(`/clubs/${rating.clubId}`);
  revalidatePath("/discover");
  return rating;
}
