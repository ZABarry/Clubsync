"use server";

import { resolveClubImageUrl } from "@/lib/clubs/resolve-club-image";

import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/server";
import {
  dashboardRecommendationsSchema,
  smartPlannerSchema,
} from "@/lib/validation/schemas";
import {
  scoreClubs,
  type RecommendationClub,
} from "@/lib/recommendations/score-clubs";
import { isVisibleToFriends } from "@/lib/privacy/friend-visibility";
import type { ClubCardData } from "@/lib/types/club";
import { getClubs } from "@/lib/actions/clubs";
import { activePublicClubWhere } from "@/lib/clubs/visibility";

export type DashboardRecommendationsResult = {
  clubs: ClubCardData[];
  offset: number;
  hasMore: boolean;
  total: number;
};

function paginateRecommendations(
  clubs: ClubCardData[],
  limit: number,
  offset: number,
): DashboardRecommendationsResult {
  const total = clubs.length;
  if (total === 0) {
    return { clubs: [], offset: 0, hasMore: false, total: 0 };
  }

  const effectiveOffset = offset >= total ? 0 : offset;
  const page = clubs.slice(effectiveOffset, effectiveOffset + limit);

  return {
    clubs: page,
    offset: effectiveOffset,
    hasMore: effectiveOffset + limit < total,
    total,
  };
}

async function getFallbackRecommendations(
  limit: number,
  offset: number,
): Promise<DashboardRecommendationsResult> {
  const allClubs = await getClubs();
  const sorted = [...allClubs].sort(
    (a, b) => (b.ratingAverage ?? 0) - (a.ratingAverage ?? 0),
  );
  return paginateRecommendations(sorted, limit, offset);
}

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

  const clubs = await prisma.club.findMany({
    where: activePublicClubWhere({
      ageMin: { lte: child.age },
      ageMax: { gte: child.age },
      startDate: { lte: endDate },
      endDate: { gte: startDate },
    }),
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

  const friendClubCounts = new Map<string, number>();
  if (friendIds.length > 0) {
    const friendPlanned = await prisma.plannedClub.findMany({
      where: {
        parentProfileId: { in: friendIds },
        clubId: { in: clubs.map((c) => c.id) },
      },
    });

    for (const planned of friendPlanned) {
      if (!isVisibleToFriends(planned.status)) continue;
      friendClubCounts.set(
        planned.clubId,
        (friendClubCounts.get(planned.clubId) ?? 0) + 1,
      );
    }
  }

  const interests =
    parsed.interests.length > 0 ? parsed.interests : child.interests;

  return scoreClubs(clubs as RecommendationClub[], {
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
    trustedFriendPlannedClubIds: friendClubCounts,
    budget: parsed.budget,
  });
}

export async function getDashboardRecommendations(
  rawOptions: unknown = {},
): Promise<DashboardRecommendationsResult> {
  const { limit, offset } = dashboardRecommendationsSchema.parse(rawOptions);

  const user = await requireAuth();
  const profile = user.parentProfile;
  if (!profile?.latitude || !profile?.longitude) {
    return getFallbackRecommendations(limit, offset);
  }

  const child = await prisma.childProfile.findFirst({
    where: { parentProfileId: profile.id },
    orderBy: { createdAt: "asc" },
  });
  if (!child) {
    return getFallbackRecommendations(limit, offset);
  }

  const now = new Date();
  const clubs = await prisma.club.findMany({
    where: activePublicClubWhere({
      endDate: { gte: now },
    }),
    include: { provider: { select: { name: true } } },
    orderBy: { startDate: "asc" },
  });

  if (clubs.length === 0) {
    return getFallbackRecommendations(limit, offset);
  }

  const friendIds = await getTrustedFriendIds(profile.id);
  const friendClubCounts = new Map<string, number>();

  if (friendIds.length > 0) {
    const friendPlanned = await prisma.plannedClub.findMany({
      where: {
        parentProfileId: { in: friendIds },
        clubId: { in: clubs.map((c) => c.id) },
      },
    });

    for (const planned of friendPlanned) {
      if (!isVisibleToFriends(planned.status)) continue;
      friendClubCounts.set(
        planned.clubId,
        (friendClubCounts.get(planned.clubId) ?? 0) + 1,
      );
    }
  }

  const planned = await prisma.plannedClub.findMany({
    where: { parentProfileId: profile.id },
    select: { clubId: true, status: true },
  });
  const plannedByClub = new Map(planned.map((p) => [p.clubId, p.status]));

  const scored = scoreClubs(
    clubs.map((c) => ({
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
      trustedFriendPlannedClubIds: friendClubCounts,
    },
  );

  const ranked: ClubCardData[] = scored.map((club) => {
    const source = clubs.find((c) => c.id === club.id)!;
    return {
      id: club.id,
      name: club.name,
      providerName: source.provider.name,
      startDate: club.startDate,
      endDate: club.endDate,
      price: club.price,
      ratingAverage: club.ratingAverage,
      ratingCount: club.ratingCount,
      activities: club.activities,
      distanceKm: club.distanceKm,
      imageUrl: resolveClubImageUrl({ id: club.id, imageUrl: source.imageUrl }),
      bookingUrl: source.bookingUrl,
      plannedStatus: plannedByClub.get(club.id) ?? null,
      recommendationReasons: club.recommendationReasons,
    };
  });

  return paginateRecommendations(ranked, limit, offset);
}
