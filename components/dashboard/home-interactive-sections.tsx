"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Calendar, MapPin } from "lucide-react";

import { CalendarCampSheet } from "@/components/calendar/calendar-camp-sheet";
import { ClubCalendar } from "@/components/calendar/club-calendar";
import { ClubMap } from "@/components/map/club-map";
import { MapLegend } from "@/components/map/map-legend";
import { Button } from "@/components/ui/button";
import { EmptyStateCard } from "@/components/ui/empty-state-card";
import type { ClubCalendarEvent, ClubMapMarker } from "@/lib/types/club";

type HomeInteractiveSectionsProps = {
  mapMarkers: ClubMapMarker[];
  calendarEvents: ClubCalendarEvent[];
  parentLat?: number | null;
  parentLng?: number | null;
};

export function HomeMapSection({
  mapMarkers,
  parentLat,
  parentLng,
}: Pick<
  HomeInteractiveSectionsProps,
  "mapMarkers" | "parentLat" | "parentLng"
>) {
  const router = useRouter();

  if (mapMarkers.length === 0) {
    return (
      <EmptyStateCard icon={MapPin}>
        <p className="text-muted-foreground text-sm">
          Set your home postcode in Profile to see clubs on the map.
        </p>
        <Button variant="outline" size="sm" asChild>
          <Link href="/profile">Set postcode</Link>
        </Button>
      </EmptyStateCard>
    );
  }

  return (
    <>
      <MapLegend className="mb-2" />
      <ClubMap
        markers={mapMarkers}
        center={
          parentLat != null && parentLng != null
            ? { latitude: parentLat, longitude: parentLng }
            : undefined
        }
        showLocateControl
        className="h-64"
        onMarkerClick={(marker) => router.push(`/clubs/${marker.id}?from=home`)}
      />
    </>
  );
}

export function HomeCalendarSection({
  calendarEvents,
}: Pick<HomeInteractiveSectionsProps, "calendarEvents">) {
  const router = useRouter();
  const [selected, setSelected] = useState<ClubCalendarEvent | null>(null);

  if (calendarEvents.length === 0) {
    return (
      <EmptyStateCard icon={Calendar}>
        <p className="text-muted-foreground text-sm">
          Your calendar is empty.{" "}
          <Link href="/discover" className="text-primary hover:underline">
            Discover clubs
          </Link>
        </p>
      </EmptyStateCard>
    );
  }

  return (
    <>
      <ClubCalendar
        events={calendarEvents.slice(0, 10)}
        onEventClick={(event) =>
          setSelected((current) =>
            current?.clubId === event.clubId ? null : event,
          )
        }
      />
      <CalendarCampSheet
        event={selected}
        open={!!selected}
        onOpenChange={(open) => !open && setSelected(null)}
        onUpdated={() => {
          setSelected(null);
          router.refresh();
        }}
        onRefresh={() => router.refresh()}
      />
    </>
  );
}
