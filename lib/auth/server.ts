import { cache } from "react";
import { prisma } from "@/lib/db/prisma";
import { Prisma, UserRole, type Club, type User } from "@prisma/client";

import { createClient } from "@/lib/auth/supabase-server";
import {
  isMasterAdminRole,
  isReviewerRole,
  resolveBootstrapRole,
} from "@/lib/auth/roles";

export { createClient, getSession } from "@/lib/auth/supabase-server";

export const syncUser = cache(async () => {
  const supabase = await createClient();
  let user;
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error) return null;
    user = data.user;
  } catch {
    return null;
  }
  if (!user?.email) return null;

  const bootstrapRole = resolveBootstrapRole(user.email);
  const now = new Date();

  try {
    return await prisma.user.upsert({
      where: { id: user.id },
      create: {
        id: user.id,
        email: user.email,
        role: bootstrapRole,
        lastLoginAt: now,
      },
      update: {
        email: user.email,
        lastLoginAt: now,
        ...(bootstrapRole === UserRole.MASTER_ADMIN
          ? { role: UserRole.MASTER_ADMIN }
          : {}),
      },
      include: { parentProfile: true },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return prisma.user.findUniqueOrThrow({
        where: { id: user.id },
        include: { parentProfile: true },
      });
    }
    throw error;
  }
});

export async function requireAuth() {
  const dbUser = await syncUser();
  if (!dbUser) throw new Error("Unauthorized");
  return dbUser;
}

export async function requireReviewer() {
  const dbUser = await requireAuth();
  if (!isReviewerRole(dbUser.role)) throw new Error("Forbidden");
  return dbUser;
}

export async function requireMasterAdmin() {
  const dbUser = await requireAuth();
  if (!isMasterAdminRole(dbUser.role)) throw new Error("Forbidden");
  return dbUser;
}

/** @deprecated Use requireReviewer() */
export async function requireAdmin() {
  return requireReviewer();
}

export function canManageClub(
  club: Pick<Club, "ownerParentProfileId">,
  user: User & { parentProfile?: { id: string } | null },
): boolean {
  if (isReviewerRole(user.role) && !club.ownerParentProfileId) {
    return true;
  }
  if (
    club.ownerParentProfileId &&
    user.parentProfile?.id === club.ownerParentProfileId
  ) {
    return true;
  }
  return false;
}

export async function getParentProfile() {
  const dbUser = await requireAuth();
  return dbUser.parentProfile;
}

export function showAdminNav(role: UserRole): boolean {
  return isReviewerRole(role);
}
