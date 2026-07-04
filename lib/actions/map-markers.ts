"use server";

import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/server";
import { isVisibleToFriends } from "@/lib/privacy/friend-visibility";
import {
  buildCampMapMarkers,
  type MapMarkerContext,
} from "@/lib/map/build-camp-markers";
import type { CampMapMarker } from "@/lib/types/camp";

async function getTrustedFriendIds(parentProfileId: string) {
  const connections = await prisma.trustedParentConnection.findMany({
    where: {
      status: "ACCEPTED",
      OR: [
        { requesterParentId: parentProfileId },
        { recipientParentId: parentProfileId },
      ],
    },
  });

  return connections.map((c) =>
    c.requesterParentId === parentProfileId
      ? c.recipientParentId!
      : c.requesterParentId,
  );
}

export async function getMapMarkerContext(): Promise<MapMarkerContext> {
  const user = await requireAuth();
  const profile = user.parentProfile;
  if (!profile) {
    return {
      myCampIds: new Set(),
      friendCampIds: new Set(),
      sharedCampIds: new Set(),
    };
  }

  const [myPlanned, friendIds, sharedParticipants] = await Promise.all([
    prisma.plannedCamp.findMany({
      where: {
        parentProfileId: profile.id,
        status: { not: "CANCELLED" },
      },
      select: { campId: true },
    }),
    getTrustedFriendIds(profile.id),
    prisma.sharedCampParticipant.findMany({
      where: { parentProfileId: profile.id },
      include: { sharedCamp: { select: { campId: true } } },
    }),
  ]);

  const myCampIds = new Set(myPlanned.map((p) => p.campId));
  const sharedCampIds = new Set(
    sharedParticipants.map((p) => p.sharedCamp.campId),
  );

  let friendCampIds = new Set<string>();
  if (friendIds.length > 0) {
    const friendPlanned = await prisma.plannedCamp.findMany({
      where: { parentProfileId: { in: friendIds } },
      select: { campId: true, status: true },
    });
    friendCampIds = new Set(
      friendPlanned
        .filter((p) => isVisibleToFriends(p.status))
        .map((p) => p.campId),
    );
  }

  return { myCampIds, friendCampIds, sharedCampIds };
}

export async function buildMapMarkersForCamps(
  camps: Array<{
    id: string;
    name: string;
    latitude: number;
    longitude: number;
  }>,
): Promise<CampMapMarker[]> {
  const context = await getMapMarkerContext();
  return buildCampMapMarkers(camps, context);
}
