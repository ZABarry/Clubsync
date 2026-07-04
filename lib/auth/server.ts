import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { cache } from "react";
import { prisma } from "@/lib/db/prisma";
import { Prisma, UserRole } from "@prisma/client";

import { getSupabasePublishableKey, getSupabaseUrl } from "@/lib/auth/env";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(getSupabaseUrl(), getSupabasePublishableKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Called from Server Component — middleware refreshes sessions
        }
      },
    },
  });
}

export async function getSession() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export const syncUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
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
