import type { ChildProfile } from "@prisma/client";

/** Fields safe to send to the client for list/card views. */
export type ChildSummary = {
  id: string;
  nickname: string;
  age: number;
  sex: ChildProfile["sex"];
  schoolYear: string | null;
  interests: string[];
};

/** Full child record for the owner edit form only. */
export type ChildEditData = ChildSummary & {
  availabilityStart: Date | null;
  availabilityEnd: Date | null;
  notes: string | null;
};

export function toChildSummary(child: ChildProfile): ChildSummary {
  return {
    id: child.id,
    nickname: child.nickname,
    age: child.age,
    sex: child.sex,
    schoolYear: child.schoolYear,
    interests: child.interests,
  };
}

export function toChildEditData(child: ChildProfile): ChildEditData {
  return {
    ...toChildSummary(child),
    availabilityStart: child.availabilityStart,
    availabilityEnd: child.availabilityEnd,
    notes: child.notes,
  };
}
