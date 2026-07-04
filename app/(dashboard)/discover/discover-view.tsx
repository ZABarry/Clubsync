"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect } from "react";

import { CampCalendar } from "@/components/calendar/camp-calendar";
import { CampCard } from "@/components/camp/camp-card";
import { CampFilters } from "@/components/camp/camp-filters";
import { CampMap } from "@/components/map/camp-map";
import { MapLegend } from "@/components/map/map-legend";
import type {
  CampCalendarEvent,
  CampCardData,
  CampFilterValues,
  CampMapMarker,
} from "@/lib/types/camp";
import { useDiscoverStore } from "@/lib/stores/discover-store";

type DiscoverViewProps = {
  camps: CampCardData[];
  calendarEvents: CampCalendarEvent[];
  mapMarkers: CampMapMarker[];
  defaultFilters: CampFilterValues;
};

export function DiscoverView({
  camps,
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
    (values: CampFilterValues) => {
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
    (values: CampFilterValues) => {
      setFilters(values);
    },
    [setFilters],
  );

  return (
    <div className="space-y-6">
      <CampFilters
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
        <CampMap
          markers={mapMarkers}
          className="h-56 sm:h-72"
          onMarkerClick={(marker) => router.push(`/camps/${marker.id}`)}
        />
      </div>

      {calendarEvents.length > 0 ? (
        <div className="space-y-2">
          <h2 className="text-sm font-medium">Calendar preview</h2>
          <CampCalendar
            events={calendarEvents}
            onEventClick={(event) => {
              if (event.campId) router.push(`/camps/${event.campId}`);
            }}
          />
        </div>
      ) : null}

      {camps.length === 0 ? (
        <div className="text-muted-foreground rounded-xl border bg-card py-12 text-center text-sm">
          No camps match your filters. Try adjusting your search.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {camps.map((camp) => (
            <Link key={camp.id} href={`/camps/${camp.id}`}>
              <CampCard camp={camp} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
