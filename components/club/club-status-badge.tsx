import type { PlannedClubStatus } from "@/lib/types/club";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const STATUS_CONFIG: Record<
  PlannedClubStatus,
  { label: string; className: string }
> = {
  SUGGESTED: {
    label: "Suggested",
    className:
      "border-transparent bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-200",
  },
  INTERESTED: {
    label: "Interested",
    className:
      "border-transparent bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200",
  },
  FAVOURITE: {
    label: "Favourite",
    className:
      "border-transparent bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-200",
  },
  PLANNED: {
    label: "Planned",
    className:
      "border-transparent bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200",
  },
  BOOKED: {
    label: "Booked",
    className:
      "border-transparent bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
  },
  PAID: {
    label: "Paid",
    className:
      "border-transparent bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200",
  },
  CANCELLED: {
    label: "Cancelled",
    className:
      "border-transparent bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200",
  },
};

type ClubStatusBadgeProps = {
  status: PlannedClubStatus;
  className?: string;
};

export function ClubStatusBadge({ status, className }: ClubStatusBadgeProps) {
  const config = STATUS_CONFIG[status];

  return (
    <Badge variant="outline" className={cn(config.className, className)}>
      {config.label}
    </Badge>
  );
}
