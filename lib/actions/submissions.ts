"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/server";
import {
  campSubmissionSchema,
  changeRequestSchema,
} from "@/lib/validation/schemas";

async function requireParentProfileId() {
  const user = await requireAuth();
  const profile = user.parentProfile;
  if (!profile) throw new Error("Parent profile required");
  return profile;
}

export async function submitCamp(data: unknown) {
  const profile = await requireParentProfileId();
  const parsed = campSubmissionSchema.parse(data);

  const submission = await prisma.campSubmission.create({
    data: {
      submittedByParentId: profile.id,
      campName: parsed.campName,
      providerName: parsed.providerName ?? null,
      website: parsed.website || null,
      notes: parsed.notes ?? null,
      moderationStatus: "PENDING",
    },
  });

  revalidatePath("/admin");
  return submission;
}

export async function submitChangeRequest(data: unknown) {
  const profile = await requireParentProfileId();
  const parsed = changeRequestSchema.parse(data);

  const camp = await prisma.camp.findFirst({
    where: { id: parsed.campId, status: "ACTIVE" },
  });
  if (!camp) throw new Error("Camp not found");

  const request = await prisma.campChangeRequest.create({
    data: {
      campId: parsed.campId,
      submittedByParentId: profile.id,
      fieldName: parsed.fieldName,
      suggestedValue: parsed.suggestedValue,
      notes: parsed.notes ?? null,
      moderationStatus: "PENDING",
    },
  });

  revalidatePath("/admin");
  revalidatePath(`/camps/${parsed.campId}`);
  return request;
}
