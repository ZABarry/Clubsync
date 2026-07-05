import { describe, expect, it } from "vitest";

import { parseClubPrice } from "@/lib/clubs/parse-club-price";

describe("parseClubPrice", () => {
  it("parses daily rates", () => {
    expect(parseClubPrice("58 per day")).toEqual({
      price: 58,
      dailyRate: 58,
      priceNote: "58 per day",
    });
  });

  it("parses weekly rates without dailyRate", () => {
    expect(parseClubPrice("£190 weekly block (Mon–Fri)")).toEqual({
      price: 190,
      dailyRate: null,
      priceNote: "£190 weekly block (Mon–Fri)",
    });
  });

  it("does not treat ambiguous amounts as daily", () => {
    expect(parseClubPrice("From £195")).toEqual({
      price: 195,
      dailyRate: null,
      priceNote: "From £195",
    });
  });
});
