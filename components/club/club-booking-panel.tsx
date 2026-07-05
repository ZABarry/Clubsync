"use client";

import { Loader2 } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { upsertPlannedClub } from "@/lib/actions/planned-clubs";
import type {
  ClubDetailData,
  PlannedClubBookingData,
  PlannedClubStatus,
} from "@/lib/types/club";
import { enumerateCampDates, formatCampDayLabel } from "@/lib/utils/club-booking";

type ClubBookingPanelProps = {
  club: ClubDetailData;
  plannedStatus: PlannedClubStatus | null;
  booking: PlannedClubBookingData | null;
  onSaved?: () => void;
  disabled?: boolean;
};

export function ClubBookingPanel({
  club,
  plannedStatus,
  booking,
  onSaved,
  disabled = false,
}: ClubBookingPanelProps) {
  const [pending, startTransition] = useTransition();
  const campDates = useMemo(() => {
    if (!club.startDate || !club.endDate) return [];
    return enumerateCampDates(club.startDate, club.endDate);
  }, [club.startDate, club.endDate]);

  const [selectedDates, setSelectedDates] = useState<string[]>(
    booking?.bookedDates ?? [],
  );

  const datesUnavailable = campDates.length === 0;
  const status = plannedStatus ?? "INTERESTED";

  const toggleDate = (date: string) => {
    setSelectedDates((current) =>
      current.includes(date)
        ? current.filter((d) => d !== date)
        : [...current, date].sort(),
    );
  };

  const selectAll = () => {
    setSelectedDates([...campDates]);
  };

  const clearAll = () => {
    setSelectedDates([]);
  };

  const resetToSaved = () => {
    setSelectedDates(booking?.bookedDates ?? []);
  };

  const savedDates = booking?.bookedDates ?? [];
  const isDirty =
    JSON.stringify(selectedDates) !== JSON.stringify(savedDates);

  const handleSave = () => {
    if (status === "BOOKED" && selectedDates.length === 0) {
      toast.error("Select at least one day when status is booked or paid");
      return;
    }

    startTransition(async () => {
      try {
        await upsertPlannedClub({
          clubId: club.id,
          status,
          bookedDates: selectedDates,
        });
        toast.success("Booking saved");
        onSaved?.();
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to save booking",
        );
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          Choose the days you have booked to show on your calendar
        </CardTitle>
        {datesUnavailable ? (
          <CardDescription>
            Club dates are not set yet — day selection will be available once
            dates are confirmed.
          </CardDescription>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-6">
        {!datesUnavailable ? (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Label>Select days ({selectedDates.length} selected)</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={selectAll}
                  disabled={disabled || pending}
                >
                  Select all
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={clearAll}
                  disabled={disabled || pending}
                >
                  Clear
                </Button>
              </div>
            </div>
            <div className="grid max-h-64 gap-2 overflow-y-auto sm:grid-cols-2 lg:grid-cols-3">
              {campDates.map((date) => {
                const checked = selectedDates.includes(date);
                return (
                  <label
                    key={date}
                    className="flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm has-checked:border-primary has-checked:bg-primary/5"
                  >
                    <input
                      type="checkbox"
                      className="size-4 rounded border"
                      checked={checked}
                      disabled={disabled || pending}
                      onChange={() => toggleDate(date)}
                    />
                    <span>{formatCampDayLabel(date)}</span>
                  </label>
                );
              })}
            </div>
          </div>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            onClick={handleSave}
            disabled={disabled || pending || !isDirty}
            className="w-full sm:w-auto"
          >
            {pending ? <Loader2 className="size-4 animate-spin" /> : null}
            Save booking
          </Button>
          {isDirty ? (
            <Button
              type="button"
              variant="outline"
              onClick={resetToSaved}
              disabled={disabled || pending}
              className="w-full sm:w-auto"
            >
              Reset
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
