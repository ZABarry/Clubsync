import type { PlannedClubStatus } from "@/lib/types/club";

import { Badge } from "@/components/ui/badge";
import { PLANNED_CLUB_STATUS_STYLES } from "@/lib/clubs/planned-club-status-styles";
import { cn } from "@/lib/utils";

type ClubStatusBadgeProps = {
  status: PlannedClubStatus;
  className?: string;
};

export function ClubStatusBadge({ status, className }: ClubStatusBadgeProps) {
  const config = PLANNED_CLUB_STATUS_STYLES[status];

  return (
    <Badge variant="outline" className={cn(config.badgeClassName, className)}>
      {config.label}
    </Badge>
  );
}
