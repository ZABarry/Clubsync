"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/server";
import { geocodePostcode } from "@/lib/utils/geocode";
import {
  childProfileSchema,
  parentProfileSchema,
} from "@/lib/validation/schemas";

function parseChildDates(data: {
  availabilityStart?: string;
  availabilityEnd?: string;
}) {
  return {
    availabilityStart: data.availabilityStart
      ? new Date(data.availabilityStart)
      : null,
    availabilityEnd: data.availabilityEnd
      ? new Date(data.availabilityEnd)
      : null,
  };
}

async function requireParentProfileId() {
  const user = await requireAuth();
  const profile = user.parentProfile;
  if (!profile) throw new Error("Parent profile required");
  return { user, profile };
}

export async function upsertParentProfile(data: unknown) {
  const user = await requireAuth();
  const parsed = parentProfileSchema.parse(data);

  let latitude: number | null = user.parentProfile?.latitude ?? null;
  let longitude: number | null = user.parentProfile?.longitude ?? null;

  if (parsed.homePostcode) {
    const coords = await geocodePostcode(parsed.homePostcode);
    if (coords) {
      latitude = coords.lat;
      longitude = coords.lng;
    }
  }

  const profile = await prisma.parentProfile.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      displayName: parsed.displayName,
      firstName: parsed.firstName ?? null,
      lastName: parsed.lastName ?? null,
      homePostcode: parsed.homePostcode ?? null,
      latitude,
      longitude,
      defaultSearchRadiusKm: parsed.defaultSearchRadiusKm,
    },
    update: {
      displayName: parsed.displayName,
      firstName: parsed.firstName ?? null,
      lastName: parsed.lastName ?? null,
      homePostcode: parsed.homePostcode ?? null,
      latitude,
      longitude,
      defaultSearchRadiusKm: parsed.defaultSearchRadiusKm,
    },
  });

  revalidatePath("/profile");
  revalidatePath("/discover");
  return profile;
}

export async function createChild(data: unknown) {
  const { profile } = await requireParentProfileId();
  const parsed = childProfileSchema.parse(data);
  const dates = parseChildDates(parsed);

  const child = await prisma.childProfile.create({
    data: {
      parentProfileId: profile.id,
      nickname: parsed.nickname,
      age: parsed.age,
      schoolYear: parsed.schoolYear ?? null,
      interests: parsed.interests,
      notes: parsed.notes ?? null,
      ...dates,
    },
  });

  revalidatePath("/profile");
  revalidatePath("/calendar");
  return child;
}

export async function updateChild(childId: string, data: unknown) {
  const { profile } = await requireParentProfileId();
  const parsed = childProfileSchema.parse(data);
  const dates = parseChildDates(parsed);

  const existing = await prisma.childProfile.findFirst({
    where: { id: childId, parentProfileId: profile.id },
  });
  if (!existing) throw new Error("Child not found");

  const child = await prisma.childProfile.update({
    where: { id: childId },
    data: {
      nickname: parsed.nickname,
      age: parsed.age,
      schoolYear: parsed.schoolYear ?? null,
      interests: parsed.interests,
      notes: parsed.notes ?? null,
      ...dates,
    },
  });

  revalidatePath("/profile");
  revalidatePath("/calendar");
  return child;
}

export async function deleteChild(childId: string) {
  const { profile } = await requireParentProfileId();

  const existing = await prisma.childProfile.findFirst({
    where: { id: childId, parentProfileId: profile.id },
  });
  if (!existing) throw new Error("Child not found");

  await prisma.childProfile.delete({ where: { id: childId } });

  revalidatePath("/profile");
  revalidatePath("/calendar");
}

export async function getChildren() {
  const { profile } = await requireParentProfileId();

  return prisma.childProfile.findMany({
    where: { parentProfileId: profile.id },
    orderBy: { nickname: "asc" },
  });
}
