import { geocodePostcode } from "@/lib/utils/geocode";

type ClubCoordinates = {
  latitude: number;
  longitude: number;
};

export async function resolveClubCoordinates(
  values: ClubCoordinates,
  postcode: string,
): Promise<ClubCoordinates | { error: string }> {
  const trimmed = postcode.trim();
  if (!trimmed) return values;

  const coords = await geocodePostcode(trimmed);
  if (!coords) {
    return { error: "Could not find that UK postcode" };
  }

  return { latitude: coords.lat, longitude: coords.lng };
}
