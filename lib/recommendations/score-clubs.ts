import { haversineKm } from "@/lib/utils";

export type RecommendationClub = {
  id: string;
  name: string;
  ageMin: number;
  ageMax: number;
  activities: string[];
  startDate: Date | null;
  endDate: Date | null;
  latitude: number;
  longitude: number;
  ratingAverage: number;
  ratingCount: number;
  price: number | null;
};

export type RecommendationInput = {
  child: {
    age: number;
    interests: string[];
    availabilityStart: Date | null;
    availabilityEnd: Date | null;
  };
  parent: { lat: number; lng: number; radiusKm: number };
  trustedFriendPlannedClubIds: Map<string, number>;
  budget?: number;
};

export type ScoredClub = RecommendationClub & {
  recommendationScore: number;
  recommendationReasons: string[];
  distanceKm: number;
};

const WEIGHTS = {
  ageFit: 25,
  interestEach: 20,
  interestCap: 40,
  dateOverlap: 20,
  withinRadius: 15,
  friendEach: 10,
  friendCap: 30,
  ratingMax: 15,
};

function datesOverlap(
  clubStart: Date | null,
  clubEnd: Date | null,
  availStart: Date | null,
  availEnd: Date | null,
): boolean {
  if (!clubStart || !clubEnd) return true;
  if (!availStart || !availEnd) return true;
  return clubStart <= availEnd && clubEnd >= availStart;
}

export function scoreClubs(
  clubs: RecommendationClub[],
  input: RecommendationInput,
): ScoredClub[] {
  return clubs
    .map((club) => {
      let score = 0;
      const reasons: string[] = [];
      const distanceKm = haversineKm(
        input.parent.lat,
        input.parent.lng,
        club.latitude,
        club.longitude,
      );

      if (
        input.child.age >= club.ageMin &&
        input.child.age <= club.ageMax
      ) {
        score += WEIGHTS.ageFit;
        reasons.push("Matches age range");
      }

      let interestScore = 0;
      for (const interest of input.child.interests) {
        const match = club.activities.some(
          (a) => a.toLowerCase() === interest.toLowerCase(),
        );
        if (match) {
          interestScore += WEIGHTS.interestEach;
          reasons.push(`${interest} interest match`);
        }
      }
      score += Math.min(interestScore, WEIGHTS.interestCap);

      if (
        datesOverlap(
          club.startDate,
          club.endDate,
          input.child.availabilityStart,
          input.child.availabilityEnd,
        )
      ) {
        score += WEIGHTS.dateOverlap;
        reasons.push("Dates fit availability");
      }

      if (distanceKm <= input.parent.radiusKm) {
        score += WEIGHTS.withinRadius;
        reasons.push(`Within ${Math.round(distanceKm)}km`);
      }

      const friendCount =
        input.trustedFriendPlannedClubIds.get(club.id) ?? 0;
      if (friendCount > 0) {
        const friendScore = Math.min(
          friendCount * WEIGHTS.friendEach,
          WEIGHTS.friendCap,
        );
        score += friendScore;
        reasons.push(
          `${friendCount} trusted parent${friendCount > 1 ? "s" : ""} interested`,
        );
      }

      if (club.ratingCount >= 3 && club.ratingAverage >= 4) {
        const ratingBonus = Math.round(
          (club.ratingAverage / 5) * WEIGHTS.ratingMax,
        );
        score += ratingBonus;
        reasons.push("Highly rated");
      }

      if (input.budget && club.price && club.price <= input.budget) {
        score += 5;
        reasons.push("Within budget");
      }

      // Distance tie-breaker (closer is slightly better)
      score += Math.max(0, 5 - distanceKm / 2);

      return {
        ...club,
        recommendationScore: Math.round(score * 10) / 10,
        recommendationReasons: reasons,
        distanceKm: Math.round(distanceKm * 10) / 10,
      };
    })
    .sort((a, b) => b.recommendationScore - a.recommendationScore);
}
