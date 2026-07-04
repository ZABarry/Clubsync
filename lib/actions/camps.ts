"use server";

import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/server";
import { campFilterSchema } from "@/lib/validation/schemas";
import { haversineKm } from "@/lib/utils";
import type { CampCardData, CampDetailData } from "@/lib/types/camp";

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

function buildCampWhere(
  filters: ReturnType<typeof campFilterSchema.parse>,
  friendCampIds?: string[],
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
  } = { status: "ACTIVE" };

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

  if (filters.friendsOnly && friendCampIds) {
    where.id = { in: friendCampIds.length > 0 ? friendCampIds : ["__none__"] };
  }

  return where;
}

function toCampCard(
  camp: {
    id: string;
    name: string;
    startDate: Date;
    endDate: Date;
    price: number | null;
    ratingAverage: number;
    ratingCount: number;
    activities: string[];
    imageUrl: string | null;
    latitude: number;
    longitude: number;
    provider: { name: string };
  },
  opts?: {
    distanceKm?: number;
    plannedStatus?: CampCardData["plannedStatus"];
  },
): CampCardData {
  return {
    id: camp.id,
    name: camp.name,
    providerName: camp.provider.name,
    startDate: camp.startDate,
    endDate: camp.endDate,
    price: camp.price,
    ratingAverage: camp.ratingAverage,
    ratingCount: camp.ratingCount,
    activities: camp.activities,
    imageUrl: camp.imageUrl,
    distanceKm: opts?.distanceKm ?? null,
    plannedStatus: opts?.plannedStatus ?? null,
    latitude: camp.latitude,
    longitude: camp.longitude,
  };
}

export async function getCamps(filters: unknown = {}) {
  const user = await requireAuth();
  const profile = user.parentProfile;
  const parsed = campFilterSchema.parse(filters);

  let friendCampIds: string[] | undefined;
  if (filters && parsed.friendsOnly && profile) {
    const friendIds = await getTrustedFriendIds(profile.id);
    if (friendIds.length > 0) {
      const friendPlanned = await prisma.plannedCamp.findMany({
        where: { parentProfileId: { in: friendIds } },
        select: { campId: true },
        distinct: ["campId"],
      });
      friendCampIds = friendPlanned.map((p) => p.campId);
    } else {
      friendCampIds = [];
    }
  }

  const camps = await prisma.camp.findMany({
    where: buildCampWhere(parsed, friendCampIds),
    include: { provider: { select: { name: true } } },
    orderBy: { startDate: "asc" },
  });

  const parentLat = profile?.latitude;
  const parentLng = profile?.longitude;
  const maxDistance =
    parsed.maxDistanceKm ?? profile?.defaultSearchRadiusKm ?? null;

  let plannedByCamp = new Map<string, CampCardData["plannedStatus"]>();
  if (profile) {
    const planned = await prisma.plannedCamp.findMany({
      where: { parentProfileId: profile.id },
      select: { campId: true, status: true },
    });
    plannedByCamp = new Map(planned.map((p) => [p.campId, p.status]));
  }

  const results: CampCardData[] = [];

  for (const camp of camps) {
    let distanceKm: number | undefined;
    if (parentLat != null && parentLng != null) {
      distanceKm = haversineKm(
        parentLat,
        parentLng,
        camp.latitude,
        camp.longitude,
      );
      if (maxDistance != null && distanceKm > maxDistance) continue;
    }

    results.push(
      toCampCard(camp, {
        distanceKm,
        plannedStatus: plannedByCamp.get(camp.id) ?? null,
      }),
    );
  }

  return results;
}

export async function getCampById(campId: string): Promise<CampDetailData | null> {
  const user = await requireAuth();
  const profile = user.parentProfile;

  const camp = await prisma.camp.findFirst({
    where: { id: campId, status: "ACTIVE" },
    include: { provider: { select: { name: true } } },
  });

  if (!camp) return null;

  let plannedStatus: CampCardData["plannedStatus"] = null;
  let distanceKm: number | undefined;

  if (profile) {
    const planned = await prisma.plannedCamp.findFirst({
      where: { parentProfileId: profile.id, campId },
      select: { status: true },
    });
    plannedStatus = planned?.status ?? null;

    if (profile.latitude != null && profile.longitude != null) {
      distanceKm = haversineKm(
        profile.latitude,
        profile.longitude,
        camp.latitude,
        camp.longitude,
      );
    }
  }

  return {
    ...toCampCard(camp, { distanceKm, plannedStatus }),
    description: camp.description,
    locationName: camp.locationName,
    address: camp.address,
    latitude: camp.latitude,
    longitude: camp.longitude,
    ageMin: camp.ageMin,
    ageMax: camp.ageMax,
    dailyStartTime: camp.dailyStartTime,
    dailyEndTime: camp.dailyEndTime,
    bookingUrl: camp.bookingUrl,
    isIndoor: camp.isIndoor,
    isOutdoor: camp.isOutdoor,
    sendFriendly: camp.sendFriendly,
    accessibilityNotes: camp.accessibilityNotes,
  };
}

export async function searchCamps(query: string) {
  const user = await requireAuth();
  const profile = user.parentProfile;
  const search = query.trim();
  if (!search) return [];

  const camps = await prisma.camp.findMany({
    where: {
      status: "ACTIVE",
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { activities: { has: search } },
      ],
    },
    include: { provider: { select: { name: true } } },
    orderBy: { name: "asc" },
    take: 20,
  });

  return camps.map((camp) => {
    let distanceKm: number | undefined;
    if (profile?.latitude != null && profile?.longitude != null) {
      distanceKm = haversineKm(
        profile.latitude,
        profile.longitude,
        camp.latitude,
        camp.longitude,
      );
    }
    return toCampCard(camp, { distanceKm });
  });
}
