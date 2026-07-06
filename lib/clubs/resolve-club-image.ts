export function resolveClubImageUrl(club: {
  id: string;
  imageUrl?: string | null;
}): string {
  const url = club.imageUrl?.trim();
  if (url) return url;
  return resolveClubImageFallbackUrl(club.id);
}

export function resolveClubImageFallbackUrl(clubId: string): string {
  return `https://picsum.photos/seed/${encodeURIComponent(clubId)}/800/450`;
}
