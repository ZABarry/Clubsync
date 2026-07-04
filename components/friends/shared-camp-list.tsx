import { Users } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn, formatDateRange } from "@/lib/utils";

export type SharedCampSummary = {
  id: string;
  title: string;
  notes: string | null;
  createdBy: { displayName: string };
  camp: {
    id: string;
    name: string;
    startDate: Date | string;
    endDate: Date | string;
    locationName: string;
  };
  participants: Array<{ parent: { displayName: string } }>;
};

type SharedCampListProps = {
  sharedCamps: SharedCampSummary[];
  className?: string;
  emptyMessage?: string;
};

export function SharedCampList({
  sharedCamps,
  className,
  emptyMessage = "No shared camps yet. Create one from a camp detail page.",
}: SharedCampListProps) {
  if (sharedCamps.length === 0) {
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
      {sharedCamps.map((shared) => {
        const start = new Date(shared.camp.startDate);
        const end = new Date(shared.camp.endDate);

        return (
          <li key={shared.id}>
            <Link href={`/shared-camps/${shared.id}`}>
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
                    {shared.camp.name} · {formatDateRange(start, end)}
                  </CardDescription>
                  <CardDescription className="text-xs">
                    {shared.camp.locationName} · by{" "}
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
