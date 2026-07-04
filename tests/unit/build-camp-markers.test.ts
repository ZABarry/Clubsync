import { describe, expect, it } from "vitest";

import {
  buildCampMapMarkers,
  resolveMarkerVariant,
} from "@/lib/map/build-camp-markers";

describe("buildCampMapMarkers", () => {
  const camps = [
    {
      id: "camp-a",
      name: "Camp A",
      latitude: 51.4,
      longitude: -0.25,
    },
    {
      id: "camp-b",
      name: "Camp B",
      latitude: 51.41,
      longitude: -0.24,
    },
    {
      id: "camp-c",
      name: "Camp C",
      latitude: 51.42,
      longitude: -0.23,
    },
    {
      id: "camp-d",
      name: "Camp D",
      latitude: 51.43,
      longitude: -0.22,
    },
  ];

  it("prioritises shared over mine, friend, and suggested", () => {
    const context = {
      myCampIds: new Set(["camp-a", "camp-b"]),
      friendCampIds: new Set(["camp-b", "camp-c"]),
      sharedCampIds: new Set(["camp-a"]),
    };

    expect(resolveMarkerVariant("camp-a", context)).toBe("shared");
    expect(resolveMarkerVariant("camp-b", context)).toBe("mine");
    expect(resolveMarkerVariant("camp-c", context)).toBe("friend");
    expect(resolveMarkerVariant("camp-d", context)).toBe("suggested");
  });

  it("builds markers with resolved variants", () => {
    const markers = buildCampMapMarkers(camps, {
      myCampIds: new Set(["camp-b"]),
      friendCampIds: new Set(["camp-c"]),
      sharedCampIds: new Set(),
    });

    expect(markers).toHaveLength(4);
    expect(markers.find((m) => m.id === "camp-b")?.variant).toBe("mine");
    expect(markers.find((m) => m.id === "camp-c")?.variant).toBe("friend");
    expect(markers.find((m) => m.id === "camp-a")?.variant).toBe("suggested");
  });
});
