import { describe, it, expect } from "vitest";
import { scoreCamps } from "@/lib/recommendations/score-camps";

describe("scoreCamps", () => {
  const baseCamp = {
    id: "camp-1",
    name: "Football Camp",
    ageMin: 6,
    ageMax: 12,
    activities: ["football"],
    startDate: new Date("2026-07-07"),
    endDate: new Date("2026-07-11"),
    latitude: 51.401,
    longitude: -0.256,
    ratingAverage: 4.5,
    ratingCount: 10,
    price: 180,
  };

  it("scores higher when age fits and interests match", () => {
    const scored = scoreCamps([baseCamp], {
      child: {
        age: 9,
        interests: ["football"],
        availabilityStart: new Date("2026-07-01"),
        availabilityEnd: new Date("2026-08-31"),
      },
      parent: { lat: 51.401, lng: -0.256, radiusKm: 10 },
      trustedFriendPlannedCampIds: new Map(),
    });

    expect(scored[0].recommendationScore).toBeGreaterThan(50);
    expect(scored[0].recommendationReasons).toContain("Matches age range");
    expect(scored[0].recommendationReasons).toContain("football interest match");
  });

  it("adds friend overlap reasons", () => {
    const scored = scoreCamps([baseCamp], {
      child: { age: 9, interests: [], availabilityStart: null, availabilityEnd: null },
      parent: { lat: 51.401, lng: -0.256, radiusKm: 10 },
      trustedFriendPlannedCampIds: new Map([["camp-1", 2]]),
    });

    expect(scored[0].recommendationReasons.some((r) => r.includes("trusted parent"))).toBe(true);
  });
});
