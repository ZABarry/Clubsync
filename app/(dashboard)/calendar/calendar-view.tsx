"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { ClubCalendar } from "@/components/calendar/club-calendar";
import { ClubStatusControls } from "@/components/club/club-status-controls";
import { ClubStatusBadge } from "@/components/club/club-status-badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { upsertPlannedClub } from "@/lib/actions/planned-clubs";
import type { ClubCalendarEvent, PlannedClubStatus } from "@/lib/types/club";
import { formatOptionalDateRange } from "@/lib/utils";
import { formatBookingSummary } from "@/lib/utils/club-booking";

type CalendarViewProps = {
  events: ClubCalendarEvent[];
};

export function CalendarView({ events }: CalendarViewProps) {
  const router = useRouter();
  const [selected, setSelected] = useState<ClubCalendarEvent | null>(null);
  const [pending, startTransition] = useTransition();

  const handleStatusChange = (status: PlannedClubStatus) => {
    if (!selected?.clubId) return;

    startTransition(async () => {
      try {
        await upsertPlannedClub({
          clubId: selected.clubId,
          status,
        });
        toast.success("Status updated");
        setSelected(null);
        router.refresh();
      } catch {
        toast.error("Failed to update status");
      }
    });
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

      <Sheet open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto">
          {selected ? (
            <>
              <SheetHeader>
                <SheetTitle>{selected.title}</SheetTitle>
                <SheetDescription>
                  {formatOptionalDateRange(selected.start, selected.end)}
                </SheetDescription>
              </SheetHeader>
              <div className="mt-6 space-y-4">
                {selected.status ? (
                  <ClubStatusBadge status={selected.status} />
                ) : null}
                {selected.dayCount != null && selected.dayCount > 0 ? (
                  <p className="text-muted-foreground text-sm">
                    {formatBookingSummary(
                      selected.dayCount,
                      selected.effectiveDailyRate ?? null,
                      selected.effectiveTotalPrice ?? null,
                    )}
                  </p>
                ) : null}
                <ClubStatusControls
                  currentStatus={selected.status}
                  onStatusChange={handleStatusChange}
                  disabled={pending}
                />
                {selected.clubId ? (
                  <Button variant="outline" asChild className="w-full">
                    <Link href={`/clubs/${selected.clubId}`}>View club details</Link>
                  </Button>
                ) : null}
              </div>
            </>
          ) : null}
        </SheetContent>
      </Sheet>
    </>
  );
}
