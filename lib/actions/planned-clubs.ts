"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/server";
import { plannedClubSchema } from "@/lib/validation/schemas";
import type { ClubCalendarEvent } from "@/lib/types/club";

async function requireParentProfileId() {
  const user = await requireAuth();
  const profile = user.parentProfile;
  if (!profile) throw new Error("Parent profile required");
  return profile;
}

export async function upsertPlannedClub(data: unknown) {
  const profile = await requireParentProfileId();
  const parsed = plannedClubSchema.parse(data);

  if (parsed.childProfileId) {
    const child = await prisma.childProfile.findFirst({
      where: { id: parsed.childProfileId, parentProfileId: profile.id },
    });
    if (!child) throw new Error("Child not found");
  }

  const club = await prisma.club.findFirst({
    where: { id: parsed.clubId, status: "ACTIVE" },
  });
  if (!club) throw new Error("Club not found");

  const childProfileId = parsed.childProfileId ?? null;

  const existing = await prisma.plannedClub.findFirst({
    where: {
      parentProfileId: profile.id,
      clubId: parsed.clubId,
      childProfileId,
    },
  });

  const planned = existing
    ? await prisma.plannedClub.update({
        where: { id: existing.id },
        data: {
          status: parsed.status,
          notes: parsed.notes ?? null,
        },
        include: {
          club: { include: { provider: { select: { name: true } } } },
          child: { select: { nickname: true, age: true } },
        },
      })
    : await prisma.plannedClub.create({
        data: {
          parentProfileId: profile.id,
          clubId: parsed.clubId,
          childProfileId,
          status: parsed.status,
          notes: parsed.notes ?? null,
        },
        include: {
          club: { include: { provider: { select: { name: true } } } },
          child: { select: { nickname: true, age: true } },
        },
      });

  revalidatePath("/calendar");
  revalidatePath("/discover");
  revalidatePath(`/clubs/${parsed.clubId}`);
  return planned;
}

export async function getPlannedClubsForParent() {
  const profile = await requireParentProfileId();

  return prisma.plannedClub.findMany({
    where: { parentProfileId: profile.id },
    include: {
      club: { include: { provider: { select: { name: true } } } },
      child: { select: { id: true, nickname: true, age: true } },
    },
    orderBy: { club: { startDate: "asc" } },
  });
}

export async function getPlannedClubsForCalendar(): Promise<ClubCalendarEvent[]> {
  const profile = await requireParentProfileId();

  const planned = await prisma.plannedClub.findMany({
    where: {
      parentProfileId: profile.id,
      status: { not: "CANCELLED" },
    },
    include: {
      club: { select: { id: true, name: true, startDate: true, endDate: true } },
      child: { select: { nickname: true } },
    },
    orderBy: { club: { startDate: "asc" } },
  });

  return planned.map((p) => ({
    id: p.id,
    title: p.child
      ? `${p.club.name} (${p.child.nickname})`
      : p.club.name,
    start: p.club.startDate,
    end: p.club.endDate,
    status: p.status,
    clubId: p.club.id,
  }));
}
