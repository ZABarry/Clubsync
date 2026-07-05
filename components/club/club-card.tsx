import { MapPin, Star } from "lucide-react";
import Link from "next/link";

import { ClubImage } from "@/components/club/club-image";
import { ClubStatusBadge } from "@/components/club/club-status-badge";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn, formatOptionalDateRange } from "@/lib/utils";
import { formatClubCardRates } from "@/lib/utils/club-booking";
import { getPlannedClubStatusLabel } from "@/lib/clubs/planned-club-status-styles";
import type { ClubCardData } from "@/lib/types/club";

type ClubCardProps = {
  club: ClubCardData;
  className?: string;
  detailHref?: string;
  onClick?: () => void;
};

export function ClubCard({
  club,
  className,
  detailHref,
  onClick,
}: ClubCardProps) {
  const dateLabel = formatOptionalDateRange(club.startDate, club.endDate);
  const hasRating = (club.ratingCount ?? 0) > 0;
  const priceRates = formatClubCardRates(club);
  const showPlannedFooter = !!club.plannedStatus;

  return (
    <Card
      className={cn(
        "relative flex h-full flex-col gap-0 overflow-hidden py-0 transition-shadow hover:shadow-md",
        (onClick || detailHref) && "cursor-pointer",
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
      {detailHref ? (
        <Link
          href={detailHref}
          className="absolute inset-0 z-0"
          aria-label={`View ${club.name}`}
        />
      ) : null}

      <div className="relative shrink-0 pointer-events-none">
        <ClubImage
          clubId={club.id}
          src={club.imageUrl!}
          alt={`${club.name} — ${club.providerName}`}
          wrapperClassName="aspect-[2.4/1] w-full"
          className="object-cover"
        />
      </div>

      <div className="relative z-10 flex flex-1 flex-col gap-2 p-3 pointer-events-none">
        <div className="flex min-h-[3.25rem] items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-sm leading-snug font-semibold line-clamp-2">
              {club.name}
            </p>
            <p className="text-muted-foreground mt-0.5 truncate text-xs">
              {club.providerName}
              {dateLabel ? ` · ${dateLabel}` : ""}
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap justify-end gap-1">
            {club.isCommunityClub ? (
              <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
                Community
              </Badge>
            ) : null}
            {club.plannedStatus ? (
              <ClubStatusBadge status={club.plannedStatus} />
            ) : null}
          </div>
        </div>

        <div className="flex min-h-5 flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
          {priceRates ? (
            <span className="font-medium text-foreground">
              {"daily" in priceRates ? (
                <>
                  {priceRates.daily}
                  <span className="text-muted-foreground font-normal">
                    {" "}
                    · {priceRates.weekly}
                  </span>
                </>
              ) : (
                priceRates.fallback
              )}
            </span>
          ) : null}
          {hasRating ? (
            <span className="inline-flex items-center gap-0.5">
              <Star className="size-3 fill-amber-400 text-amber-400" />
              {club.ratingAverage?.toFixed(1)}
              <span>({club.ratingCount})</span>
            </span>
          ) : null}
          {club.distanceKm != null ? (
            <span className="inline-flex items-center gap-0.5">
              <MapPin className="size-3" />
              {club.distanceKm.toFixed(1)} km
            </span>
          ) : null}
          {showPlannedFooter ? (
            <span>{getPlannedClubStatusLabel(club.plannedStatus!)}</span>
          ) : null}
        </div>

        <div className="flex min-h-[1.375rem] flex-wrap gap-1">
          {club.activities.slice(0, 3).map((activity) => (
            <Badge
              key={activity}
              variant="secondary"
              className="px-1.5 py-0 text-[10px] font-normal"
            >
              {activity}
            </Badge>
          ))}
          {club.activities.length > 3 ? (
            <Badge variant="outline" className="px-1.5 py-0 text-[10px] font-normal">
              +{club.activities.length - 3}
            </Badge>
          ) : null}
        </div>

        <p
          className={cn(
            "text-muted-foreground mt-auto line-clamp-1 min-h-[1.125rem] text-[11px] leading-snug",
            !club.recommendationReasons?.length && "invisible",
          )}
        >
          {club.recommendationReasons?.length
            ? club.recommendationReasons.slice(0, 3).join(" · ")
            : "\u00A0"}
        </p>
      </div>
    </Card>
  );
}
