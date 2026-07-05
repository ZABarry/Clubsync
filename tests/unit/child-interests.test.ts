import { describe, expect, it } from "vitest";

import {
  clubMatchesInterest,
  interestMatchesActivity,
} from "@/lib/clubs/child-interests";

describe("child interests", () => {
  it("matches exact activity values", () => {
    expect(interestMatchesActivity("football", "football")).toBe(true);
    expect(interestMatchesActivity("arts", "arts")).toBe(true);
  });

  it("matches legacy art interest to arts clubs", () => {
    expect(clubMatchesInterest(["arts", "crafts"], "art")).toBe(true);
  });

  it("matches stem interest to science clubs", () => {
    expect(clubMatchesInterest(["science", "experiments"], "stem")).toBe(true);
    expect(clubMatchesInterest(["stem"], "science")).toBe(true);
  });

  it("matches nature interest to outdoor clubs", () => {
    expect(clubMatchesInterest(["forest school"], "nature")).toBe(true);
  });
});
