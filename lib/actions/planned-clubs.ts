"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/server";
import { plannedClubSchema } from "@/lib/validation/schemas";
import type {
  ClubCalendarEvent,
  PlannedClubBookingData,
} from "@/lib/types/club";
import {
  computeTotalPrice,
  resolveDailyRate,
  uniqueBookedDates,
  validateBookedDates,
} from "@/lib/utils/club-booking";

async function requireParentProfileId() {
  const user = await requireAuth();
  const profile = user.parentProfile;
  if (!profile) throw new Error("Parent profile required");
  return profile;
}

function toBookingData(
  planned: {
    bookedDates: string[];
    dailyRateOverride: number | null;
    totalPriceOverride: number | null;
    club: { dailyRate: number | null; price: number | null };
  },
): PlannedClubBookingData {
  const bookedDates = uniqueBookedDates(planned.bookedDates);
  const effectiveDailyRate = resolveDailyRate(
    planned.club,
    planned.dailyRateOverride,
  );
  const effectiveTotalPrice = computeTotalPrice(
    effectiveDailyRate,
    bookedDates.length,
    planned.totalPriceOverride,
  );

  return {
    bookedDates,
    dailyRateOverride: planned.dailyRateOverride,
    totalPriceOverride: planned.totalPriceOverride,
    effectiveDailyRate,
    effectiveTotalPrice,
  };
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

  const bookedDates = uniqueBookedDates(
    parsed.bookedDates ?? existing?.bookedDates ?? [],
  );
  const dailyRateOverride =
    parsed.dailyRateOverride !== undefined
      ? parsed.dailyRateOverride
      : (existing?.dailyRateOverride ?? null);
  const totalPriceOverride =
    parsed.totalPriceOverride !== undefined
      ? parsed.totalPriceOverride
      : (existing?.totalPriceOverride ?? null);

  const dateValidation = validateBookedDates(
    bookedDates,
    club.startDate,
    club.endDate,
  );
  if (!dateValidation.valid) {
    throw new Error(dateValidation.error ?? "Invalid booked dates");
  }

  if (
    (parsed.status === "BOOKED" || parsed.status === "PAID") &&
    bookedDates.length === 0
  ) {
    throw new Error("Select at least one day when marking as booked or paid");
  }

  const planned = existing
    ? await prisma.plannedClub.update({
        where: { id: existing.id },
        data: {
          status: parsed.status,
          notes: parsed.notes ?? null,
          bookedDates,
          dailyRateOverride,
          totalPriceOverride,
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
          bookedDates,
          dailyRateOverride,
          totalPriceOverride,
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

export async function getPlannedClubForClub(
  clubId: string,
): Promise<PlannedClubBookingData | null> {
  const profile = await requireParentProfileId();

  const planned = await prisma.plannedClub.findFirst({
    where: { parentProfileId: profile.id, clubId },
    select: {
      bookedDates: true,
      dailyRateOverride: true,
      totalPriceOverride: true,
      club: { select: { dailyRate: true, price: true } },
    },
  });

  if (!planned) return null;
  return toBookingData(planned);
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

function isoDateToUtcDate(isoDate: string): Date {
  return new Date(`${isoDate}T00:00:00.000Z`);
}

function groupContiguousDates(dates: string[]): string[][] {
  const sorted = uniqueBookedDates(dates);
  if (sorted.length === 0) return [];

  const groups: string[][] = [[sorted[0]]];

  for (let i = 1; i < sorted.length; i++) {
    const previous = isoDateToUtcDate(sorted[i - 1]);
    const current = isoDateToUtcDate(sorted[i]);
    previous.setUTCDate(previous.getUTCDate() + 1);

    if (previous.getTime() === current.getTime()) {
      groups[groups.length - 1].push(sorted[i]);
    } else {
      groups.push([sorted[i]]);
    }
  }

  return groups;
}

export async function getPlannedClubsForCalendar(): Promise<ClubCalendarEvent[]> {
  const profile = await requireParentProfileId();

  const planned = await prisma.plannedClub.findMany({
    where: {
      parentProfileId: profile.id,
      status: { not: "CANCELLED" },
    },
    include: {
      club: {
        select: {
          id: true,
          name: true,
          startDate: true,
          endDate: true,
          dailyRate: true,
          price: true,
        },
      },
      child: { select: { nickname: true } },
    },
    orderBy: { club: { startDate: "asc" } },
  });

  const events: ClubCalendarEvent[] = [];

  for (const p of planned) {
    const title = p.child
      ? `${p.club.name} (${p.child.nickname})`
      : p.club.name;
    const booking = toBookingData({
      bookedDates: p.bookedDates,
      dailyRateOverride: p.dailyRateOverride,
      totalPriceOverride: p.totalPriceOverride,
      club: p.club,
    });

    const baseEvent = {
      id: p.id,
      title,
      status: p.status,
      clubId: p.club.id,
      campStartDate: p.club.startDate,
      campEndDate: p.club.endDate,
      bookedDates: booking.bookedDates,
      dayCount: booking.bookedDates.length,
      effectiveTotalPrice: booking.effectiveTotalPrice,
      effectiveDailyRate: booking.effectiveDailyRate,
      dailyRateOverride: p.dailyRateOverride,
      totalPriceOverride: p.totalPriceOverride,
    };

    if (booking.bookedDates.length > 0) {
      for (const group of groupContiguousDates(booking.bookedDates)) {
        const first = group[0];
        const last = group[group.length - 1];
        events.push({
          ...baseEvent,
          id: group.length === booking.bookedDates.length ? p.id : `${p.id}-${first}`,
          start: isoDateToUtcDate(first),
          end: isoDateToUtcDate(last),
        });
      }
      continue;
    }

    events.push({
      ...baseEvent,
      start: p.club.startDate,
      end: p.club.endDate,
    });
  }

  return events;
}
