import { PlannedCampStatus } from "@prisma/client";

const VISIBLE_STATUSES: PlannedCampStatus[] = [
  "INTERESTED",
  "FAVOURITE",
  "PLANNED",
  "BOOKED",
  "PAID",
];

export function isVisibleToFriends(status: PlannedCampStatus): boolean {
  return VISIBLE_STATUSES.includes(status);
}

export type FriendCampActivity = {
  campId: string;
  campName: string;
  startDate: Date | null;
  endDate: Date | null;
  status: PlannedCampStatus;
  parentDisplayName: string;
  childNickname: string | null;
  childAge: number | null;
};

export function sanitizeFriendActivity(
  rows: Array<{
    status: PlannedCampStatus;
    parent: { displayName: string };
    child: { nickname: string; age: number } | null;
    camp: { id: string; name: string; startDate: Date | null; endDate: Date | null };
  }>,
): FriendCampActivity[] {
  return rows
    .filter((r) => isVisibleToFriends(r.status))
    .map((r) => ({
      campId: r.camp.id,
      campName: r.camp.name,
      startDate: r.camp.startDate,
      endDate: r.camp.endDate,
      status: r.status,
      parentDisplayName: r.parent.displayName,
      childNickname: r.child?.nickname ?? null,
      childAge: r.child?.age ?? null,
    }));
}

export function sanitizeSharedCampChild(child: {
  nickname: string;
  age: number;
  notes?: string | null;
}) {
  return { nickname: child.nickname, age: child.age };
}
