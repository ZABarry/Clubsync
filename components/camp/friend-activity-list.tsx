import { Users } from "lucide-react";

import { CampStatusBadge } from "@/components/camp/camp-status-badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { FriendCampActivity } from "@/lib/privacy/friend-visibility";
import { cn, formatOptionalDateRange } from "@/lib/utils";

type FriendActivityListProps = {
  activities: FriendCampActivity[];
  className?: string;
  emptyMessage?: string;
};

function initials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function FriendActivityList({
  activities,
  className,
  emptyMessage = "No friend activity yet.",
}: FriendActivityListProps) {
  if (activities.length === 0) {
    return (
      <Card className={cn("py-8", className)}>
        <CardContent className="flex flex-col items-center gap-2 text-center">
          <Users className="text-muted-foreground size-8" />
          <p className="text-muted-foreground text-sm">{emptyMessage}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <ul className={cn("space-y-3", className)}>
      {activities.map((activity) => {
        const childLabel = activity.childNickname
          ? `${activity.childNickname}${activity.childAge ? ` (${activity.childAge})` : ""}`
          : null;

        return (
          <li key={`${activity.campId}-${activity.parentDisplayName}-${activity.status}`}>
            <Card className="gap-3 py-4">
              <CardHeader className="flex-row items-start gap-3 space-y-0 px-4">
                <Avatar className="size-9">
                  <AvatarFallback className="text-xs">
                    {initials(activity.parentDisplayName)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <CardTitle className="text-sm font-medium">
                      {activity.parentDisplayName}
                    </CardTitle>
                    <CampStatusBadge status={activity.status} />
                  </div>
                  <CardDescription className="text-sm">
                    {activity.campName}
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="px-4 text-sm text-muted-foreground">
                <p>
                  {formatOptionalDateRange(
                    activity.startDate,
                    activity.endDate,
                  )}
                </p>
                {childLabel ? <p className="mt-1">Child: {childLabel}</p> : null}
              </CardContent>
            </Card>
          </li>
        );
      })}
    </ul>
  );
}
