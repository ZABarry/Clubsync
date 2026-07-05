export function normalizeUkPostcode(postcode: string): string {
  return postcode.trim().replace(/\s+/g, " ").toUpperCase();
}

export async function geocodePostcode(
  postcode: string,
): Promise<{ lat: number; lng: number } | null> {
  const normalized = normalizeUkPostcode(postcode);
  if (normalized.length < 5) return null;

  try {
    const res = await fetch(
      `https://api.postcodes.io/postcodes/${encodeURIComponent(normalized)}`,
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (data.status !== 200) return null;
    return { lat: data.result.latitude, lng: data.result.longitude };
  } catch {
    return null;
  }
}
