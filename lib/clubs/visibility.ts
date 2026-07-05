import type { Prisma } from "@prisma/client";

/** Clubs visible on discover, search, and recommendations. */
export const publicClubVisibilityFilter: Prisma.ClubWhereInput = {
  OR: [
    { promotionStatus: "OFFICIAL" },
    {
      ownerParentProfileId: { not: null },
      promotionStatus: { in: ["LOCAL", "DENIED"] },
    },
  ],
};

export function activePublicClubWhere(
  extra?: Prisma.ClubWhereInput,
): Prisma.ClubWhereInput {
  return {
    status: "ACTIVE",
    AND: extra ? [publicClubVisibilityFilter, extra] : [publicClubVisibilityFilter],
  };
}
