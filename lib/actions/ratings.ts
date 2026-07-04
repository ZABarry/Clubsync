"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/server";
import { ratingSchema } from "@/lib/validation/schemas";

async function requireParentProfileId() {
  const user = await requireAuth();
  const profile = user.parentProfile;
  if (!profile) throw new Error("Parent profile required");
  return profile;
}

export async function submitRating(data: unknown) {
  const profile = await requireParentProfileId();
  const parsed = ratingSchema.parse(data);

  const camp = await prisma.camp.findFirst({
    where: { id: parsed.campId, status: "ACTIVE" },
  });
  if (!camp) throw new Error("Camp not found");

  const rating = await prisma.rating.upsert({
    where: {
      campId_parentProfileId: {
        campId: parsed.campId,
        parentProfileId: profile.id,
      },
    },
    create: {
      campId: parsed.campId,
      parentProfileId: profile.id,
      rating: parsed.rating,
      reviewText: parsed.reviewText ?? null,
      moderationStatus: "PENDING",
    },
    update: {
      rating: parsed.rating,
      reviewText: parsed.reviewText ?? null,
      moderationStatus: "PENDING",
    },
    include: {
      parent: { select: { displayName: true } },
    },
  });

  revalidatePath(`/camps/${parsed.campId}`);
  revalidatePath("/admin");
  return rating;
}

export async function getRatingsForCamp(campId: string) {
  const user = await requireAuth();
  const profile = user.parentProfile;

  const ratings = await prisma.rating.findMany({
    where: {
      campId,
      OR: [
        { moderationStatus: "APPROVED" },
        ...(profile
          ? [{ parentProfileId: profile.id, moderationStatus: "PENDING" as const }]
          : []),
      ],
    },
    include: {
      parent: { select: { displayName: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return ratings;
}
