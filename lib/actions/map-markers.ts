"use server";

import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/server";
import { isVisibleToFriends } from "@/lib/privacy/friend-visibility";
import {
  buildClubMapMarkers,
  type MapMarkerContext,
} from "@/lib/map/build-club-markers";
import type { ClubMapMarker } from "@/lib/types/club";

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
      myClubIds: new Set(),
      friendClubIds: new Set(),
      sharedClubIds: new Set(),
    };
  }

  const [myPlanned, friendIds, sharedParticipants] = await Promise.all([
    prisma.plannedClub.findMany({
      where: {
        parentProfileId: profile.id,
        status: { not: "CANCELLED" },
      },
      select: { clubId: true },
    }),
    getTrustedFriendIds(profile.id),
    prisma.sharedClubParticipant.findMany({
      where: { parentProfileId: profile.id },
      include: { sharedClub: { select: { clubId: true } } },
    }),
  ]);

  const myClubIds = new Set(myPlanned.map((p) => p.clubId));
  const sharedClubIds = new Set(
    sharedParticipants.map((p) => p.sharedClub.clubId),
  );

  let friendClubIds = new Set<string>();
  if (friendIds.length > 0) {
    const friendPlanned = await prisma.plannedClub.findMany({
      where: { parentProfileId: { in: friendIds } },
      select: { clubId: true, status: true },
    });
    friendClubIds = new Set(
      friendPlanned
        .filter((p) => isVisibleToFriends(p.status))
        .map((p) => p.clubId),
    );
  }

  return { myClubIds, friendClubIds, sharedClubIds };
}

export async function buildMapMarkersForClubs(
  clubs: Array<{
    id: string;
    name: string;
    latitude: number;
    longitude: number;
  }>,
): Promise<ClubMapMarker[]> {
  const context = await getMapMarkerContext();
  return buildClubMapMarkers(clubs, context);
}
