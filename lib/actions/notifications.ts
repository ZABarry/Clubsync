"use server";

import { requireAuth } from "@/lib/auth/server";
import { prisma } from "@/lib/db/prisma";

export async function getNotifications(limit = 20) {
  const user = await requireAuth();
  return prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function getUnreadNotificationCount() {
  const user = await requireAuth();
  return prisma.notification.count({
    where: { userId: user.id, readAt: null },
  });
}

export async function markNotificationRead(notificationId: string) {
  const user = await requireAuth();
  return prisma.notification.updateMany({
    where: { id: notificationId, userId: user.id },
    data: { readAt: new Date() },
  });
}

export async function markAllNotificationsRead() {
  const user = await requireAuth();
  return prisma.notification.updateMany({
    where: { userId: user.id, readAt: null },
    data: { readAt: new Date() },
  });
}
