"use client";

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { ClubCalendar } from "@/components/calendar/club-calendar";
import { ClubCard } from "@/components/club/club-card";
import { ClubFilters } from "@/components/club/club-filters";
import { ClubMap } from "@/components/map/club-map";
import { MapLegend } from "@/components/map/map-legend";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type {
  ClubCalendarEvent,
  ClubCardData,
  ClubFilterValues,
  ClubMapMarker,
  MapBounds,
} from "@/lib/types/club";
import { useDiscoverStore } from "@/lib/stores/discover-store";

type DiscoverViewProps = {
  clubs: ClubCardData[];
  calendarEvents: ClubCalendarEvent[];
  mapMarkers: ClubMapMarker[];
  defaultFilters: ClubFilterValues;
};

function boundsFromFilters(filters: ClubFilterValues): MapBounds | null {
  if (
    filters.minLat == null ||
    filters.maxLat == null ||
    filters.minLng == null ||
    filters.maxLng == null
  ) {
    return null;
  }

  return {
    minLat: filters.minLat,
    maxLat: filters.maxLat,
    minLng: filters.minLng,
    maxLng: filters.maxLng,
  };
}

export function DiscoverView({
  clubs,
  calendarEvents,
  mapMarkers,
  defaultFilters,
}: DiscoverViewProps) {
  const router = useRouter();
  const setFilters = useDiscoverStore((s) => s.setFilters);
  const [mapBounds, setMapBounds] = useState<MapBounds | null>(
    boundsFromFilters(defaultFilters),
  );
  const [mapSearch, setMapSearch] = useState(defaultFilters.search ?? "");
  const activeBounds = boundsFromFilters(defaultFilters);

  useEffect(() => {
    setFilters(defaultFilters);
    setMapSearch(defaultFilters.search ?? "");
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

  const searchMapArea = useCallback(() => {
    if (!mapBounds) return;

    applyFilters({
      ...defaultFilters,
      search: mapSearch.trim() || undefined,
      minLat: mapBounds.minLat,
      maxLat: mapBounds.maxLat,
      minLng: mapBounds.minLng,
      maxLng: mapBounds.maxLng,
      maxDistanceKm: undefined,
    });
  }, [applyFilters, defaultFilters, mapBounds, mapSearch]);

  const clearMapBounds = useCallback(() => {
    applyFilters({
      ...defaultFilters,
      minLat: undefined,
      maxLat: undefined,
      minLng: undefined,
      maxLng: undefined,
    });
  }, [applyFilters, defaultFilters]);

  const mapFitBounds = useMemo(
    () => activeBounds,
    [
      defaultFilters.minLat,
      defaultFilters.maxLat,
      defaultFilters.minLng,
      defaultFilters.maxLng,
    ],
  );

  const handleBoundsChange = useCallback((bounds: MapBounds) => {
    setMapBounds((current) => {
      const nextKey = [
        bounds.minLat.toFixed(5),
        bounds.maxLat.toFixed(5),
        bounds.minLng.toFixed(5),
        bounds.maxLng.toFixed(5),
      ].join("|");
      const currentKey =
        current == null
          ? null
          : [
              current.minLat.toFixed(5),
              current.maxLat.toFixed(5),
              current.minLng.toFixed(5),
              current.maxLng.toFixed(5),
            ].join("|");
      if (nextKey === currentKey) return current;
      return bounds;
    });
  }, []);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-medium">Map</h2>
          <MapLegend />
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative min-w-0 flex-1">
            <Search className="text-muted-foreground absolute top-2.5 left-2.5 size-4" />
            <Input
              value={mapSearch}
              onChange={(e) => setMapSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") searchMapArea();
              }}
              placeholder="Search clubs in map view…"
              className="pl-8"
            />
          </div>
          <Button
            type="button"
            className="shrink-0 sm:w-auto"
            onClick={searchMapArea}
            disabled={!mapBounds}
          >
            Search area
          </Button>
        </div>

        <div className="relative">
          <ClubMap
            markers={mapMarkers}
            fitBounds={mapFitBounds}
            className="h-56 sm:h-80"
            showLocateControl
            onBoundsChange={handleBoundsChange}
            onMarkerClick={(marker) => router.push(`/clubs/${marker.id}`)}
          />
        </div>

        {activeBounds ? (
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <p className="text-muted-foreground">
              Showing clubs in the visible map area
              {defaultFilters.search ? ` matching “${defaultFilters.search}”` : ""}
            </p>
            <Button type="button" variant="ghost" size="sm" onClick={clearMapBounds}>
              Clear map area
            </Button>
          </div>
        ) : (
          <p className="text-muted-foreground text-xs">
            Pan the map, then search to find clubs in the visible area.
          </p>
        )}
      </div>

      <ClubFilters
        defaultValues={defaultFilters}
        collapsible
        onSubmit={(values) =>
          applyFilters({
            ...values,
            minLat: activeBounds?.minLat,
            maxLat: activeBounds?.maxLat,
            minLng: activeBounds?.minLng,
            maxLng: activeBounds?.maxLng,
            maxDistanceKm: activeBounds ? undefined : values.maxDistanceKm,
          })
        }
      />

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
          No clubs match your filters. Try adjusting your search or map area.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {clubs.map((club) => (
            <ClubCard
              key={club.id}
              club={club}
              detailHref={`/clubs/${club.id}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
