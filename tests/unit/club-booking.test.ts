import { describe, it, expect } from "vitest";
import {
  computeTotalPrice,
  enumerateCampDates,
  formatClubCardRates,
  formatClubDetailDailyRate,
  resolveDailyRate,
  uniqueBookedDates,
  validateBookedDates,
} from "@/lib/utils/club-booking";
import { plannedClubSchema } from "@/lib/validation/schemas";

describe("enumerateCampDates", () => {
  it("returns all calendar days inclusive", () => {
    expect(enumerateCampDates("2026-07-06", "2026-07-08")).toEqual([
      "2026-07-06",
      "2026-07-07",
      "2026-07-08",
    ]);
  });

  it("handles month boundaries", () => {
    expect(enumerateCampDates("2026-07-30", "2026-08-02")).toEqual([
      "2026-07-30",
      "2026-07-31",
      "2026-08-01",
      "2026-08-02",
    ]);
  });

  it("returns single day when start equals end", () => {
    expect(enumerateCampDates("2026-07-06", "2026-07-06")).toEqual([
      "2026-07-06",
    ]);
  });
});

describe("validateBookedDates", () => {
  it("accepts empty dates", () => {
    expect(validateBookedDates([], "2026-07-06", "2026-07-10")).toEqual({
      valid: true,
    });
  });

  it("rejects dates outside club range", () => {
    const result = validateBookedDates(
      ["2026-07-05"],
      "2026-07-06",
      "2026-07-10",
    );
    expect(result.valid).toBe(false);
    expect(result.error).toContain("outside");
  });

  it("rejects dates when club dates are missing", () => {
    const result = validateBookedDates(["2026-07-06"], null, null);
    expect(result.valid).toBe(false);
  });

  it("accepts in-range dates", () => {
    expect(
      validateBookedDates(["2026-07-07"], "2026-07-06", "2026-07-10"),
    ).toEqual({ valid: true });
  });
});

describe("resolveDailyRate", () => {
  it("prefers override, then dailyRate only", () => {
    expect(resolveDailyRate({ dailyRate: 60, price: 42 }, 50)).toBe(50);
    expect(resolveDailyRate({ dailyRate: 60, price: 42 })).toBe(60);
    expect(resolveDailyRate({ dailyRate: null, price: 42 })).toBeNull();
    expect(resolveDailyRate({ dailyRate: null, price: null })).toBeNull();
  });
});

describe("formatClubDetailDailyRate", () => {
  it("shows stored daily rate", () => {
    expect(
      formatClubDetailDailyRate({
        dailyRate: 55,
        price: 250,
        priceNote: "£250 per week",
      }),
    ).toEqual({ value: "£55 per day" });
  });

  it("derives daily rate from weekly price note", () => {
    expect(
      formatClubDetailDailyRate({
        dailyRate: null,
        price: 250,
        priceNote: "£250 per week",
      }),
    ).toEqual({
      value: "£50 per day",
      footnote: "£250 per week",
    });
  });
});

describe("formatClubCardRates", () => {
  it("shows day and week rates from headline price", () => {
    expect(
      formatClubCardRates({
        dailyRate: null,
        price: 250,
        priceNote: null,
      }),
    ).toEqual({
      daily: "£50/day",
      weekly: "£250/wk",
    });
  });

  it("shows day and week rates when daily rate is stored", () => {
    expect(
      formatClubCardRates({
        dailyRate: 55,
        price: 55,
        priceNote: "55 per day",
      }),
    ).toEqual({
      daily: "£55/day",
      weekly: "£275/wk",
    });
  });

  it("uses daily rate instead of treating price as weekly", () => {
    expect(
      formatClubCardRates({
        dailyRate: 55,
        price: 55,
        priceNote: "£55 per day; £250 per week; extended hours to 6pm +£10",
      }),
    ).toEqual({
      daily: "£55/day",
      weekly: "£250/wk",
    });
  });
});

describe("computeTotalPrice", () => {
  it("computes daily rate times day count", () => {
    expect(computeTotalPrice(60, 3, null)).toBe(180);
  });

  it("uses total override when provided", () => {
    expect(computeTotalPrice(60, 3, 150)).toBe(150);
  });

  it("returns null when no rate or days", () => {
    expect(computeTotalPrice(null, 3, null)).toBeNull();
    expect(computeTotalPrice(60, 0, null)).toBeNull();
  });
});

describe("uniqueBookedDates", () => {
  it("deduplicates and sorts dates", () => {
    expect(uniqueBookedDates(["2026-07-08", "2026-07-06", "2026-07-08"])).toEqual(
      ["2026-07-06", "2026-07-08"],
    );
  });
});

describe("plannedClubSchema booking fields", () => {
  const base = {
    clubId: "550e8400-e29b-41d4-a716-446655440000",
    status: "PLANNED" as const,
  };

  it("accepts booked dates and pricing overrides", () => {
    const result = plannedClubSchema.parse({
      ...base,
      bookedDates: ["2026-07-06", "2026-07-07"],
      dailyRateOverride: 55,
      totalPriceOverride: 100,
    });
    expect(result.bookedDates).toHaveLength(2);
    expect(result.dailyRateOverride).toBe(55);
    expect(result.totalPriceOverride).toBe(100);
  });

  it("allows omitting booking fields", () => {
    const result = plannedClubSchema.parse(base);
    expect(result.bookedDates).toBeUndefined();
    expect(result.dailyRateOverride).toBeUndefined();
  });

  it("rejects invalid date format", () => {
    expect(() =>
      plannedClubSchema.parse({
        ...base,
        bookedDates: ["06-07-2026"],
      }),
    ).toThrow();
  });
});
