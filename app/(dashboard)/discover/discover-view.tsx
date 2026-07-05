"use client";

import { ChevronDown, Search, SlidersHorizontal } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { ClubCalendar } from "@/components/calendar/club-calendar";
import { ClubCard } from "@/components/club/club-card";
import { ClubFilters, countActiveFilters } from "@/components/club/club-filters";
import { ClubMap } from "@/components/map/club-map";
import { MapLegend } from "@/components/map/map-legend";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type {
  ClubCalendarEvent,
  ClubCardData,
  ClubFilterValues,
  ClubMapMarker,
  MapBounds,
} from "@/lib/types/club";
import { useDiscoverStore } from "@/lib/stores/discover-store";
import { cn } from "@/lib/utils";

const DISCOVER_FILTERS_FORM_ID = "discover-club-filters";

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
  const [search, setSearch] = useState(defaultFilters.search ?? "");
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const activeBounds = boundsFromFilters(defaultFilters);
  const activeFilterCount = countActiveFilters(defaultFilters, {
    excludeSearch: true,
  });

  useEffect(() => {
    setFilters(defaultFilters);
    setSearch(defaultFilters.search ?? "");
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

  const mergeWithMapContext = useCallback(
    (values: ClubFilterValues): ClubFilterValues => ({
      ...values,
      search: search.trim() || undefined,
      minLat: activeBounds?.minLat,
      maxLat: activeBounds?.maxLat,
      minLng: activeBounds?.minLng,
      maxLng: activeBounds?.maxLng,
      maxDistanceKm: activeBounds ? undefined : values.maxDistanceKm,
    }),
    [activeBounds, search],
  );

  const runSearch = useCallback(() => {
    applyFilters(
      mergeWithMapContext({
        ...defaultFilters,
        search: search.trim() || undefined,
        minLat: mapBounds?.minLat,
        maxLat: mapBounds?.maxLat,
        minLng: mapBounds?.minLng,
        maxLng: mapBounds?.maxLng,
        maxDistanceKm: mapBounds ? undefined : defaultFilters.maxDistanceKm,
      }),
    );
  }, [applyFilters, defaultFilters, mapBounds, mergeWithMapContext, search]);

  const clearMapBounds = useCallback(() => {
    applyFilters({
      ...defaultFilters,
      search: search.trim() || undefined,
      minLat: undefined,
      maxLat: undefined,
      minLng: undefined,
      maxLng: undefined,
    });
  }, [applyFilters, defaultFilters, search]);

  const clearAllFilters = useCallback(() => {
    setSearch("");
    applyFilters({});
  }, [applyFilters]);

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
    <div className="space-y-8">
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">Map</h2>
          <MapLegend />
        </div>

        <div className="space-y-2">
          <Label htmlFor="discover-search" className="text-sm">
            Search clubs
          </Label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative min-w-0 flex-1">
              <Search
                className="text-muted-foreground absolute top-2.5 left-2.5 size-4"
                aria-hidden
              />
              <Input
                id="discover-search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") runSearch();
                }}
                placeholder="Name, activity, or provider…"
                className="pl-8 pr-11"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute top-1/2 right-1 size-8 -translate-y-1/2"
                aria-label={
                  activeFilterCount > 0
                    ? `Filters, ${activeFilterCount} active`
                    : "Filters"
                }
                onClick={() => setFiltersOpen(true)}
              >
                <SlidersHorizontal className="size-4" />
                {activeFilterCount > 0 ? (
                  <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                    {activeFilterCount > 9 ? "9+" : activeFilterCount}
                  </span>
                ) : null}
              </Button>
            </div>
            <Button
              type="button"
              className="shrink-0 sm:w-auto"
              onClick={runSearch}
            >
              Search
            </Button>
          </div>
          <p className="text-muted-foreground text-xs">
            Pan the map to limit results to the visible area, or use the filter
            icon for age, dates, and more.
          </p>
        </div>

        <div className="relative">
          <ClubMap
            markers={mapMarkers}
            fitBounds={mapFitBounds}
            className="h-56 sm:h-80"
            showLocateControl
            onBoundsChange={handleBoundsChange}
            onMarkerClick={(marker) =>
              router.push(`/clubs/${marker.id}?from=discover`)
            }
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
        ) : null}
      </div>

      <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
        <SheetContent side="right" className="flex w-full flex-col sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Filters</SheetTitle>
            <SheetDescription>
              Age, activity, dates, price, and more.
            </SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-4 pb-4">
            <ClubFilters
              embedded
              showSearch={false}
              formId={DISCOVER_FILTERS_FORM_ID}
              defaultValues={defaultFilters}
              onSubmit={(values) => {
                applyFilters(mergeWithMapContext(values));
                setFiltersOpen(false);
              }}
            />
          </div>
          <div className="flex gap-2 border-t p-4">
            <Button
              type="submit"
              form={DISCOVER_FILTERS_FORM_ID}
              className="flex-1"
            >
              Apply filters
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setSearch("");
                applyFilters(
                  activeBounds
                    ? {
                        minLat: activeBounds.minLat,
                        maxLat: activeBounds.maxLat,
                        minLng: activeBounds.minLng,
                        maxLng: activeBounds.maxLng,
                      }
                    : {},
                );
                setFiltersOpen(false);
              }}
            >
              Reset
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {clubs.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-xl border bg-card py-12 text-center">
          <p className="text-muted-foreground text-sm">
            No clubs match your filters.
            {defaultFilters.friendsOnly
              ? " Connect with friends or turn off “Friends only” to see more."
              : " Try adjusting your search or map area."}
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={clearAllFilters}>
              Reset filters
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/profile">Set postcode</Link>
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">
            {clubs.length} club{clubs.length === 1 ? "" : "s"}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {clubs.map((club) => (
              <ClubCard
                key={club.id}
                club={club}
                detailHref={`/clubs/${club.id}?from=discover`}
              />
            ))}
          </div>
        </div>
      )}

      {calendarEvents.length > 0 ? (
        <div className="space-y-2">
          <button
            type="button"
            className="flex w-full items-center justify-between gap-2 text-left"
            onClick={() => setCalendarOpen((value) => !value)}
            aria-expanded={calendarOpen}
          >
            <h2 className="text-lg font-semibold">Calendar preview</h2>
            <ChevronDown
              className={cn(
                "text-muted-foreground size-4 shrink-0 transition-transform",
                calendarOpen && "rotate-180",
              )}
              aria-hidden
            />
          </button>
          {calendarOpen ? (
            <ClubCalendar
              events={calendarEvents}
              onEventClick={(event) => {
                if (event.clubId) {
                  router.push(`/clubs/${event.clubId}?from=discover`);
                }
              }}
            />
          ) : (
            <p className="text-muted-foreground text-sm">
              {calendarEvents.length} upcoming date
              {calendarEvents.length === 1 ? "" : "s"} from filtered clubs — tap
              to expand.
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
}
