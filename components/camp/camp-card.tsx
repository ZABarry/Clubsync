import type { PlannedCampStatus } from "@/lib/types/camp";
import { MapPin, Star } from "lucide-react";

import { CampStatusBadge } from "@/components/camp/camp-status-badge";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn, formatDateRange, formatPrice } from "@/lib/utils";
import type { CampCardData } from "@/lib/types/camp";

type CampCardProps = {
  camp: CampCardData;
  className?: string;
  onClick?: () => void;
};

function toDate(value: Date | string): Date {
  return value instanceof Date ? value : new Date(value);
}

export function CampCard({ camp, className, onClick }: CampCardProps) {
  const start = toDate(camp.startDate);
  const end = toDate(camp.endDate);
  const hasRating = (camp.ratingCount ?? 0) > 0;

  return (
    <Card
      className={cn(
        "gap-4 py-4 transition-shadow hover:shadow-md",
        onClick && "cursor-pointer",
        className,
      )}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
    >
      {camp.imageUrl ? (
        <div className="px-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={camp.imageUrl}
            alt=""
            className="aspect-[16/9] w-full rounded-lg object-cover"
          />
        </div>
      ) : null}
      <CardHeader className="gap-2 px-4">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base leading-snug">{camp.name}</CardTitle>
          {camp.plannedStatus ? (
            <CampStatusBadge status={camp.plannedStatus} />
          ) : null}
        </div>
        <CardDescription>{camp.providerName}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 px-4">
        <p className="text-sm">{formatDateRange(start, end)}</p>
        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">
            {formatPrice(camp.price)}
          </span>
          {hasRating ? (
            <span className="inline-flex items-center gap-1">
              <Star className="size-3.5 fill-amber-400 text-amber-400" />
              {camp.ratingAverage?.toFixed(1)}
              <span className="text-xs">({camp.ratingCount})</span>
            </span>
          ) : null}
          {camp.distanceKm != null ? (
            <span className="inline-flex items-center gap-1">
              <MapPin className="size-3.5" />
              {camp.distanceKm.toFixed(1)} km
            </span>
          ) : null}
        </div>
        {camp.activities.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {camp.activities.slice(0, 4).map((activity) => (
              <Badge key={activity} variant="secondary" className="text-xs">
                {activity}
              </Badge>
            ))}
            {camp.activities.length > 4 ? (
              <Badge variant="outline" className="text-xs">
                +{camp.activities.length - 4}
              </Badge>
            ) : null}
          </div>
        ) : null}
        {camp.recommendationReasons && camp.recommendationReasons.length > 0 ? (
          <p className="text-muted-foreground text-xs leading-relaxed">
            {camp.recommendationReasons.slice(0, 3).join(" · ")}
          </p>
        ) : null}
      </CardContent>
      {camp.plannedStatus ? (
        <CardFooter className="px-4 pt-0">
          <span className="text-muted-foreground text-xs">
            Status: {formatStatusLabel(camp.plannedStatus)}
          </span>
        </CardFooter>
      ) : null}
    </Card>
  );
}

function formatStatusLabel(status: PlannedCampStatus): string {
  return status.charAt(0) + status.slice(1).toLowerCase().replace("_", " ");
}
