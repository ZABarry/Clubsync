import { ExternalLink, MapPin, Star } from "lucide-react";
import Link from "next/link";

import { ClubImage } from "@/components/club/club-image";
import { ClubStatusBadge } from "@/components/club/club-status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  const showBookingLink = !!club.bookingUrl;
  const showPlannedFooter = !!club.plannedStatus;

  const mainContent = (
    <>
      <ClubImage
        clubId={club.id}
        src={club.imageUrl!}
        alt={`${club.name} — ${club.providerName}`}
        wrapperClassName="px-4"
        className="aspect-[16/9] w-full rounded-lg object-cover"
      />
      <CardHeader className="gap-2 px-4">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base leading-snug">{club.name}</CardTitle>
          <div className="flex flex-wrap justify-end gap-1">
            {club.isCommunityClub ? (
              <Badge variant="secondary">Community</Badge>
            ) : null}
            {club.plannedStatus ? (
              <ClubStatusBadge status={club.plannedStatus} />
            ) : null}
          </div>
        </div>
        <CardDescription>{club.providerName}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 px-4">
        <p className="text-sm">{dateLabel}</p>
        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
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
            <span className="inline-flex items-center gap-1">
              <Star className="size-3.5 fill-amber-400 text-amber-400" />
              {club.ratingAverage?.toFixed(1)}
              <span className="text-xs">({club.ratingCount})</span>
            </span>
          ) : null}
          {club.distanceKm != null ? (
            <span className="inline-flex items-center gap-1">
              <MapPin className="size-3.5" />
              {club.distanceKm.toFixed(1)} km
            </span>
          ) : null}
        </div>
        {club.activities.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {club.activities.slice(0, 4).map((activity) => (
              <Badge key={activity} variant="secondary" className="text-xs">
                {activity}
              </Badge>
            ))}
            {club.activities.length > 4 ? (
              <Badge variant="outline" className="text-xs">
                +{club.activities.length - 4}
              </Badge>
            ) : null}
          </div>
        ) : null}
        {club.recommendationReasons && club.recommendationReasons.length > 0 ? (
          <p className="text-muted-foreground text-xs leading-relaxed">
            {club.recommendationReasons.slice(0, 3).join(" · ")}
          </p>
        ) : null}
      </CardContent>
    </>
  );

  return (
    <Card
      className={cn(
        "gap-4 py-4 transition-shadow hover:shadow-md",
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
        <Link href={detailHref} className="block">
          {mainContent}
        </Link>
      ) : (
        mainContent
      )}
      {showBookingLink || showPlannedFooter ? (
        <CardFooter
          className={cn(
            "px-4 pt-0",
            showBookingLink && showPlannedFooter
              ? "flex flex-wrap items-center justify-between gap-2"
              : showBookingLink
                ? "flex justify-end"
                : undefined,
          )}
        >
          {showPlannedFooter ? (
            <span className="text-muted-foreground text-xs">
              Status: {getPlannedClubStatusLabel(club.plannedStatus!)}
            </span>
          ) : null}
          {showBookingLink ? (
            <Button size="sm" asChild>
              <a
                href={club.bookingUrl!}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
              >
                Book now
                <ExternalLink className="size-3.5" />
              </a>
            </Button>
          ) : null}
        </CardFooter>
      ) : null}
    </Card>
  );
}
