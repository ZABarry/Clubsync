import Link from "next/link";
import { Users } from "lucide-react";

import { ClubStatusBadge } from "@/components/club/club-status-badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyStateCard } from "@/components/ui/empty-state-card";
import type { FriendClubActivity } from "@/lib/privacy/friend-visibility";
import { cn, formatOptionalDateRange } from "@/lib/utils";

type FriendActivityListProps = {
  activities: FriendClubActivity[];
  className?: string;
  emptyMessage?: string;
  /** Query param value for contextual back links on club detail */
  from?: string;
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
  from,
}: FriendActivityListProps) {
  if (activities.length === 0) {
    return (
      <EmptyStateCard icon={Users} className={className}>
        <p className="text-muted-foreground text-sm">{emptyMessage}</p>
      </EmptyStateCard>
    );
  }

  return (
    <ul className={cn("space-y-3", className)}>
      {activities.map((activity) => {
        const childLabel = activity.childNickname
          ? `${activity.childNickname}${activity.childAge ? ` (${activity.childAge})` : ""}`
          : null;
        const clubHref = from
          ? `/clubs/${activity.clubId}?from=${from}`
          : `/clubs/${activity.clubId}`;

        return (
          <li key={`${activity.clubId}-${activity.parentDisplayName}-${activity.status}`}>
            <Link href={clubHref} className="block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <Card className="gap-3 py-4 transition-shadow hover:shadow-md">
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
                      <ClubStatusBadge status={activity.status} />
                    </div>
                    <CardDescription className="text-sm">
                      {activity.clubName}
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
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
