import type { ClubMapMarker } from "@/lib/types/club";

export type MapMarkerContext = {
  myClubIds: Set<string>;
  friendClubIds: Set<string>;
  sharedClubIds: Set<string>;
};

type ClubLocation = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
};

export function resolveMarkerVariant(
  clubId: string,
  context: MapMarkerContext,
): ClubMapMarker["variant"] {
  if (context.sharedClubIds.has(clubId)) return "shared";
  if (context.myClubIds.has(clubId)) return "mine";
  if (context.friendClubIds.has(clubId)) return "friend";
  return "suggested";
}

export function buildClubMapMarkers(
  clubs: ClubLocation[],
  context: MapMarkerContext,
): ClubMapMarker[] {
  return clubs.map((club) => ({
    id: club.id,
    name: club.name,
    latitude: club.latitude,
    longitude: club.longitude,
    variant: resolveMarkerVariant(club.id, context),
  }));
}
