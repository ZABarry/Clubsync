import Link from "next/link";
import { Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn, formatOptionalDateRange } from "@/lib/utils";

export type SharedClubSummary = {
  id: string;
  title: string;
  notes: string | null;
  createdBy: { displayName: string };
  club: {
    id: string;
    name: string;
    startDate: Date | string | null;
    endDate: Date | string | null;
    locationName: string;
  };
  participants: Array<{ parent: { displayName: string } }>;
};

type SharedClubListProps = {
  sharedClubs: SharedClubSummary[];
  className?: string;
  emptyMessage?: string;
};

export function SharedClubList({
  sharedClubs,
  className,
  emptyMessage = "No shared clubs yet. Create one from a club detail page.",
}: SharedClubListProps) {
  if (sharedClubs.length === 0) {
    return (
      <Card className={cn("py-8", className)}>
        <CardContent className="flex flex-col items-center gap-3 text-center">
          <Users className="text-muted-foreground size-8" />
          <p className="text-muted-foreground text-sm">{emptyMessage}</p>
          <Button variant="outline" size="sm" asChild>
            <Link href="/discover">Discover clubs</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <ul className={cn("space-y-3", className)}>
      {sharedClubs.map((shared) => {
        const dateLabel = formatOptionalDateRange(
          shared.club.startDate,
          shared.club.endDate,
        );

        return (
          <li key={shared.id}>
            <Link href={`/shared-clubs/${shared.id}`}>
              <Card className="gap-3 py-4 transition-shadow hover:shadow-md">
                <CardHeader className="px-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <CardTitle className="text-sm font-medium">
                      {shared.title}
                    </CardTitle>
                    <Badge variant="secondary">
                      {shared.participants.length} families
                    </Badge>
                  </div>
                  <CardDescription>
                    {shared.club.name} · {dateLabel}
                  </CardDescription>
                  <CardDescription className="text-xs">
                    {shared.club.locationName} · by{" "}
                    {shared.createdBy.displayName}
                  </CardDescription>
                  {shared.notes ? (
                    <p className="text-muted-foreground mt-1 line-clamp-2 text-xs">
                      {shared.notes}
                    </p>
                  ) : null}
                </CardHeader>
              </Card>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
