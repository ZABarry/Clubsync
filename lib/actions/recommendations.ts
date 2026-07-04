"use server";

import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/server";
import { smartPlannerSchema } from "@/lib/validation/schemas";
import {
  scoreCamps,
  type RecommendationCamp,
} from "@/lib/recommendations/score-camps";
import { isVisibleToFriends } from "@/lib/privacy/friend-visibility";
import type { CampCardData } from "@/lib/types/camp";

async function getTrustedFriendIds(parentProfileId: string) {
  const connections = await prisma.trustedParentConnection.findMany({
    where: {
      status: "ACCEPTED",
      OR: [
        { requesterParentId: parentProfileId },
        { recipientParentId: parentProfileId },
      ],
    },
  });

  return connections.map((c) =>
    c.requesterParentId === parentProfileId
      ? c.recipientParentId!
      : c.requesterParentId,
  );
}

export async function getRecommendations(input: unknown) {
  const user = await requireAuth();
  const profile = user.parentProfile;
  if (!profile) throw new Error("Parent profile required");
  if (profile.latitude == null || profile.longitude == null) {
    throw new Error("Set your home postcode for recommendations");
  }

  const parsed = smartPlannerSchema.parse(input);

  const child = await prisma.childProfile.findFirst({
    where: { id: parsed.childProfileId, parentProfileId: profile.id },
  });
  if (!child) throw new Error("Child not found");

  const startDate = new Date(parsed.startDate);
  const endDate = new Date(parsed.endDate);

  const camps = await prisma.camp.findMany({
    where: {
      status: "ACTIVE",
      ageMin: { lte: child.age },
      ageMax: { gte: child.age },
      startDate: { lte: endDate },
      endDate: { gte: startDate },
    },
    select: {
      id: true,
      name: true,
      ageMin: true,
      ageMax: true,
      activities: true,
      startDate: true,
      endDate: true,
      latitude: true,
      longitude: true,
      ratingAverage: true,
      ratingCount: true,
      price: true,
    },
  });

  let friendIds = await getTrustedFriendIds(profile.id);
  if (parsed.preferredFriendIds.length > 0) {
    friendIds = friendIds.filter((id) =>
      parsed.preferredFriendIds.includes(id),
    );
  }

  const friendCampCounts = new Map<string, number>();
  if (friendIds.length > 0) {
    const friendPlanned = await prisma.plannedCamp.findMany({
      where: {
        parentProfileId: { in: friendIds },
        campId: { in: camps.map((c) => c.id) },
      },
    });

    for (const planned of friendPlanned) {
      if (!isVisibleToFriends(planned.status)) continue;
      friendCampCounts.set(
        planned.campId,
        (friendCampCounts.get(planned.campId) ?? 0) + 1,
      );
    }
  }

  const interests =
    parsed.interests.length > 0 ? parsed.interests : child.interests;

  return scoreCamps(camps as RecommendationCamp[], {
    child: {
      age: child.age,
      interests,
      availabilityStart: startDate,
      availabilityEnd: endDate,
    },
    parent: {
      lat: profile.latitude,
      lng: profile.longitude,
      radiusKm: parsed.maxDistanceKm,
    },
    trustedFriendPlannedCampIds: friendCampCounts,
    budget: parsed.budget,
  });
}

export async function getDashboardRecommendations(
  limit = 4,
): Promise<CampCardData[]> {
  const user = await requireAuth();
  const profile = user.parentProfile;
  if (!profile?.latitude || !profile?.longitude) return [];

  const child = await prisma.childProfile.findFirst({
    where: { parentProfileId: profile.id },
    orderBy: { createdAt: "asc" },
  });
  if (!child) return [];

  const now = new Date();
  const camps = await prisma.camp.findMany({
    where: {
      status: "ACTIVE",
      endDate: { gte: now },
    },
    include: { provider: { select: { name: true } } },
    orderBy: { startDate: "asc" },
  });

  const friendIds = await getTrustedFriendIds(profile.id);
  const friendCampCounts = new Map<string, number>();

  if (friendIds.length > 0) {
    const friendPlanned = await prisma.plannedCamp.findMany({
      where: {
        parentProfileId: { in: friendIds },
        campId: { in: camps.map((c) => c.id) },
      },
    });

    for (const planned of friendPlanned) {
      if (!isVisibleToFriends(planned.status)) continue;
      friendCampCounts.set(
        planned.campId,
        (friendCampCounts.get(planned.campId) ?? 0) + 1,
      );
    }
  }

  const planned = await prisma.plannedCamp.findMany({
    where: { parentProfileId: profile.id },
    select: { campId: true, status: true },
  });
  const plannedByCamp = new Map(planned.map((p) => [p.campId, p.status]));

  const scored = scoreCamps(
    camps.map((c) => ({
      id: c.id,
      name: c.name,
      ageMin: c.ageMin,
      ageMax: c.ageMax,
      activities: c.activities,
      startDate: c.startDate,
      endDate: c.endDate,
      latitude: c.latitude,
      longitude: c.longitude,
      ratingAverage: c.ratingAverage,
      ratingCount: c.ratingCount,
      price: c.price,
    })),
    {
      child: {
        age: child.age,
        interests: child.interests,
        availabilityStart: child.availabilityStart,
        availabilityEnd: child.availabilityEnd,
      },
      parent: {
        lat: profile.latitude,
        lng: profile.longitude,
        radiusKm: profile.defaultSearchRadiusKm,
      },
      trustedFriendPlannedCampIds: friendCampCounts,
    },
  );

  return scored.slice(0, limit).map((camp) => {
    const source = camps.find((c) => c.id === camp.id)!;
    return {
      id: camp.id,
      name: camp.name,
      providerName: source.provider.name,
      startDate: camp.startDate,
      endDate: camp.endDate,
      price: camp.price,
      ratingAverage: camp.ratingAverage,
      ratingCount: camp.ratingCount,
      activities: camp.activities,
      distanceKm: camp.distanceKm,
      imageUrl: source.imageUrl,
      plannedStatus: plannedByCamp.get(camp.id) ?? null,
      recommendationReasons: camp.recommendationReasons,
    };
  });
}
