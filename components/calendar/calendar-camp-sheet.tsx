"use client";

import Link from "next/link";
import { Loader2 } from "lucide-react";
import { useEffect, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import { ClubStatusBadge } from "@/components/club/club-status-badge";
import { ClubStatusControls } from "@/components/club/club-status-controls";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { deletePlannedClub, upsertPlannedClub } from "@/lib/actions/planned-clubs";
import type { ClubCalendarEvent, PlannedClubStatus } from "@/lib/types/club";
import { formatOptionalDateRange } from "@/lib/utils";
import {
  computeTotalPrice,
  enumerateCampDates,
  formatBookedDateRange,
  formatBookingSummary,
  formatCampDayLabel,
} from "@/lib/utils/club-booking";

type CalendarCampSheetProps = {
  event: ClubCalendarEvent | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated?: () => void;
  onRefresh?: () => void;
};

export function CalendarCampSheet({
  event,
  open,
  onOpenChange,
  onUpdated,
  onRefresh,
}: CalendarCampSheetProps) {
  const [pending, startTransition] = useTransition();
  const [selectedDates, setSelectedDates] = useState<string[]>([]);

  const campDates = useMemo(() => {
    if (!event?.campStartDate || !event?.campEndDate) return [];
    return enumerateCampDates(event.campStartDate, event.campEndDate);
  }, [event?.campStartDate, event?.campEndDate]);

  useEffect(() => {
    setSelectedDates(event?.bookedDates ?? []);
  }, [event]);

  const dateLabel =
    selectedDates.length > 0
      ? formatBookedDateRange(selectedDates)
      : event?.start != null && event?.end != null
        ? formatOptionalDateRange(event.start, event.end)
        : "Dates TBC";

  const effectiveDailyRate = event?.effectiveDailyRate ?? null;
  const computedTotal = computeTotalPrice(
    effectiveDailyRate,
    selectedDates.length,
    event?.totalPriceOverride ?? null,
  );
  const summary = formatBookingSummary(
    selectedDates.length,
    effectiveDailyRate,
    computedTotal,
  );

  const datesChanged =
    JSON.stringify(selectedDates) !==
    JSON.stringify(event?.bookedDates ?? []);

  const toggleDate = (date: string) => {
    setSelectedDates((current) =>
      current.includes(date)
        ? current.filter((d) => d !== date)
        : [...current, date].sort(),
    );
  };

  const selectAll = () => setSelectedDates([...campDates]);
  const clearAll = () => setSelectedDates([]);
  const resetDates = () => setSelectedDates(event?.bookedDates ?? []);

  const handleStatusChange = (status: PlannedClubStatus) => {
    if (!event?.clubId) return;

    if (status === "BOOKED" && selectedDates.length === 0) {
      toast.error("Select at least one day when marking as booked or paid");
      return;
    }

    startTransition(async () => {
      try {
        await upsertPlannedClub({
          clubId: event.clubId,
          status,
          bookedDates: selectedDates,
          dailyRateOverride: event.dailyRateOverride ?? undefined,
          totalPriceOverride: event.totalPriceOverride ?? undefined,
        });
        toast.success("Status updated");
        onUpdated?.();
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to update status",
        );
      }
    });
  };

  const handleStatusClear = () => {
    const clubId = event?.clubId;
    if (!clubId) return;

    startTransition(async () => {
      try {
        await deletePlannedClub(clubId);
        toast.success("Removed from your clubs");
        onUpdated?.();
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to remove club",
        );
      }
    });
  };

  const handleSaveDates = () => {
    if (!event?.clubId || !event.status) return;

    if (event.status === "BOOKED" && selectedDates.length === 0) {
      toast.error("Select at least one day when status is booked or paid");
      return;
    }

    startTransition(async () => {
      try {
        await upsertPlannedClub({
          clubId: event.clubId,
          status: event.status,
          bookedDates: selectedDates,
          dailyRateOverride: event.dailyRateOverride ?? undefined,
          totalPriceOverride: event.totalPriceOverride ?? undefined,
        });
        toast.success("Dates updated");
        onRefresh?.();
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to update dates",
        );
      }
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="max-h-[min(85dvh,calc(100dvh-1rem))] gap-0 overflow-y-auto rounded-t-2xl border-t px-0 pb-[max(2rem,env(safe-area-inset-bottom,0px))] sm:bottom-4 sm:left-1/2 sm:w-full sm:max-w-lg sm:-translate-x-1/2 sm:rounded-2xl sm:border sm:pb-6 sm:shadow-xl"
      >
        <div
          aria-hidden
          className="bg-muted mx-auto mt-2 mb-1 h-1 w-10 shrink-0 rounded-full"
        />

        {event ? (
          <div className="px-4">
            <SheetHeader className="space-y-1 p-0 pr-8 text-left">
              <SheetTitle className="text-lg">{event.title}</SheetTitle>
              <SheetDescription>{dateLabel}</SheetDescription>
            </SheetHeader>

            <div className="mt-4 space-y-5">
              <div className="flex flex-wrap items-center gap-2">
                {event.status ? (
                  <ClubStatusBadge status={event.status} />
                ) : null}
                {summary ? (
                  <p className="text-muted-foreground text-sm">{summary}</p>
                ) : null}
              </div>

              {campDates.length > 0 ? (
                <div className="space-y-3 rounded-lg border bg-muted/30 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Label className="text-sm">
                      Select days ({selectedDates.length} selected)
                    </Label>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={selectAll}
                        disabled={pending}
                      >
                        Select all
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={clearAll}
                        disabled={pending}
                      >
                        Clear
                      </Button>
                      {datesChanged ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={resetDates}
                          disabled={pending}
                        >
                          Reset
                        </Button>
                      ) : null}
                    </div>
                  </div>
                  <div className="grid max-h-48 gap-2 overflow-y-auto sm:grid-cols-2">
                    {campDates.map((date) => {
                      const checked = selectedDates.includes(date);
                      return (
                        <label
                          key={date}
                          className="flex cursor-pointer items-center gap-2 rounded-md border bg-background px-3 py-2 text-sm has-checked:border-primary has-checked:bg-primary/5"
                        >
                          <input
                            type="checkbox"
                            className="size-4 rounded border"
                            checked={checked}
                            disabled={pending}
                            onChange={() => toggleDate(date)}
                          />
                          <span>{formatCampDayLabel(date)}</span>
                        </label>
                      );
                    })}
                  </div>
                  {datesChanged ? (
                    <Button
                      type="button"
                      onClick={handleSaveDates}
                      disabled={pending}
                      className="w-full"
                    >
                      {pending ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : null}
                      Save dates
                    </Button>
                  ) : null}
                </div>
              ) : null}

              <ClubStatusControls
                currentStatus={event.status}
                onStatusChange={handleStatusChange}
                onStatusClear={event.status ? handleStatusClear : undefined}
                disabled={pending}
              />

              {event.clubId ? (
                <Button variant="outline" asChild className="w-full">
                  <Link href={`/clubs/${event.clubId}`}>View club details</Link>
                </Button>
              ) : null}
            </div>
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
