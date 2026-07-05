import type { PlannedClubStatus } from "@/lib/types/club";

export type PlannedClubStatusStyle = {
  label: string;
  badgeClassName: string;
  calendarColor: string;
};

/** Status pill and calendar colours aligned to site orange tokens. */
export const PLANNED_CLUB_STATUS_STYLES: Record<
  PlannedClubStatus,
  PlannedClubStatusStyle
> = {
  SUGGESTED: {
    label: "Suggested",
    badgeClassName: "border-transparent bg-muted text-muted-foreground",
    calendarColor: "#8b919e",
  },
  INTERESTED: {
    label: "Interested",
    badgeClassName:
      "border-transparent bg-secondary text-secondary-foreground",
    calendarColor: "#e8955f",
  },
  FAVOURITE: {
    label: "Favourite",
    badgeClassName: "border-transparent bg-accent text-accent-foreground",
    calendarColor: "#d97736",
  },
  PLANNED: {
    label: "Planned",
    badgeClassName:
      "border-transparent bg-primary/20 text-primary dark:bg-primary/25 dark:text-primary",
    calendarColor: "#e07a3a",
  },
  BOOKED: {
    label: "Booked",
    badgeClassName:
      "border-transparent bg-primary text-primary-foreground",
    calendarColor: "#c9581a",
  },
  CANCELLED: {
    label: "Cancelled",
    badgeClassName:
      "border-transparent bg-destructive/15 text-destructive dark:bg-destructive/25 dark:text-destructive-foreground",
    calendarColor: "#dc4444",
  },
};

export function getPlannedClubStatusLabel(status: PlannedClubStatus): string {
  return PLANNED_CLUB_STATUS_STYLES[status].label;
}

export function getPlannedClubStatusCalendarColor(
  status: PlannedClubStatus | undefined,
): string {
  if (!status) return PLANNED_CLUB_STATUS_STYLES.INTERESTED.calendarColor;
  return PLANNED_CLUB_STATUS_STYLES[status].calendarColor;
}
