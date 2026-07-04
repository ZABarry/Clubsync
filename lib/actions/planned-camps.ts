"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/server";
import { plannedCampSchema } from "@/lib/validation/schemas";
import type { CampCalendarEvent } from "@/lib/types/camp";

async function requireParentProfileId() {
  const user = await requireAuth();
  const profile = user.parentProfile;
  if (!profile) throw new Error("Parent profile required");
  return profile;
}

export async function upsertPlannedCamp(data: unknown) {
  const profile = await requireParentProfileId();
  const parsed = plannedCampSchema.parse(data);

  if (parsed.childProfileId) {
    const child = await prisma.childProfile.findFirst({
      where: { id: parsed.childProfileId, parentProfileId: profile.id },
    });
    if (!child) throw new Error("Child not found");
  }

  const camp = await prisma.camp.findFirst({
    where: { id: parsed.campId, status: "ACTIVE" },
  });
  if (!camp) throw new Error("Camp not found");

  const childProfileId = parsed.childProfileId ?? null;

  const existing = await prisma.plannedCamp.findFirst({
    where: {
      parentProfileId: profile.id,
      campId: parsed.campId,
      childProfileId,
    },
  });

  const planned = existing
    ? await prisma.plannedCamp.update({
        where: { id: existing.id },
        data: {
          status: parsed.status,
          notes: parsed.notes ?? null,
        },
        include: {
          camp: { include: { provider: { select: { name: true } } } },
          child: { select: { nickname: true, age: true } },
        },
      })
    : await prisma.plannedCamp.create({
        data: {
          parentProfileId: profile.id,
          campId: parsed.campId,
          childProfileId,
          status: parsed.status,
          notes: parsed.notes ?? null,
        },
        include: {
          camp: { include: { provider: { select: { name: true } } } },
          child: { select: { nickname: true, age: true } },
        },
      });

  revalidatePath("/calendar");
  revalidatePath("/discover");
  revalidatePath(`/camps/${parsed.campId}`);
  return planned;
}

export async function getPlannedCampsForParent() {
  const profile = await requireParentProfileId();

  return prisma.plannedCamp.findMany({
    where: { parentProfileId: profile.id },
    include: {
      camp: { include: { provider: { select: { name: true } } } },
      child: { select: { id: true, nickname: true, age: true } },
    },
    orderBy: { camp: { startDate: "asc" } },
  });
}

export async function getPlannedCampsForCalendar(): Promise<CampCalendarEvent[]> {
  const profile = await requireParentProfileId();

  const planned = await prisma.plannedCamp.findMany({
    where: {
      parentProfileId: profile.id,
      status: { not: "CANCELLED" },
    },
    include: {
      camp: { select: { id: true, name: true, startDate: true, endDate: true } },
      child: { select: { nickname: true } },
    },
    orderBy: { camp: { startDate: "asc" } },
  });

  return planned.map((p) => ({
    id: p.id,
    title: p.child
      ? `${p.camp.name} (${p.child.nickname})`
      : p.camp.name,
    start: p.camp.startDate,
    end: p.camp.endDate,
    status: p.status,
    campId: p.camp.id,
  }));
}
