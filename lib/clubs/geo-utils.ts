export const NEW_MALDON_ORIGIN = {
  lat: 51.401,
  lon: -0.256,
  label: "New Malden KT3 3HL",
  postcode: "KT3 3HL",
} as const;

export const MAX_RADIUS_KM = 30;

export function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function distanceFromNewMaldenKm(lat: number, lon: number): number {
  return haversineKm(NEW_MALDON_ORIGIN.lat, NEW_MALDON_ORIGIN.lon, lat, lon);
}

export function isWithinRadius(lat: number, lon: number, maxKm = MAX_RADIUS_KM): boolean {
  return distanceFromNewMaldenKm(lat, lon) <= maxKm;
}

export async function geocodePostcode(
  postcode: string,
): Promise<{ lat: number; lon: number } | null> {
  const normalized = postcode.trim().replace(/\s+/g, " ").toUpperCase();
  if (normalized.length < 5) return null;

  try {
    const res = await fetch(
      `https://api.postcodes.io/postcodes/${encodeURIComponent(normalized)}`,
    );
    if (!res.ok) return null;
    const data = (await res.json()) as {
      status: number;
      result?: { latitude: number; longitude: number };
    };
    if (data.status !== 200 || !data.result) return null;
    return { lat: data.result.latitude, lon: data.result.longitude };
  } catch {
    return null;
  }
}

export function extractUkPostcode(text: string): string | null {
  const match = text.match(/\b([A-Z]{1,2}\d{1,2}[A-Z]?\s*\d[A-Z]{2})\b/i);
  return match ? match[1].replace(/\s+/g, " ").toUpperCase() : null;
}
