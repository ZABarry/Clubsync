"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { createAdminClient } from "@/lib/auth/supabase-admin";
import { requireAuth } from "@/lib/auth/server";
import { prisma } from "@/lib/db/prisma";
import { checkRateLimit, rateLimitKey } from "@/lib/security/rate-limit";

export async function exportUserData() {
  const user = await requireAuth();
  checkRateLimit(rateLimitKey("export-data", user.id), {
    limit: 3,
    windowMs: 60 * 60 * 1000,
  });

  const profile = await prisma.parentProfile.findUnique({
    where: { userId: user.id },
    include: {
      children: true,
      plannedClubs: {
        include: {
          club: { select: { id: true, name: true } },
          child: { select: { nickname: true } },
        },
      },
      sentConnections: {
        select: {
          status: true,
          createdAt: true,
          acceptedAt: true,
        },
      },
      receivedConnections: {
        select: {
          status: true,
          createdAt: true,
          acceptedAt: true,
        },
      },
      ratings: {
        select: {
          rating: true,
          reviewText: true,
          moderationStatus: true,
          createdAt: true,
          club: { select: { name: true } },
        },
      },
    },
  });

  return {
    exportedAt: new Date().toISOString(),
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
    },
    parentProfile: profile
      ? {
          displayName: profile.displayName,
          firstName: profile.firstName,
          lastName: profile.lastName,
          homePostcode: profile.homePostcode,
          defaultSearchRadiusKm: profile.defaultSearchRadiusKm,
          children: profile.children,
          plannedClubs: profile.plannedClubs,
          sentConnections: profile.sentConnections,
          receivedConnections: profile.receivedConnections,
          ratings: profile.ratings,
        }
      : null,
  };
}

export async function deleteAccount(confirmation: unknown) {
  const user = await requireAuth();
  checkRateLimit(rateLimitKey("delete-account", user.id), {
    limit: 3,
    windowMs: 60 * 60 * 1000,
  });

  const parsed = z
    .object({
      confirmEmail: z.string().email(),
    })
    .parse(confirmation);

  if (parsed.confirmEmail.toLowerCase() !== user.email.toLowerCase()) {
    throw new Error("Email confirmation does not match your account");
  }

  const admin = createAdminClient();
  const { error: authError } = await admin.auth.admin.deleteUser(user.id);
  if (authError) {
    throw new Error("Failed to delete authentication account");
  }

  await prisma.user.delete({ where: { id: user.id } });

  redirect("/login");
}
