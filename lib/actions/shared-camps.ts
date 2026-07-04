"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/server";
import { sharedCampSchema } from "@/lib/validation/schemas";
import { sanitizeSharedCampChild } from "@/lib/privacy/friend-visibility";

async function requireParentProfileId() {
  const user = await requireAuth();
  const profile = user.parentProfile;
  if (!profile) throw new Error("Parent profile required");
  return profile;
}

export async function createSharedCamp(data: unknown) {
  const profile = await requireParentProfileId();
  const parsed = sharedCampSchema.parse(data);

  const camp = await prisma.camp.findFirst({
    where: { id: parsed.campId, status: "ACTIVE" },
  });
  if (!camp) throw new Error("Camp not found");

  const sharedCamp = await prisma.sharedCamp.create({
    data: {
      campId: parsed.campId,
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
      camp: { include: { provider: { select: { name: true } } } },
      participants: {
        include: {
          parent: { select: { displayName: true } },
          child: { select: { nickname: true, age: true, notes: true } },
        },
      },
    },
  });

  revalidatePath("/friends");
  revalidatePath("/shared-camps");
  return sharedCamp;
}

export async function joinSharedCamp(
  sharedCampId: string,
  opts?: { childProfileId?: string; status?: "INTERESTED" | "PLANNED" | "BOOKED" | "PAID" | "CANCELLED" },
) {
  const profile = await requireParentProfileId();

  const sharedCamp = await prisma.sharedCamp.findUnique({
    where: { id: sharedCampId },
  });
  if (!sharedCamp) throw new Error("Shared camp not found");

  if (opts?.childProfileId) {
    const child = await prisma.childProfile.findFirst({
      where: { id: opts.childProfileId, parentProfileId: profile.id },
    });
    if (!child) throw new Error("Child not found");
  }

  let plannedCampId: string | null = null;
  const existingPlanned = await prisma.plannedCamp.findFirst({
    where: {
      parentProfileId: profile.id,
      campId: sharedCamp.campId,
      childProfileId: opts?.childProfileId ?? null,
    },
  });
  if (existingPlanned) plannedCampId = existingPlanned.id;

  const existing = await prisma.sharedCampParticipant.findFirst({
    where: { sharedCampId, parentProfileId: profile.id },
  });

  const participantData = {
    childProfileId: opts?.childProfileId ?? null,
    plannedCampId,
    status: opts?.status ?? ("INTERESTED" as const),
  };

  const participant = existing
    ? await prisma.sharedCampParticipant.update({
        where: { id: existing.id },
        data: participantData,
        include: {
          parent: { select: { displayName: true } },
          child: { select: { nickname: true, age: true, notes: true } },
        },
      })
    : await prisma.sharedCampParticipant.create({
        data: {
          sharedCampId,
          parentProfileId: profile.id,
          ...participantData,
        },
        include: {
          parent: { select: { displayName: true } },
          child: { select: { nickname: true, age: true, notes: true } },
        },
      });

  revalidatePath("/shared-camps");
  revalidatePath(`/shared-camps/${sharedCampId}`);
  return participant;
}

export async function getSharedCamp(sharedCampId: string) {
  const profile = await requireParentProfileId();

  const sharedCamp = await prisma.sharedCamp.findUnique({
    where: { id: sharedCampId },
    include: {
      camp: { include: { provider: { select: { name: true } } } },
      createdBy: { select: { displayName: true } },
      participants: {
        include: {
          parent: { select: { id: true, displayName: true } },
          child: { select: { nickname: true, age: true, notes: true } },
        },
      },
    },
  });

  if (!sharedCamp) return null;

  const friendIds = await getTrustedFriendIds(profile.id);
  const isParticipant = sharedCamp.participants.some(
    (p) => p.parentProfileId === profile.id,
  );
  const isCreator = sharedCamp.createdByParentId === profile.id;
  const isFriendCreator = friendIds.includes(sharedCamp.createdByParentId);

  if (!isParticipant && !isCreator && !isFriendCreator) {
    throw new Error("Forbidden");
  }

  return {
    ...sharedCamp,
    participants: sharedCamp.participants.map((p) => ({
      ...p,
      child: p.child ? sanitizeSharedCampChild(p.child) : null,
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

export async function getSharedCampsForCamp(campId: string) {
  const profile = await requireParentProfileId();
  const friendIds = await getTrustedFriendIds(profile.id);

  return prisma.sharedCamp.findMany({
    where: {
      campId,
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

export async function getSharedCampsForParent() {
  const profile = await requireParentProfileId();

  return prisma.sharedCamp.findMany({
    where: {
      OR: [
        { createdByParentId: profile.id },
        { participants: { some: { parentProfileId: profile.id } } },
      ],
    },
    include: {
      camp: {
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
