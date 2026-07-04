import { describe, it, expect } from "vitest";
import { generateInviteToken, isValidInviteToken } from "@/lib/auth/invite-token";

describe("invite tokens", () => {
  it("generates valid 64-char hex tokens", () => {
    const token = generateInviteToken();
    expect(token).toHaveLength(64);
    expect(isValidInviteToken(token)).toBe(true);
  });

  it("rejects invalid tokens", () => {
    expect(isValidInviteToken("short")).toBe(false);
    expect(isValidInviteToken("g".repeat(64))).toBe(false);
  });
});
