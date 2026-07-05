"use server";

import { NotificationType, UserRole } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/server";

export async function createNotification(input: {
  userId: string;
  type: NotificationType;
  title: string;
  body?: string;
  link?: string;
}) {
  return prisma.notification.create({ data: input });
}

export async function notifyReviewers(input: {
  type: NotificationType;
  title: string;
  body?: string;
  link?: string;
}) {
  const reviewers = await prisma.user.findMany({
    where: {
      role: { in: [UserRole.REVIEWER, UserRole.MASTER_ADMIN] },
    },
    select: { id: true },
  });

  if (reviewers.length === 0) return;

  await prisma.notification.createMany({
    data: reviewers.map((user) => ({
      userId: user.id,
      type: input.type,
      title: input.title,
      body: input.body ?? null,
      link: input.link ?? null,
    })),
  });
}

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
