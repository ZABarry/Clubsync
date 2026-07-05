import { describe, it, expect } from "vitest";

import { sanitizeSharedClubChild } from "@/lib/privacy/friend-visibility";
import { canJoinSharedClub } from "@/lib/privacy/shared-club-access";

describe("shared club child sanitization", () => {
  it("strips notes from child payloads", () => {
    expect(
      sanitizeSharedClubChild({
        nickname: "Lily",
        age: 9,
        notes: "Medical info that must not leak",
      }),
    ).toEqual({ nickname: "Lily", age: 9 });
  });
});

describe("joinSharedClub access control", () => {
  it("allows creators and existing participants", () => {
    expect(
      canJoinSharedClub({
        isExistingParticipant: true,
        isCreator: false,
        isFriendOfCreator: false,
      }),
    ).toBe(true);
    expect(
      canJoinSharedClub({
        isExistingParticipant: false,
        isCreator: true,
        isFriendOfCreator: false,
      }),
    ).toBe(true);
  });

  it("allows friends of the creator to join", () => {
    expect(
      canJoinSharedClub({
        isExistingParticipant: false,
        isCreator: false,
        isFriendOfCreator: true,
      }),
    ).toBe(true);
  });

  it("blocks strangers from joining", () => {
    expect(
      canJoinSharedClub({
        isExistingParticipant: false,
        isCreator: false,
        isFriendOfCreator: false,
      }),
    ).toBe(false);
  });
});
