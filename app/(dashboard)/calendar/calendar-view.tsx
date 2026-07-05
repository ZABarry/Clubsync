"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { CalendarCampSheet } from "@/components/calendar/calendar-camp-sheet";
import { ClubCalendar } from "@/components/calendar/club-calendar";
import { Button } from "@/components/ui/button";
import type { ClubCalendarEvent } from "@/lib/types/club";

type CalendarViewProps = {
  events: ClubCalendarEvent[];
};

export function CalendarView({ events }: CalendarViewProps) {
  const router = useRouter();
  const [selected, setSelected] = useState<ClubCalendarEvent | null>(null);

  useEffect(() => {
    if (!selected?.clubId) return;
    const updated = events.find((event) => event.clubId === selected.clubId);
    if (updated) setSelected(updated);
  }, [events, selected?.clubId]);

  const handleUpdated = () => {
    setSelected(null);
    router.refresh();
  };

  return (
    <>
      {events.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-xl border bg-card py-12 text-center">
          <p className="text-muted-foreground text-sm">
            No clubs on your calendar yet. Set a status on a club detail page
            or use Smart planner to find matches.
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/discover">Discover clubs</Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/planner">Smart planner</Link>
            </Button>
          </div>
        </div>
      ) : (
        <ClubCalendar
          events={events}
          onEventClick={(event) =>
            setSelected((current) =>
              current?.clubId === event.clubId ? null : event,
            )
          }
        />
      )}

      <CalendarCampSheet
        event={selected}
        open={!!selected}
        onOpenChange={(open) => !open && setSelected(null)}
        onUpdated={handleUpdated}
        onRefresh={() => router.refresh()}
      />
    </>
  );
}
