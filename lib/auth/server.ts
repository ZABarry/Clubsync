import { cache } from "react";
import { prisma } from "@/lib/db/prisma";
import { Prisma, UserRole } from "@prisma/client";

import { createClient } from "@/lib/auth/supabase-server";

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

  const adminEmail = process.env.ADMIN_EMAIL;
  const role =
    adminEmail && user.email === adminEmail ? UserRole.ADMIN : UserRole.PARENT;

  try {
    return await prisma.user.upsert({
      where: { id: user.id },
      create: { id: user.id, email: user.email, role },
      update: { email: user.email },
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

export async function requireAdmin() {
  const dbUser = await requireAuth();
  if (dbUser.role !== UserRole.ADMIN) throw new Error("Forbidden");
  return dbUser;
}

export async function getParentProfile() {
  const dbUser = await requireAuth();
  return dbUser.parentProfile;
}
