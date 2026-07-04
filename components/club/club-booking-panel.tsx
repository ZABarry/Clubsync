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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { upsertPlannedClub } from "@/lib/actions/planned-clubs";
import type {
  ClubDetailData,
  PlannedClubBookingData,
  PlannedClubStatus,
} from "@/lib/types/club";
import {
  computeTotalPrice,
  enumerateCampDates,
  formatBookingSummary,
  formatCampDayLabel,
  resolveDailyRate,
} from "@/lib/utils/club-booking";
import { formatPrice } from "@/lib/utils";

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

  const clubDefaultDailyRate = resolveDailyRate(club);

  const [selectedDates, setSelectedDates] = useState<string[]>(
    booking?.bookedDates ?? [],
  );
  const [dailyRateInput, setDailyRateInput] = useState<string>(() => {
    const rate = booking?.dailyRateOverride ?? clubDefaultDailyRate;
    return rate != null ? String(rate) : "";
  });
  const [totalInput, setTotalInput] = useState<string>(() => {
    if (booking?.totalPriceOverride != null) {
      return String(booking.totalPriceOverride);
    }
    const rate = parseDailyRate(dailyRateInput);
    const total = computeTotalPrice(
      rate,
      booking?.bookedDates.length ?? 0,
      null,
    );
    return total != null ? String(total) : "";
  });
  const [totalTouched, setTotalTouched] = useState(
    booking?.totalPriceOverride != null,
  );

  const parsedDailyRate = parseDailyRate(dailyRateInput);
  const computedTotal = computeTotalPrice(
    parsedDailyRate,
    selectedDates.length,
    totalTouched ? parsePositiveNumber(totalInput) : null,
  );
  const dailyRateChangedFromDefault =
    parsedDailyRate != null &&
    clubDefaultDailyRate != null &&
    parsedDailyRate !== clubDefaultDailyRate;
  const dailyRateOverride =
    dailyRateChangedFromDefault ||
    (parsedDailyRate != null && clubDefaultDailyRate == null)
      ? parsedDailyRate
      : undefined;
  const totalPriceOverride = totalTouched
    ? parsePositiveNumber(totalInput) ?? undefined
    : undefined;

  const datesUnavailable = campDates.length === 0;
  const status = plannedStatus ?? "INTERESTED";

  const toggleDate = (date: string) => {
    setSelectedDates((current) => {
      const next = current.includes(date)
        ? current.filter((d) => d !== date)
        : [...current, date].sort();
      if (!totalTouched) {
        const rate = parseDailyRate(dailyRateInput);
        const total = computeTotalPrice(rate, next.length, null);
        setTotalInput(total != null ? String(total) : "");
      }
      return next;
    });
  };

  const selectAll = () => {
    setSelectedDates([...campDates]);
    if (!totalTouched) {
      const rate = parseDailyRate(dailyRateInput);
      const total = computeTotalPrice(rate, campDates.length, null);
      setTotalInput(total != null ? String(total) : "");
    }
  };

  const clearAll = () => {
    setSelectedDates([]);
    if (!totalTouched) {
      setTotalInput("");
    }
  };

  const handleDailyRateChange = (value: string) => {
    setDailyRateInput(value);
    if (!totalTouched) {
      const rate = parseDailyRate(value);
      const total = computeTotalPrice(rate, selectedDates.length, null);
      setTotalInput(total != null ? String(total) : "");
    }
  };

  const handleTotalChange = (value: string) => {
    setTotalTouched(true);
    setTotalInput(value);
  };

  const resetTotalToComputed = () => {
    setTotalTouched(false);
    const rate = parseDailyRate(dailyRateInput);
    const total = computeTotalPrice(rate, selectedDates.length, null);
    setTotalInput(total != null ? String(total) : "");
  };

  const handleSave = () => {
    if (
      (status === "BOOKED" || status === "PAID") &&
      selectedDates.length === 0
    ) {
      toast.error("Select at least one day when status is booked or paid");
      return;
    }

    startTransition(async () => {
      try {
        await upsertPlannedClub({
          clubId: club.id,
          status,
          bookedDates: selectedDates,
          dailyRateOverride,
          totalPriceOverride,
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

  const summary = formatBookingSummary(
    selectedDates.length,
    parsedDailyRate,
    computedTotal,
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Your booking</CardTitle>
        <CardDescription>
          {datesUnavailable
            ? "Club dates are not set yet — day selection will be available once dates are confirmed."
            : "Choose the days you want to book and adjust pricing if needed."}
        </CardDescription>
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

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="daily-rate">Daily rate</Label>
            <Input
              id="daily-rate"
              type="number"
              min={0}
              step={0.01}
              placeholder={
                clubDefaultDailyRate != null
                  ? String(clubDefaultDailyRate)
                  : "Enter daily rate"
              }
              value={dailyRateInput}
              onChange={(e) => handleDailyRateChange(e.target.value)}
              disabled={disabled || pending}
            />
            {clubDefaultDailyRate != null ? (
              <p className="text-muted-foreground text-xs">
                Club default: {formatPrice(clubDefaultDailyRate)}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="total-price">Total</Label>
              {totalTouched ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-auto px-2 py-1 text-xs"
                  onClick={resetTotalToComputed}
                  disabled={disabled || pending}
                >
                  Reset to calculated
                </Button>
              ) : null}
            </div>
            <Input
              id="total-price"
              type="number"
              min={0}
              step={0.01}
              placeholder="Calculated total"
              value={totalInput}
              onChange={(e) => handleTotalChange(e.target.value)}
              disabled={disabled || pending}
            />
            {summary ? (
              <p className="text-muted-foreground text-xs">{summary}</p>
            ) : null}
          </div>
        </div>

        <Button
          type="button"
          onClick={handleSave}
          disabled={disabled || pending}
          className="w-full sm:w-auto"
        >
          {pending ? <Loader2 className="size-4 animate-spin" /> : null}
          Save booking
        </Button>
      </CardContent>
    </Card>
  );
}

function parseDailyRate(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number.parseFloat(trimmed);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function parsePositiveNumber(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number.parseFloat(trimmed);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}
