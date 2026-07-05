"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect } from "react";

import { ClubCalendar } from "@/components/calendar/club-calendar";
import { ClubCard } from "@/components/club/club-card";
import { ClubFilters } from "@/components/club/club-filters";
import { ClubMap } from "@/components/map/club-map";
import { MapLegend } from "@/components/map/map-legend";
import type {
  ClubCalendarEvent,
  ClubCardData,
  ClubFilterValues,
  ClubMapMarker,
} from "@/lib/types/club";
import { useDiscoverStore } from "@/lib/stores/discover-store";

type DiscoverViewProps = {
  clubs: ClubCardData[];
  calendarEvents: ClubCalendarEvent[];
  mapMarkers: ClubMapMarker[];
  defaultFilters: ClubFilterValues;
};

export function DiscoverView({
  clubs,
  calendarEvents,
  mapMarkers,
  defaultFilters,
}: DiscoverViewProps) {
  const router = useRouter();
  const setFilters = useDiscoverStore((s) => s.setFilters);

  useEffect(() => {
    setFilters(defaultFilters);
  }, [defaultFilters, setFilters]);

  const applyFilters = useCallback(
    (values: ClubFilterValues) => {
      setFilters(values);
      const params = new URLSearchParams();
      for (const [key, value] of Object.entries(values)) {
        if (value == null || value === "" || value === false) continue;
        params.set(key, String(value));
      }
      const qs = params.toString();
      router.push(qs ? `/discover?${qs}` : "/discover");
    },
    [router, setFilters],
  );

  const handleFilterChange = useCallback(
    (values: ClubFilterValues) => {
      setFilters(values);
    },
    [setFilters],
  );

  return (
    <div className="space-y-6">
      <ClubFilters
        defaultValues={defaultFilters}
        onChange={handleFilterChange}
        onSubmit={applyFilters}
        className="sticky top-0 z-10"
      />

      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-medium">Map</h2>
          <MapLegend />
        </div>
        <ClubMap
          markers={mapMarkers}
          className="h-56 sm:h-72"
          showLocateControl
          onMarkerClick={(marker) => router.push(`/clubs/${marker.id}`)}
        />
      </div>

      {calendarEvents.length > 0 ? (
        <div className="space-y-2">
          <h2 className="text-sm font-medium">Calendar preview</h2>
          <ClubCalendar
            events={calendarEvents}
            onEventClick={(event) => {
              if (event.clubId) router.push(`/clubs/${event.clubId}`);
            }}
          />
        </div>
      ) : null}

      {clubs.length === 0 ? (
        <div className="text-muted-foreground rounded-xl border bg-card py-12 text-center text-sm">
          No clubs match your filters. Try adjusting your search.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {clubs.map((club) => (
            <Link key={club.id} href={`/clubs/${club.id}`}>
              <ClubCard club={club} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
