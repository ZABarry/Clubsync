import { haversineKm } from "@/lib/utils";

export type RecommendationCamp = {
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
  trustedFriendPlannedCampIds: Map<string, number>;
  budget?: number;
};

export type ScoredCamp = RecommendationCamp & {
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
  campStart: Date | null,
  campEnd: Date | null,
  availStart: Date | null,
  availEnd: Date | null,
): boolean {
  if (!campStart || !campEnd) return true;
  if (!availStart || !availEnd) return true;
  return campStart <= availEnd && campEnd >= availStart;
}

export function scoreCamps(
  camps: RecommendationCamp[],
  input: RecommendationInput,
): ScoredCamp[] {
  return camps
    .map((camp) => {
      let score = 0;
      const reasons: string[] = [];
      const distanceKm = haversineKm(
        input.parent.lat,
        input.parent.lng,
        camp.latitude,
        camp.longitude,
      );

      if (
        input.child.age >= camp.ageMin &&
        input.child.age <= camp.ageMax
      ) {
        score += WEIGHTS.ageFit;
        reasons.push("Matches age range");
      }

      let interestScore = 0;
      for (const interest of input.child.interests) {
        const match = camp.activities.some(
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
          camp.startDate,
          camp.endDate,
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
        input.trustedFriendPlannedCampIds.get(camp.id) ?? 0;
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

      if (camp.ratingCount >= 3 && camp.ratingAverage >= 4) {
        const ratingBonus = Math.round(
          (camp.ratingAverage / 5) * WEIGHTS.ratingMax,
        );
        score += ratingBonus;
        reasons.push("Highly rated");
      }

      if (input.budget && camp.price && camp.price <= input.budget) {
        score += 5;
        reasons.push("Within budget");
      }

      // Distance tie-breaker (closer is slightly better)
      score += Math.max(0, 5 - distanceKm / 2);

      return {
        ...camp,
        recommendationScore: Math.round(score * 10) / 10,
        recommendationReasons: reasons,
        distanceKm: Math.round(distanceKm * 10) / 10,
      };
    })
    .sort((a, b) => b.recommendationScore - a.recommendationScore);
}
