"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/server";
import { sharedClubSchema } from "@/lib/validation/schemas";
import { sanitizeSharedClubChild } from "@/lib/privacy/friend-visibility";

async function requireParentProfileId() {
  const user = await requireAuth();
  const profile = user.parentProfile;
  if (!profile) throw new Error("Parent profile required");
  return profile;
}

export async function createSharedClub(data: unknown) {
  const profile = await requireParentProfileId();
  const parsed = sharedClubSchema.parse(data);

  const club = await prisma.club.findFirst({
    where: { id: parsed.clubId, status: "ACTIVE" },
  });
  if (!club) throw new Error("Club not found");

  const sharedClub = await prisma.sharedClub.create({
    data: {
      clubId: parsed.clubId,
      createdByParentId: profile.id,
      title: parsed.title,
      notes: parsed.notes ?? null,
      participants: {
        create: {
          parentProfileId: profile.id,
          status: "INTERESTED",
        },
      },
    },
    include: {
      club: { include: { provider: { select: { name: true } } } },
      participants: {
        include: {
          parent: { select: { displayName: true } },
          child: { select: { nickname: true, age: true, notes: true } },
        },
      },
    },
  });

  revalidatePath("/friends");
  revalidatePath("/shared-clubs");
  return sharedClub;
}

export async function joinSharedClub(
  sharedClubId: string,
  opts?: { childProfileId?: string; status?: "INTERESTED" | "PLANNED" | "BOOKED" | "PAID" | "CANCELLED" },
) {
  const profile = await requireParentProfileId();

  const sharedClub = await prisma.sharedClub.findUnique({
    where: { id: sharedClubId },
  });
  if (!sharedClub) throw new Error("Shared club not found");

  if (opts?.childProfileId) {
    const child = await prisma.childProfile.findFirst({
      where: { id: opts.childProfileId, parentProfileId: profile.id },
    });
    if (!child) throw new Error("Child not found");
  }

  let plannedClubId: string | null = null;
  const existingPlanned = await prisma.plannedClub.findFirst({
    where: {
      parentProfileId: profile.id,
      clubId: sharedClub.clubId,
      childProfileId: opts?.childProfileId ?? null,
    },
  });
  if (existingPlanned) plannedClubId = existingPlanned.id;

  const existing = await prisma.sharedClubParticipant.findFirst({
    where: { sharedClubId, parentProfileId: profile.id },
  });

  const participantData = {
    childProfileId: opts?.childProfileId ?? null,
    plannedClubId,
    status: opts?.status ?? ("INTERESTED" as const),
  };

  const participant = existing
    ? await prisma.sharedClubParticipant.update({
        where: { id: existing.id },
        data: participantData,
        include: {
          parent: { select: { displayName: true } },
          child: { select: { nickname: true, age: true, notes: true } },
        },
      })
    : await prisma.sharedClubParticipant.create({
        data: {
          sharedClubId,
          parentProfileId: profile.id,
          ...participantData,
        },
        include: {
          parent: { select: { displayName: true } },
          child: { select: { nickname: true, age: true, notes: true } },
        },
      });

  revalidatePath("/shared-clubs");
  revalidatePath(`/shared-clubs/${sharedClubId}`);
  return participant;
}

export async function getSharedClub(sharedClubId: string) {
  const profile = await requireParentProfileId();

  const sharedClub = await prisma.sharedClub.findUnique({
    where: { id: sharedClubId },
    include: {
      club: { include: { provider: { select: { name: true } } } },
      createdBy: { select: { displayName: true } },
      participants: {
        include: {
          parent: { select: { id: true, displayName: true } },
          child: { select: { nickname: true, age: true, notes: true } },
        },
      },
    },
  });

  if (!sharedClub) return null;

  const friendIds = await getTrustedFriendIds(profile.id);
  const isParticipant = sharedClub.participants.some(
    (p) => p.parentProfileId === profile.id,
  );
  const isCreator = sharedClub.createdByParentId === profile.id;
  const isFriendCreator = friendIds.includes(sharedClub.createdByParentId);

  if (!isParticipant && !isCreator && !isFriendCreator) {
    throw new Error("Forbidden");
  }

  return {
    ...sharedClub,
    participants: sharedClub.participants.map((p) => ({
      ...p,
      child: p.child ? sanitizeSharedClubChild(p.child) : null,
    })),
  };
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

export async function getSharedClubsForClub(clubId: string) {
  const profile = await requireParentProfileId();
  const friendIds = await getTrustedFriendIds(profile.id);

  return prisma.sharedClub.findMany({
    where: {
      clubId,
      OR: [
        { createdByParentId: profile.id },
        { createdByParentId: { in: friendIds } },
        { participants: { some: { parentProfileId: profile.id } } },
      ],
    },
    include: {
      createdBy: { select: { displayName: true } },
      participants: {
        include: {
          parent: { select: { id: true, displayName: true } },
        },
      },
      _count: { select: { participants: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getSharedClubsForParent() {
  const profile = await requireParentProfileId();

  return prisma.sharedClub.findMany({
    where: {
      OR: [
        { createdByParentId: profile.id },
        { participants: { some: { parentProfileId: profile.id } } },
      ],
    },
    include: {
      club: {
        select: {
          id: true,
          name: true,
          startDate: true,
          endDate: true,
          locationName: true,
          bookingUrl: true,
        },
      },
      createdBy: { select: { displayName: true } },
      participants: {
        include: {
          parent: { select: { displayName: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}
