import { describe, expect, it } from "vitest";

import {
  buildClubMapMarkers,
  resolveMarkerVariant,
} from "@/lib/map/build-club-markers";

describe("buildClubMapMarkers", () => {
  const clubs = [
    {
      id: "club-a",
      name: "Club A",
      latitude: 51.4,
      longitude: -0.25,
    },
    {
      id: "club-b",
      name: "Club B",
      latitude: 51.41,
      longitude: -0.24,
    },
    {
      id: "club-c",
      name: "Club C",
      latitude: 51.42,
      longitude: -0.23,
    },
    {
      id: "club-d",
      name: "Club D",
      latitude: 51.43,
      longitude: -0.22,
    },
  ];

  it("prioritises shared over mine, friend, and suggested", () => {
    const context = {
      myClubIds: new Set(["club-a", "club-b"]),
      friendClubIds: new Set(["club-b", "club-c"]),
      sharedClubIds: new Set(["club-a"]),
    };

    expect(resolveMarkerVariant("club-a", context)).toBe("shared");
    expect(resolveMarkerVariant("club-b", context)).toBe("mine");
    expect(resolveMarkerVariant("club-c", context)).toBe("friend");
    expect(resolveMarkerVariant("club-d", context)).toBe("suggested");
  });

  it("builds markers with resolved variants", () => {
    const markers = buildClubMapMarkers(clubs, {
      myClubIds: new Set(["club-b"]),
      friendClubIds: new Set(["club-c"]),
      sharedClubIds: new Set(),
    });

    expect(markers).toHaveLength(4);
    expect(markers.find((m) => m.id === "club-b")?.variant).toBe("mine");
    expect(markers.find((m) => m.id === "club-c")?.variant).toBe("friend");
    expect(markers.find((m) => m.id === "club-a")?.variant).toBe("suggested");
  });
});
