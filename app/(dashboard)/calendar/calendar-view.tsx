"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { CampCalendar } from "@/components/calendar/camp-calendar";
import { CampStatusControls } from "@/components/camp/camp-status-controls";
import { CampStatusBadge } from "@/components/camp/camp-status-badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { upsertPlannedCamp } from "@/lib/actions/planned-camps";
import type { CampCalendarEvent, PlannedCampStatus } from "@/lib/types/camp";
import { formatDateRange } from "@/lib/utils";

type CalendarViewProps = {
  events: CampCalendarEvent[];
};

function toDate(value: Date | string): Date {
  return value instanceof Date ? value : new Date(value);
}

export function CalendarView({ events }: CalendarViewProps) {
  const router = useRouter();
  const [selected, setSelected] = useState<CampCalendarEvent | null>(null);
  const [pending, startTransition] = useTransition();

  const handleStatusChange = (status: PlannedCampStatus) => {
    if (!selected?.campId) return;

    startTransition(async () => {
      try {
        await upsertPlannedCamp({
          campId: selected.campId,
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
          No camps on your calendar yet.{" "}
          <Link href="/discover" className="text-primary hover:underline">
            Discover camps
          </Link>
        </div>
      ) : (
        <CampCalendar events={events} onEventClick={setSelected} />
      )}

      <Sheet open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto">
          {selected ? (
            <>
              <SheetHeader>
                <SheetTitle>{selected.title}</SheetTitle>
                <SheetDescription>
                  {formatDateRange(toDate(selected.start), toDate(selected.end))}
                </SheetDescription>
              </SheetHeader>
              <div className="mt-6 space-y-4">
                {selected.status ? (
                  <CampStatusBadge status={selected.status} />
                ) : null}
                <CampStatusControls
                  currentStatus={selected.status}
                  onStatusChange={handleStatusChange}
                  disabled={pending}
                />
                {selected.campId ? (
                  <Button variant="outline" asChild className="w-full">
                    <Link href={`/camps/${selected.campId}`}>View camp details</Link>
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
