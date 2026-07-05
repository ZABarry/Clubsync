"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/server";
import { changeRequestSchema } from "@/lib/validation/schemas";

async function requireParentProfileId() {
  const user = await requireAuth();
  const profile = user.parentProfile;
  if (!profile) throw new Error("Parent profile required");
  return profile;
}

export async function submitChangeRequest(data: unknown) {
  const profile = await requireParentProfileId();
  const parsed = changeRequestSchema.parse(data);

  const club = await prisma.club.findFirst({
    where: { id: parsed.clubId, status: "ACTIVE" },
  });
  if (!club) throw new Error("Club not found");

  const request = await prisma.clubChangeRequest.create({
    data: {
      clubId: parsed.clubId,
      submittedByParentId: profile.id,
      fieldName: parsed.fieldName,
      suggestedValue: parsed.suggestedValue,
      notes: parsed.notes ?? null,
      moderationStatus: "PENDING",
    },
  });

  revalidatePath("/admin");
  revalidatePath(`/clubs/${parsed.clubId}`);
  return request;
}
