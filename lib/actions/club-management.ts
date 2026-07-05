"use server";

import { revalidatePath } from "next/cache";
import {
  ClubPromotionStatus,
  ClubStatus,
  NotificationType,
  UserRole,
} from "@prisma/client";

import {
  canManageClub,
  requireAuth,
  requireMasterAdmin,
  requireReviewer,
} from "@/lib/auth/server";
import { isReviewerRole } from "@/lib/auth/roles";
import { resolveClubImageUrl } from "@/lib/clubs/resolve-club-image";
import { prisma } from "@/lib/db/prisma";
import {
  createNotification,
  notifyReviewers,
} from "@/lib/actions/notifications";
import {
  adminUserFilterSchema,
  clubManagementFilterSchema,
  clubReviewSchema,
  clubSchema,
  clubSubmitForReviewSchema,
  promoteUserRoleSchema,
} from "@/lib/validation/schemas";
import { haversineKm } from "@/lib/utils";

export type ManagedClubListItem = {
  id: string;
  name: string;
  locationName: string;
  status: ClubStatus;
  promotionStatus: ClubPromotionStatus;
  imageUrl: string;
  providerName: string;
  ownerDisplayName: string | null;
  latitude: number;
  longitude: number;
  distanceKm: number | null;
  updatedAt: Date;
};

function parseOptionalDate(value?: string) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function clubDataFromParsed(
  parsed: ReturnType<typeof clubSchema.parse>,
  extras?: {
    ownerParentProfileId?: string | null;
    promotionStatus?: ClubPromotionStatus;
  },
) {
  return {
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
    imageUrl: parsed.imageUrl || null,
    sourceUrl: parsed.sourceUrl || null,
    dataConfidence: parsed.dataConfidence ?? null,
    region: parsed.region,
    status: parsed.status,
    isIndoor: parsed.isIndoor,
    isOutdoor: parsed.isOutdoor,
    sendFriendly: parsed.sendFriendly,
    accessibilityNotes: parsed.accessibilityNotes ?? null,
    ownerParentProfileId: extras?.ownerParentProfileId ?? null,
    promotionStatus: extras?.promotionStatus ?? ClubPromotionStatus.OFFICIAL,
  };
}

function revalidateClubPaths(clubId?: string) {
  revalidatePath("/admin");
  revalidatePath("/admin/clubs");
  revalidatePath("/admin/reviews");
  revalidatePath("/my-clubs");
  revalidatePath("/discover");
  if (clubId) revalidatePath(`/clubs/${clubId}`);
}

async function requireParentProfileId() {
  const user = await requireAuth();
  const profile = user.parentProfile;
  if (!profile) throw new Error("Parent profile required");
  return { user, profile };
}

async function getCommunityProvider() {
  const name = "Community submission";
  const existing = await prisma.provider.findFirst({
    where: { name: { equals: name, mode: "insensitive" } },
  });
  if (existing) return existing;
  return prisma.provider.create({
    data: {
      name,
      description: "Community-contributed clubs",
    },
  });
}

export async function getManagedClubs(
  rawFilters: unknown,
  mode: "admin" | "personal",
) {
  const filters = clubManagementFilterSchema.parse(rawFilters ?? {});

  if (mode === "admin") {
    await requireReviewer();
    return listClubs(filters, null, mode);
  }

  const { profile } = await requireParentProfileId();
  return listClubs(filters, profile.id, mode);
}

async function listClubs(
  filters: ReturnType<typeof clubManagementFilterSchema.parse>,
  ownerParentProfileId: string | null,
  mode: "admin" | "personal",
) {
  const where: {
    ownerParentProfileId?: string | null;
    status?: ClubStatus;
    promotionStatus?: ClubPromotionStatus;
    region?: typeof filters.region;
    OR?: Array<Record<string, unknown>>;
  } = {};

  if (mode === "personal" && ownerParentProfileId) {
    where.ownerParentProfileId = ownerParentProfileId;
  }

  if (filters.status) where.status = filters.status;
  if (filters.promotionStatus) where.promotionStatus = filters.promotionStatus;
  if (filters.region) where.region = filters.region;

  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search, mode: "insensitive" } },
      { locationName: { contains: filters.search, mode: "insensitive" } },
      { description: { contains: filters.search, mode: "insensitive" } },
    ];
  }

  const clubs = await prisma.club.findMany({
    where,
    include: {
      provider: { select: { name: true } },
      owner: { select: { displayName: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  const originLat = filters.latitude;
  const originLng = filters.longitude;
  const maxDistance = filters.maxDistanceKm;

  const mapped: ManagedClubListItem[] = clubs.map((club) => {
    let distanceKm: number | null = null;
    if (originLat != null && originLng != null) {
      distanceKm = haversineKm(
        originLat,
        originLng,
        club.latitude,
        club.longitude,
      );
    }
    return {
      id: club.id,
      name: club.name,
      locationName: club.locationName,
      status: club.status,
      promotionStatus: club.promotionStatus,
      imageUrl: resolveClubImageUrl({ id: club.id, imageUrl: club.imageUrl }),
      providerName: club.provider.name,
      ownerDisplayName: club.owner?.displayName ?? null,
      latitude: club.latitude,
      longitude: club.longitude,
      distanceKm,
      updatedAt: club.updatedAt,
    };
  });

  const filtered =
    maxDistance != null && originLat != null && originLng != null
      ? mapped.filter(
          (club) => club.distanceKm != null && club.distanceKm <= maxDistance,
        )
      : mapped;

  return filtered.sort((a, b) => {
    if (a.distanceKm != null && b.distanceKm != null) {
      return a.distanceKm - b.distanceKm;
    }
    return b.updatedAt.getTime() - a.updatedAt.getTime();
  });
}

export async function getClubForEdit(clubId: string, mode: "admin" | "personal") {
  const user = await requireAuth();
  const club = await prisma.club.findUnique({
    where: { id: clubId },
    include: {
      provider: { select: { id: true, name: true } },
      owner: { select: { id: true, displayName: true, userId: true } },
    },
  });
  if (!club) throw new Error("Club not found");

  if (mode === "admin") {
    if (!isReviewerRole(user.role)) throw new Error("Forbidden");
  } else if (!canManageClub(club, user)) {
    throw new Error("Forbidden");
  }

  return club;
}

export async function createManagedClub(
  data: unknown,
  mode: "admin" | "personal",
) {
  const parsed = clubSchema.parse(data);

  if (mode === "admin") {
    await requireReviewer();
    const club = await prisma.club.create({
      data: clubDataFromParsed(parsed, {
        promotionStatus: ClubPromotionStatus.OFFICIAL,
      }),
    });
    revalidateClubPaths(club.id);
    return club;
  }

  const { profile } = await requireParentProfileId();
  const provider = await getCommunityProvider();
  const club = await prisma.club.create({
    data: {
      ...clubDataFromParsed(
        { ...parsed, providerId: provider.id },
        {
          ownerParentProfileId: profile.id,
          promotionStatus: ClubPromotionStatus.LOCAL,
        },
      ),
      status: ClubStatus.ACTIVE,
    },
  });
  revalidateClubPaths(club.id);
  return club;
}

export async function updateManagedClub(
  clubId: string,
  data: unknown,
  mode: "admin" | "personal",
) {
  const parsed = clubSchema.parse(data);
  const club = await getClubForEdit(clubId, mode);

  const updated = await prisma.club.update({
    where: { id: club.id },
    data: clubDataFromParsed(parsed, {
      ownerParentProfileId: club.ownerParentProfileId,
      promotionStatus: club.promotionStatus,
    }),
  });

  revalidateClubPaths(clubId);
  return updated;
}

export async function deactivateClub(clubId: string, mode: "admin" | "personal") {
  await getClubForEdit(clubId, mode);
  const updated = await prisma.club.update({
    where: { id: clubId },
    data: { status: ClubStatus.DRAFT },
  });
  revalidateClubPaths(clubId);
  return updated;
}

export async function archiveClub(clubId: string, mode: "admin" | "personal") {
  await getClubForEdit(clubId, mode);
  const updated = await prisma.club.update({
    where: { id: clubId },
    data: { status: ClubStatus.ARCHIVED },
  });
  revalidateClubPaths(clubId);
  return updated;
}

export async function submitClubForReview(data: unknown) {
  const parsed = clubSubmitForReviewSchema.parse(data);
  const { user, profile } = await requireParentProfileId();

  const club = await prisma.club.findUnique({
    where: { id: parsed.clubId },
    include: { owner: { select: { userId: true } } },
  });
  if (!club || club.ownerParentProfileId !== profile.id) {
    throw new Error("Club not found");
  }
  if (
    club.promotionStatus !== ClubPromotionStatus.LOCAL &&
    club.promotionStatus !== ClubPromotionStatus.DENIED
  ) {
    throw new Error("Club cannot be submitted for review");
  }

  const updated = await prisma.club.update({
    where: { id: club.id },
    data: {
      promotionStatus: ClubPromotionStatus.PENDING,
      submissionNote: parsed.submissionNote,
      reviewNote: null,
      reviewedAt: null,
      reviewedByUserId: null,
    },
  });

  await notifyReviewers({
    type: NotificationType.CLUB_SUBMITTED,
    title: `New club submitted: ${club.name}`,
    body: parsed.submissionNote,
    link: `/admin/reviews`,
  });

  revalidateClubPaths(club.id);
  return updated;
}

export async function getPendingClubReviews() {
  await requireReviewer();
  return prisma.club.findMany({
    where: { promotionStatus: ClubPromotionStatus.PENDING },
    include: {
      provider: { select: { name: true } },
      owner: {
        select: {
          displayName: true,
          user: { select: { id: true, email: true } },
        },
      },
    },
    orderBy: { updatedAt: "asc" },
  });
}

export async function moderateClubPromotion(data: unknown) {
  const parsed = clubReviewSchema.parse(data);
  const reviewer = await requireReviewer();

  if (parsed.decision === "REJECTED" && !parsed.reviewNote?.trim()) {
    throw new Error("A denial note is required");
  }

  const club = await prisma.club.findUnique({
    where: { id: parsed.clubId },
    include: {
      owner: { select: { userId: true, displayName: true } },
    },
  });
  if (!club || club.promotionStatus !== ClubPromotionStatus.PENDING) {
    throw new Error("Club not pending review");
  }

  const now = new Date();

  if (parsed.decision === "APPROVED") {
    await prisma.club.update({
      where: { id: club.id },
      data: {
        promotionStatus: ClubPromotionStatus.OFFICIAL,
        ownerParentProfileId: null,
        status: ClubStatus.ACTIVE,
        reviewNote: parsed.reviewNote ?? null,
        reviewedAt: now,
        reviewedByUserId: reviewer.id,
      },
    });

    if (club.owner?.userId) {
      await createNotification({
        userId: club.owner.userId,
        type: NotificationType.CLUB_APPROVED,
        title: `Your club "${club.name}" was approved`,
        body: parsed.reviewNote ?? "It is now part of the official club list.",
        link: `/clubs/${club.id}`,
      });
    }
  } else {
    await prisma.club.update({
      where: { id: club.id },
      data: {
        promotionStatus: ClubPromotionStatus.DENIED,
        reviewNote: parsed.reviewNote ?? null,
        reviewedAt: now,
        reviewedByUserId: reviewer.id,
      },
    });

    if (club.owner?.userId) {
      await createNotification({
        userId: club.owner.userId,
        type: NotificationType.CLUB_DENIED,
        title: `Your club "${club.name}" was not approved`,
        body: parsed.reviewNote ?? undefined,
        link: `/my-clubs/${club.id}/edit`,
      });
    }
  }

  revalidateClubPaths(club.id);
  return { success: true };
}

export async function getAdminUsers(rawFilters: unknown) {
  await requireMasterAdmin();
  const filters = adminUserFilterSchema.parse(rawFilters ?? {});

  const where: {
    OR?: Array<Record<string, unknown>>;
  } = {};

  if (filters.search?.trim()) {
    const q = filters.search.trim();
    where.OR = [
      { email: { contains: q, mode: "insensitive" } },
      { parentProfile: { is: { displayName: { contains: q, mode: "insensitive" } } } },
      { parentProfile: { is: { firstName: { contains: q, mode: "insensitive" } } } },
      { parentProfile: { is: { lastName: { contains: q, mode: "insensitive" } } } },
    ];
  }

  return prisma.user.findMany({
    where,
    include: {
      parentProfile: {
        select: {
          displayName: true,
          firstName: true,
          lastName: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function promoteUserRole(data: unknown) {
  const actor = await requireMasterAdmin();
  const parsed = promoteUserRoleSchema.parse(data);

  if (parsed.userId === actor.id) {
    throw new Error("You cannot change your own role");
  }

  const updated = await prisma.user.update({
    where: { id: parsed.userId },
    data: {
      role: parsed.role as UserRole,
      roleUpdatedAt: new Date(),
      roleUpdatedById: actor.id,
    },
  });

  revalidatePath("/admin/users");
  return updated;
}

export async function getAdminProvidersForForm() {
  await requireAuth();
  return prisma.provider.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
}
