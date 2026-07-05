"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/server";
import {
  generateInviteToken,
  isValidInviteToken,
} from "@/lib/auth/invite-token";
import { sanitizeFriendActivity } from "@/lib/privacy/friend-visibility";
import { checkRateLimit, rateLimitKey } from "@/lib/security/rate-limit";
import type { TrustedConnection } from "@/lib/types/club";

async function requireParentProfileId() {
  const user = await requireAuth();
  const profile = user.parentProfile;
  if (!profile) throw new Error("Parent profile required");
  return profile;
}

export async function createInviteLink() {
  const profile = await requireParentProfileId();
  checkRateLimit(rateLimitKey("create-invite", profile.id), {
    limit: 10,
    windowMs: 60 * 60 * 1000,
  });

  const connection = await prisma.trustedParentConnection.create({
    data: {
      requesterParentId: profile.id,
      inviteToken: generateInviteToken(),
      status: "PENDING",
    },
  });

  revalidatePath("/friends");
  return {
    connectionId: connection.id,
    inviteToken: connection.inviteToken,
  };
}

export async function acceptInvite(token: string) {
  const profile = await requireParentProfileId();
  checkRateLimit(rateLimitKey("accept-invite", profile.id), {
    limit: 20,
    windowMs: 60 * 60 * 1000,
  });

  if (!isValidInviteToken(token)) {
    throw new Error("Invalid invite token");
  }

  const connection = await prisma.trustedParentConnection.findUnique({
    where: { inviteToken: token },
  });

  if (!connection || connection.status !== "PENDING") {
    throw new Error("Invite not found or already used");
  }

  if (connection.requesterParentId === profile.id) {
    throw new Error("Cannot accept your own invite");
  }

  const updated = await prisma.trustedParentConnection.update({
    where: { id: connection.id },
    data: {
      recipientParentId: profile.id,
      status: "ACCEPTED",
      acceptedAt: new Date(),
    },
  });

  revalidatePath("/friends");
  return updated;
}

export async function getTrustedConnections(): Promise<TrustedConnection[]> {
  const profile = await requireParentProfileId();

  const connections = await prisma.trustedParentConnection.findMany({
    where: {
      OR: [
        { requesterParentId: profile.id },
        { recipientParentId: profile.id },
      ],
      status: { in: ["PENDING", "ACCEPTED"] },
    },
    include: {
      requester: { select: { id: true, displayName: true } },
      recipient: { select: { id: true, displayName: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return connections.map((c) => {
    const isSent = c.requesterParentId === profile.id;
    const other = isSent ? c.recipient : c.requester;

    return {
      id: c.id,
      displayName: other?.displayName ?? "Pending invite",
      status: c.status,
      direction: isSent ? ("sent" as const) : ("received" as const),
      acceptedAt: c.acceptedAt,
    };
  });
}

export async function getFriendActivity() {
  const profile = await requireParentProfileId();

  const connections = await prisma.trustedParentConnection.findMany({
    where: {
      status: "ACCEPTED",
      OR: [
        { requesterParentId: profile.id },
        { recipientParentId: profile.id },
      ],
    },
  });

  const friendIds = connections.map((c) =>
    c.requesterParentId === profile.id
      ? c.recipientParentId!
      : c.requesterParentId,
  );

  if (friendIds.length === 0) return [];

  const activity = await prisma.plannedClub.findMany({
    where: { parentProfileId: { in: friendIds } },
    include: {
      parent: { select: { displayName: true } },
      child: { select: { nickname: true, age: true } },
      club: {
        select: { id: true, name: true, startDate: true, endDate: true },
      },
    },
    orderBy: { club: { startDate: "asc" } },
  });

  return sanitizeFriendActivity(activity);
}

export async function getFriendActivityForClub(clubId: string) {
  const activity = await getFriendActivity();
  return activity.filter((a) => a.clubId === clubId);
}

export async function getInvitePreview(token: string) {
  const user = await requireAuth();
  checkRateLimit(rateLimitKey("invite-preview", user.id), {
    limit: 30,
    windowMs: 60 * 60 * 1000,
  });

  if (!isValidInviteToken(token)) return null;

  const connection = await prisma.trustedParentConnection.findUnique({
    where: { inviteToken: token },
    include: {
      requester: { select: { displayName: true } },
    },
  });

  if (!connection || connection.status !== "PENDING") return null;

  return {
    requesterName: connection.requester.displayName,
  };
}

export async function revokeConnection(connectionId: string) {
  const profile = await requireParentProfileId();

  const connection = await prisma.trustedParentConnection.findFirst({
    where: {
      id: connectionId,
      OR: [
        { requesterParentId: profile.id },
        { recipientParentId: profile.id },
      ],
    },
  });

  if (!connection) throw new Error("Connection not found");

  await prisma.trustedParentConnection.update({
    where: { id: connectionId },
    data: { status: "REVOKED" },
  });

  revalidatePath("/friends");
  revalidatePath("/discover");
}
