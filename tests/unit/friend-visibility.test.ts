import { describe, it, expect } from "vitest";
import { isVisibleToFriends, sanitizeFriendActivity } from "@/lib/privacy/friend-visibility";

describe("friend visibility", () => {
  it("hides cancelled clubs from friends", () => {
    expect(isVisibleToFriends("CANCELLED")).toBe(false);
    expect(isVisibleToFriends("PLANNED")).toBe(true);
  });

  it("sanitizes friend activity without private notes", () => {
    const result = sanitizeFriendActivity([
      {
        status: "PLANNED",
        parent: { displayName: "Sarah" },
        child: { nickname: "Lily", age: 9 },
        club: {
          id: "1",
          name: "Football Club",
          startDate: new Date("2026-07-07"),
          endDate: new Date("2026-07-11"),
        },
      },
      {
        status: "CANCELLED",
        parent: { displayName: "James" },
        child: null,
        club: {
          id: "2",
          name: "Tennis Club",
          startDate: new Date("2026-07-14"),
          endDate: new Date("2026-07-18"),
        },
      },
    ]);

    expect(result).toHaveLength(1);
    expect(result[0].childNickname).toBe("Lily");
    expect(result[0].parentDisplayName).toBe("Sarah");
  });
});
