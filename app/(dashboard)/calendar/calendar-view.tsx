"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { CalendarCampSheet } from "@/components/calendar/calendar-camp-sheet";
import { ClubCalendar } from "@/components/calendar/club-calendar";
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
        <div className="text-muted-foreground rounded-xl border bg-card py-12 text-center text-sm">
          No clubs on your calendar yet.{" "}
          <Link href="/discover" className="text-primary hover:underline">
            Discover clubs
          </Link>
        </div>
      ) : (
        <ClubCalendar events={events} onEventClick={setSelected} />
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
