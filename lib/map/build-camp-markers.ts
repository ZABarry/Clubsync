import type { CampMapMarker } from "@/lib/types/camp";

export type MapMarkerContext = {
  myCampIds: Set<string>;
  friendCampIds: Set<string>;
  sharedCampIds: Set<string>;
};

type CampLocation = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
};

export function resolveMarkerVariant(
  campId: string,
  context: MapMarkerContext,
): CampMapMarker["variant"] {
  if (context.sharedCampIds.has(campId)) return "shared";
  if (context.myCampIds.has(campId)) return "mine";
  if (context.friendCampIds.has(campId)) return "friend";
  return "suggested";
}

export function buildCampMapMarkers(
  camps: CampLocation[],
  context: MapMarkerContext,
): CampMapMarker[] {
  return camps.map((camp) => ({
    id: camp.id,
    name: camp.name,
    latitude: camp.latitude,
    longitude: camp.longitude,
    variant: resolveMarkerVariant(camp.id, context),
  }));
}
