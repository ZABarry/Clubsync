const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export type ClubRateSource = {
  dailyRate?: number | null;
  price?: number | null;
};

export function toIsoDateString(value: Date | string): string {
  if (typeof value === "string") {
    if (ISO_DATE_RE.test(value)) return value;
    return toIsoDateString(new Date(value));
  }
  const year = value.getUTCFullYear();
  const month = String(value.getUTCMonth() + 1).padStart(2, "0");
  const day = String(value.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function enumerateCampDates(
  start: Date | string,
  end: Date | string,
): string[] {
  const startDate = new Date(
    typeof start === "string" ? `${start.slice(0, 10)}T00:00:00.000Z` : start,
  );
  const endDate = new Date(
    typeof end === "string" ? `${end.slice(0, 10)}T00:00:00.000Z` : end,
  );

  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return [];
  }

  const dates: string[] = [];
  const cursor = new Date(startDate);

  while (cursor <= endDate) {
    dates.push(toIsoDateString(cursor));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return dates;
}

export function resolveDailyRate(
  club: ClubRateSource,
  override?: number | null,
): number | null {
  if (override != null) return override;
  if (club.dailyRate != null) return club.dailyRate;
  if (club.price != null) return club.price;
  return null;
}

export function computeTotalPrice(
  dailyRate: number | null,
  dayCount: number,
  totalOverride?: number | null,
): number | null {
  if (totalOverride != null) return totalOverride;
  if (dailyRate == null || dayCount === 0) return null;
  return dailyRate * dayCount;
}

export function validateBookedDates(
  dates: string[],
  clubStart: Date | string | null | undefined,
  clubEnd: Date | string | null | undefined,
): { valid: boolean; error?: string } {
  for (const date of dates) {
    if (!ISO_DATE_RE.test(date)) {
      return { valid: false, error: `Invalid date format: ${date}` };
    }
  }

  if (dates.length === 0) {
    return { valid: true };
  }

  if (clubStart == null || clubEnd == null) {
    return {
      valid: false,
      error: "Cannot book days when club dates are not set",
    };
  }

  const allowed = new Set(enumerateCampDates(clubStart, clubEnd));
  for (const date of dates) {
    if (!allowed.has(date)) {
      return {
        valid: false,
        error: `Date ${date} is outside the club's available range`,
      };
    }
  }

  return { valid: true };
}

export function formatBookingSummary(
  dayCount: number,
  dailyRate: number | null,
  total: number | null,
): string | null {
  if (dayCount === 0) return null;
  if (total == null && dailyRate == null) {
    return `${dayCount} day${dayCount === 1 ? "" : "s"} booked`;
  }
  if (dailyRate != null && total != null) {
    return `${dayCount} day${dayCount === 1 ? "" : "s"} × £${dailyRate} = £${total}`;
  }
  if (total != null) {
    return `${dayCount} day${dayCount === 1 ? "" : "s"} booked · £${total} total`;
  }
  return `${dayCount} day${dayCount === 1 ? "" : "s"} booked`;
}

export function sortBookedDates(dates: string[]): string[] {
  return [...dates].sort();
}

export function uniqueBookedDates(dates: string[]): string[] {
  return sortBookedDates([...new Set(dates)]);
}

export function formatCampDayLabel(isoDate: string): string {
  const date = new Date(`${isoDate}T00:00:00.000Z`);
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(date);
}

export function formatBookedDateRange(dates: string[]): string | null {
  const sorted = uniqueBookedDates(dates);
  if (sorted.length === 0) return null;

  const formatDay = (isoDate: string) => {
    const date = new Date(`${isoDate}T00:00:00.000Z`);
    return new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "short",
    }).format(date);
  };

  if (sorted.length === 1) return formatDay(sorted[0]);
  return `${formatDay(sorted[0])} – ${formatDay(sorted[sorted.length - 1])}`;
}
