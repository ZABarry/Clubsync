import { describe, it, expect } from "vitest";
import { isValidInviteToken } from "@/lib/auth/invite-token";

describe("invite acceptance flow", () => {
  it("accepts well-formed invite tokens used in URLs", () => {
    const token = "c".repeat(64);
    expect(isValidInviteToken(token)).toBe(true);
  });

  it("rejects malformed tokens in invite URLs", () => {
    expect(isValidInviteToken("not-a-valid-token")).toBe(false);
    expect(isValidInviteToken("")).toBe(false);
  });
});
