"use server";

import { z } from "zod";

import { activePublicClubWhere } from "@/lib/clubs/visibility";
import { resolveClubImageUrl } from "@/lib/clubs/resolve-club-image";
import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/server";
import { checkRateLimit, rateLimitKey } from "@/lib/security/rate-limit";
import { clubFilterSchema } from "@/lib/validation/schemas";
import { haversineKm } from "@/lib/utils";
import type { ClubCardData, ClubDetailData } from "@/lib/types/club";

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

function buildClubWhere(
  filters: ReturnType<typeof clubFilterSchema.parse>,
  friendClubIds?: string[],
) {
  const where: {
    status: "ACTIVE";
    OR?: Array<Record<string, unknown>>;
    AND?: Array<Record<string, unknown>>;
    ageMin?: { lte: number };
    ageMax?: { gte: number };
    activities?: { has: string };
    endDate?: { gte: Date };
    startDate?: { lte: Date };
    ratingAverage?: { gte: number };
    isIndoor?: boolean;
    isOutdoor?: boolean;
    id?: { in: string[] };
  } = {
    status: "ACTIVE",
    AND: [
      {
        OR: [
          { promotionStatus: "OFFICIAL" },
          {
            ownerParentProfileId: { not: null },
            promotionStatus: { in: ["LOCAL", "DENIED"] },
          },
        ],
      },
    ],
  };

  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search, mode: "insensitive" } },
      { description: { contains: filters.search, mode: "insensitive" } },
    ];
  }

  if (filters.age != null) {
    where.ageMin = { lte: filters.age };
    where.ageMax = { gte: filters.age };
  }

  if (filters.activity) {
    where.activities = { has: filters.activity };
  }

  if (filters.startDate) {
    where.endDate = { gte: new Date(filters.startDate) };
  }

  if (filters.endDate) {
    where.startDate = { lte: new Date(filters.endDate) };
  }

  if (filters.maxPrice != null) {
    where.AND = [
      ...(Array.isArray(where.AND) ? where.AND : []),
      { OR: [{ price: { lte: filters.maxPrice } }, { price: null }] },
    ];
  }

  if (filters.minRating != null) {
    where.ratingAverage = { gte: filters.minRating };
  }

  if (filters.indoor) {
    where.isIndoor = true;
  }

  if (filters.outdoor) {
    where.isOutdoor = true;
  }

  const hasBounds =
    filters.minLat != null &&
    filters.maxLat != null &&
    filters.minLng != null &&
    filters.maxLng != null;

  if (hasBounds) {
    where.AND = [
      ...(Array.isArray(where.AND) ? where.AND : []),
      {
        latitude: { gte: filters.minLat, lte: filters.maxLat },
        longitude: { gte: filters.minLng, lte: filters.maxLng },
      },
    ];
  }

  if (filters.friendsOnly && friendClubIds) {
    where.id = { in: friendClubIds.length > 0 ? friendClubIds : ["__none__"] };
  }

  return where;
}

function toClubCard(
  club: {
    id: string;
    name: string;
    startDate: Date | null;
    endDate: Date | null;
    price: number | null;
    dailyRate: number | null;
    priceNote: string | null;
    ratingAverage: number;
    ratingCount: number;
    activities: string[];
    imageUrl: string | null;
    bookingUrl: string | null;
    latitude: number;
    longitude: number;
    provider: { name: string };
    ownerParentProfileId?: string | null;
  },
  opts?: {
    distanceKm?: number;
    plannedStatus?: ClubCardData["plannedStatus"];
  },
): ClubCardData {
  return {
    id: club.id,
    name: club.name,
    providerName: club.provider.name,
    isCommunityClub: !!club.ownerParentProfileId,
    startDate: club.startDate,
    endDate: club.endDate,
    price: club.price,
    dailyRate: club.dailyRate,
    priceNote: club.priceNote,
    ratingAverage: club.ratingAverage,
    ratingCount: club.ratingCount,
    activities: club.activities,
    imageUrl: resolveClubImageUrl({ id: club.id, imageUrl: club.imageUrl }),
    bookingUrl: club.bookingUrl,
    distanceKm: opts?.distanceKm ?? null,
    plannedStatus: opts?.plannedStatus ?? null,
    latitude: club.latitude,
    longitude: club.longitude,
  };
}

export async function getClubs(filters: unknown = {}) {
  const user = await requireAuth();
  const profile = user.parentProfile;
  const parsed = clubFilterSchema.parse(filters);

  let friendClubIds: string[] | undefined;
  if (filters && parsed.friendsOnly && profile) {
    const friendIds = await getTrustedFriendIds(profile.id);
    if (friendIds.length > 0) {
      const friendPlanned = await prisma.plannedClub.findMany({
        where: { parentProfileId: { in: friendIds } },
        select: { clubId: true },
        distinct: ["clubId"],
      });
      friendClubIds = friendPlanned.map((p) => p.clubId);
    } else {
      friendClubIds = [];
    }
  }

  const clubs = await prisma.club.findMany({
    where: buildClubWhere(parsed, friendClubIds),
    include: { provider: { select: { name: true } } },
    orderBy: { startDate: "asc" },
  });

  const parentLat = profile?.latitude;
  const parentLng = profile?.longitude;
  const hasBounds =
    parsed.minLat != null &&
    parsed.maxLat != null &&
    parsed.minLng != null &&
    parsed.maxLng != null;
  const maxDistance = hasBounds
    ? null
    : (parsed.maxDistanceKm ?? profile?.defaultSearchRadiusKm ?? null);

  let plannedByClub = new Map<string, ClubCardData["plannedStatus"]>();
  if (profile) {
    const planned = await prisma.plannedClub.findMany({
      where: { parentProfileId: profile.id },
      select: { clubId: true, status: true },
    });
    plannedByClub = new Map(planned.map((p) => [p.clubId, p.status]));
  }

  const results: ClubCardData[] = [];

  for (const club of clubs) {
    let distanceKm: number | undefined;
    if (parentLat != null && parentLng != null) {
      distanceKm = haversineKm(
        parentLat,
        parentLng,
        club.latitude,
        club.longitude,
      );
      if (maxDistance != null && distanceKm > maxDistance) continue;
    }

    results.push(
      toClubCard(club, {
        distanceKm,
        plannedStatus: plannedByClub.get(club.id) ?? null,
      }),
    );
  }

  return results;
}

export async function getClubById(clubId: string): Promise<ClubDetailData | null> {
  const user = await requireAuth();
  const profile = user.parentProfile;

  const club = await prisma.club.findFirst({
    where: {
      id: clubId,
      status: "ACTIVE",
      OR: [
        { promotionStatus: "OFFICIAL" },
        {
          ownerParentProfileId: { not: null },
          promotionStatus: { in: ["LOCAL", "DENIED"] },
        },
      ],
    },
    include: { provider: { select: { name: true } } },
  });

  if (!club) return null;

  let plannedStatus: ClubCardData["plannedStatus"] = null;
  let distanceKm: number | undefined;

  if (profile) {
    const planned = await prisma.plannedClub.findFirst({
      where: { parentProfileId: profile.id, clubId },
      select: { status: true },
    });
    plannedStatus = planned?.status ?? null;

    if (profile.latitude != null && profile.longitude != null) {
      distanceKm = haversineKm(
        profile.latitude,
        profile.longitude,
        club.latitude,
        club.longitude,
      );
    }
  }

  return {
    ...toClubCard(club, { distanceKm, plannedStatus }),
    description: club.description,
    locationName: club.locationName,
    address: club.address,
    latitude: club.latitude,
    longitude: club.longitude,
    ageMin: club.ageMin,
    ageMax: club.ageMax,
    dailyStartTime: club.dailyStartTime,
    dailyEndTime: club.dailyEndTime,
    bookingUrl: club.bookingUrl,
    isIndoor: club.isIndoor,
    isOutdoor: club.isOutdoor,
    sendFriendly: club.sendFriendly,
    accessibilityNotes: club.accessibilityNotes,
  };
}

export async function searchClubs(query: unknown) {
  const user = await requireAuth();
  const profile = user.parentProfile;
  checkRateLimit(rateLimitKey("search-clubs", user.id), {
    limit: 60,
    windowMs: 60 * 1000,
  });

  const { search } = z.object({ search: z.string().max(200) }).parse({ search: query });
  const trimmed = search.trim();
  if (!trimmed) return [];

  const clubs = await prisma.club.findMany({
    where: activePublicClubWhere({
      OR: [
        { name: { contains: trimmed, mode: "insensitive" } },
        { description: { contains: trimmed, mode: "insensitive" } },
        { activities: { has: trimmed } },
      ],
    }),
    include: { provider: { select: { name: true } } },
    orderBy: { name: "asc" },
    take: 20,
  });

  return clubs.map((club) => {
    let distanceKm: number | undefined;
    if (profile?.latitude != null && profile?.longitude != null) {
      distanceKm = haversineKm(
        profile.latitude,
        profile.longitude,
        club.latitude,
        club.longitude,
      );
    }
    return toClubCard(club, { distanceKm });
  });
}
