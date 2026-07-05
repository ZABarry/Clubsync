export function resolveClubImageUrl(club: {
  id: string;
  imageUrl?: string | null;
}): string {
  if (club.imageUrl) return club.imageUrl;
  return `https://picsum.photos/seed/${encodeURIComponent(club.id)}/800/450`;
}

export function resolveClubImageFallbackUrl(clubId: string): string {
  return `https://picsum.photos/seed/${encodeURIComponent(clubId)}/800/450`;
}
