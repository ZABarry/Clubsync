import { describe, it, expect } from "vitest";
import {
  parentProfileSchema,
  childProfileSchema,
  plannedClubSchema,
  clubFilterSchema,
} from "@/lib/validation/schemas";

describe("parentProfileSchema", () => {
  it("accepts valid profile data", () => {
    const result = parentProfileSchema.parse({
      displayName: "Sarah M.",
      homePostcode: "KT3 4AA",
      defaultSearchRadiusKm: 10,
    });
    expect(result.displayName).toBe("Sarah M.");
    expect(result.defaultSearchRadiusKm).toBe(10);
  });

  it("defaults search radius to 10km", () => {
    const result = parentProfileSchema.parse({ displayName: "James T." });
    expect(result.defaultSearchRadiusKm).toBe(10);
  });

  it("rejects display name that is too short", () => {
    expect(() =>
      parentProfileSchema.parse({ displayName: "A" }),
    ).toThrow();
  });

  it("rejects search radius outside 1–50km", () => {
    expect(() =>
      parentProfileSchema.parse({
        displayName: "Sarah M.",
        defaultSearchRadiusKm: 0,
      }),
    ).toThrow();
    expect(() =>
      parentProfileSchema.parse({
        displayName: "Sarah M.",
        defaultSearchRadiusKm: 51,
      }),
    ).toThrow();
  });

  it("rejects postcode that is too short", () => {
    expect(() =>
      parentProfileSchema.parse({
        displayName: "Sarah M.",
        homePostcode: "KT",
      }),
    ).toThrow();
  });
});

describe("childProfileSchema", () => {
  it("accepts valid child data", () => {
    const result = childProfileSchema.parse({
      nickname: "Lily",
      age: 9,
      interests: ["football", "swimming"],
    });
    expect(result.nickname).toBe("Lily");
    expect(result.age).toBe(9);
    expect(result.interests).toEqual(["football", "swimming"]);
  });

  it("requires a nickname", () => {
    expect(() => childProfileSchema.parse({ nickname: "", age: 9 })).toThrow();
  });

  it("rejects age below 3 or above 18", () => {
    expect(() =>
      childProfileSchema.parse({ nickname: "Max", age: 2 }),
    ).toThrow();
    expect(() =>
      childProfileSchema.parse({ nickname: "Max", age: 19 }),
    ).toThrow();
  });

  it("coerces string age to number", () => {
    const result = childProfileSchema.parse({ nickname: "Lily", age: "9" });
    expect(result.age).toBe(9);
  });
});

describe("plannedClubSchema", () => {
  const validClubId = "00000000-0000-4000-8000-000000000001";

  it("accepts valid planned club data", () => {
    const result = plannedClubSchema.parse({
      clubId: validClubId,
      status: "INTERESTED",
    });
    expect(result.clubId).toBe(validClubId);
    expect(result.status).toBe("INTERESTED");
  });

  it("accepts all valid status values", () => {
    for (const status of [
      "SUGGESTED",
      "INTERESTED",
      "FAVOURITE",
      "PLANNED",
      "BOOKED",
      "PAID",
      "CANCELLED",
    ]) {
      const result = plannedClubSchema.parse({
        clubId: validClubId,
        status,
      });
      expect(result.status).toBe(status);
    }
  });

  it("rejects invalid club id", () => {
    expect(() =>
      plannedClubSchema.parse({ clubId: "not-a-uuid", status: "PLANNED" }),
    ).toThrow();
  });

  it("rejects invalid status", () => {
    expect(() =>
      plannedClubSchema.parse({ clubId: validClubId, status: "MAYBE" }),
    ).toThrow();
  });
});

describe("clubFilterSchema", () => {
  it("accepts empty filters", () => {
    const result = clubFilterSchema.parse({});
    expect(result).toEqual({});
  });

  it("coerces numeric filters from strings", () => {
    const result = clubFilterSchema.parse({
      age: "9",
      maxPrice: "200",
      minRating: "4",
      maxDistanceKm: "10",
    });
    expect(result.age).toBe(9);
    expect(result.maxPrice).toBe(200);
    expect(result.minRating).toBe(4);
    expect(result.maxDistanceKm).toBe(10);
  });

  it("coerces boolean filters", () => {
    const fromBooleans = clubFilterSchema.parse({
      friendsOnly: true,
      indoor: false,
      outdoor: true,
    });
    expect(fromBooleans.friendsOnly).toBe(true);
    expect(fromBooleans.indoor).toBe(false);
    expect(fromBooleans.outdoor).toBe(true);

    // z.coerce.boolean treats non-empty strings as true
    const fromTruthyString = clubFilterSchema.parse({ friendsOnly: "true" });
    expect(fromTruthyString.friendsOnly).toBe(true);
  });

  it("preserves optional search and activity strings", () => {
    const result = clubFilterSchema.parse({
      search: "football",
      activity: "tennis",
      startDate: "2026-07-01",
      endDate: "2026-08-31",
    });
    expect(result.search).toBe("football");
    expect(result.activity).toBe("tennis");
    expect(result.startDate).toBe("2026-07-01");
    expect(result.endDate).toBe("2026-08-31");
  });
});
