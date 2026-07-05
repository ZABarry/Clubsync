import { PlannedClubStatus } from "@prisma/client";

const VISIBLE_STATUSES: PlannedClubStatus[] = [
  "INTERESTED",
  "FAVOURITE",
  "PLANNED",
  "BOOKED",
];

export function isVisibleToFriends(status: PlannedClubStatus): boolean {
  return VISIBLE_STATUSES.includes(status);
}

export type FriendClubActivity = {
  clubId: string;
  clubName: string;
  startDate: Date | null;
  endDate: Date | null;
  status: PlannedClubStatus;
  parentDisplayName: string;
  childNickname: string | null;
  childAge: number | null;
};

export function sanitizeFriendActivity(
  rows: Array<{
    status: PlannedClubStatus;
    parent: { displayName: string };
    child: { nickname: string; age: number } | null;
    club: { id: string; name: string; startDate: Date | null; endDate: Date | null };
  }>,
): FriendClubActivity[] {
  return rows
    .filter((r) => isVisibleToFriends(r.status))
    .map((r) => ({
      clubId: r.club.id,
      clubName: r.club.name,
      startDate: r.club.startDate,
      endDate: r.club.endDate,
      status: r.status,
      parentDisplayName: r.parent.displayName,
      childNickname: r.child?.nickname ?? null,
      childAge: r.child?.age ?? null,
    }));
}

export function sanitizeSharedClubChild(child: {
  nickname: string;
  age: number;
  notes?: string | null;
}) {
  return { nickname: child.nickname, age: child.age };
}
