import { NotificationType, UserRole } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";

export function isSafeNotificationLink(link: string | undefined | null): boolean {
  if (!link) return true;
  if (link.includes("\\") || link.includes("@")) return false;
  return /^\/(?!\/)/.test(link);
}

function assertSafeLink(link?: string | null) {
  if (link && !isSafeNotificationLink(link)) {
    throw new Error("Invalid notification link");
  }
}

/** Server-only helper — not exported as a server action. */
export async function createNotificationInternal(input: {
  userId: string;
  type: NotificationType;
  title: string;
  body?: string;
  link?: string;
}) {
  assertSafeLink(input.link);
  return prisma.notification.create({
    data: {
      userId: input.userId,
      type: input.type,
      title: input.title,
      body: input.body ?? null,
      link: input.link ?? null,
    },
  });
}

/** Server-only helper — not exported as a server action. */
export async function notifyReviewersInternal(input: {
  type: NotificationType;
  title: string;
  body?: string;
  link?: string;
}) {
  assertSafeLink(input.link);

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
