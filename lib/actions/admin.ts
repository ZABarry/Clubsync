"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { requireAdmin } from "@/lib/auth/server";
import {
  clubSchema,
  providerSchema,
} from "@/lib/validation/schemas";

type ModerationDecision = "APPROVED" | "REJECTED";

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
  await requireAdmin();
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
  await requireAdmin();
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
  await requireAdmin();
  await prisma.provider.delete({ where: { id: providerId } });
  revalidatePath("/admin");
}

export async function getAdminProviders() {
  await requireAdmin();
  return prisma.provider.findMany({
    include: { _count: { select: { clubs: true } } },
    orderBy: { name: "asc" },
  });
}

// --- Clubs ---

export async function createClub(data: unknown) {
  await requireAdmin();
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
      startDate: new Date(parsed.startDate),
      endDate: new Date(parsed.endDate),
      dailyStartTime: parsed.dailyStartTime ?? null,
      dailyEndTime: parsed.dailyEndTime ?? null,
      price: parsed.price ?? null,
      dailyRate: parsed.dailyRate ?? null,
      bookingUrl: parsed.bookingUrl || null,
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
  await requireAdmin();
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
      startDate: new Date(parsed.startDate),
      endDate: new Date(parsed.endDate),
      dailyStartTime: parsed.dailyStartTime ?? null,
      dailyEndTime: parsed.dailyEndTime ?? null,
      price: parsed.price ?? null,
      dailyRate: parsed.dailyRate ?? null,
      bookingUrl: parsed.bookingUrl || null,
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
  await requireAdmin();
  await prisma.club.update({
    where: { id: clubId },
    data: { status: "ARCHIVED" },
  });
  revalidatePath("/admin");
  revalidatePath("/discover");
  revalidatePath(`/clubs/${clubId}`);
}

export async function getAdminClubs() {
  await requireAdmin();
  return prisma.club.findMany({
    include: { provider: { select: { name: true } } },
    orderBy: { startDate: "asc" },
  });
}

// --- Moderation ---

export async function getPendingSubmissions() {
  await requireAdmin();
  return prisma.clubSubmission.findMany({
    where: { moderationStatus: "PENDING" },
    include: {
      submittedBy: { select: { displayName: true } },
    },
    orderBy: { createdAt: "asc" },
  });
}

const DEFAULT_SUBMISSION_LOCATION = {
  locationName: "South West London",
  latitude: 51.4015,
  longitude: -0.2563,
};

async function findOrCreateSubmissionProvider(providerName: string | null) {
  const name = providerName?.trim() || "Community submission";
  const existing = await prisma.provider.findFirst({
    where: { name: { equals: name, mode: "insensitive" } },
  });
  if (existing) return existing;

  return prisma.provider.create({
    data: {
      name,
      description: "Created from a parent club submission",
    },
  });
}

export async function moderateSubmission(
  submissionId: string,
  status: ModerationDecision,
) {
  await requireAdmin();

  const submission = await prisma.clubSubmission.findUnique({
    where: { id: submissionId },
  });
  if (!submission) throw new Error("Submission not found");

  if (status === "APPROVED") {
    const provider = await findOrCreateSubmissionProvider(
      submission.providerName,
    );

    await prisma.club.create({
      data: {
        providerId: provider.id,
        name: submission.clubName,
        description: submission.notes,
        bookingUrl: submission.website,
        status: "DRAFT",
        activities: [],
        ageMin: 4,
        ageMax: 16,
        startDate: new Date("2026-07-01"),
        endDate: new Date("2026-08-31"),
        ...DEFAULT_SUBMISSION_LOCATION,
      },
    });
  }

  const updated = await prisma.clubSubmission.update({
    where: { id: submissionId },
    data: { moderationStatus: status },
  });

  revalidatePath("/admin");
  revalidatePath("/admin/submissions");
  revalidatePath("/discover");
  return updated;
}

export async function getPendingChangeRequests() {
  await requireAdmin();
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
  await requireAdmin();

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
  await requireAdmin();
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
  await requireAdmin();

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
