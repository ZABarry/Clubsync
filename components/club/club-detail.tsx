import {
  Accessibility,
  Clock,
  ExternalLink,
  MapPin,
  Star,
  Users,
} from "lucide-react";

import { ClubImage } from "@/components/club/club-image";
import { ClubStatusBadge } from "@/components/club/club-status-badge";
import { ClubStatusControls } from "@/components/club/club-status-controls";
import { ClubMapLazy } from "@/components/map/club-map-lazy";
import { MapLegend } from "@/components/map/map-legend";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { ClubDetailData, PlannedClubBookingData, PlannedClubStatus } from "@/lib/types/club";
import {
  buildGoogleMapsDirectionsUrl,
  cn,
  formatOptionalDateRange,
} from "@/lib/utils";
import {
  formatBookingSummary,
  formatClubDetailDailyRate,
} from "@/lib/utils/club-booking";

type ClubDetailProps = {
  club: ClubDetailData;
  plannedStatus?: PlannedClubStatus | null;
  booking?: PlannedClubBookingData | null;
  onStatusChange?: (status: PlannedClubStatus) => void;
  onStatusClear?: () => void;
  statusControlsDisabled?: boolean;
  className?: string;
};

export function ClubDetail({
  club,
  plannedStatus,
  booking,
  onStatusChange,
  onStatusClear,
  statusControlsDisabled,
  className,
}: ClubDetailProps) {
  const dateLabel = formatOptionalDateRange(club.startDate, club.endDate);
  const hasRating = (club.ratingCount ?? 0) > 0;
  const dailyRateDisplay = formatClubDetailDailyRate(club);
  const bookingSummary =
    booking && booking.bookedDates.length > 0
      ? formatBookingSummary(booking.bookedDates.length, null, null)
      : null;
  const directionsUrl = buildGoogleMapsDirectionsUrl({
    address: club.address,
    latitude: club.latitude,
    longitude: club.longitude,
  });

  return (
    <div className={cn("space-y-6", className)}>
      <ClubImage
        clubId={club.id}
        src={club.imageUrl!}
        alt={`${club.name} — ${club.providerName}`}
        wrapperClassName="aspect-[21/9] w-full rounded-xl"
        className="object-cover"
        priority
      />

      <div className="space-y-2">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {club.name}
            </h1>
            <p className="text-muted-foreground">{club.providerName}</p>
          </div>
          {plannedStatus ? <ClubStatusBadge status={plannedStatus} /> : null}
        </div>
        {club.description ? (
          <p className="text-muted-foreground max-w-3xl text-sm leading-relaxed">
            {club.description}
          </p>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <InfoCard label="Dates" value={dateLabel} />
        {dailyRateDisplay ? (
          <InfoCard
            label="Daily rate"
            value={
              <span>
                {dailyRateDisplay.value}
                {dailyRateDisplay.footnote ? (
                  <span className="text-muted-foreground mt-1 block text-xs font-normal">
                    {dailyRateDisplay.footnote}
                  </span>
                ) : null}
              </span>
            }
          />
        ) : null}
        <InfoCard
          label="Ages"
          value={`${club.ageMin}–${club.ageMax} years`}
        />
        {hasRating ? (
          <InfoCard
            label="Rating"
            value={
              <span className="inline-flex items-center gap-1">
                <Star className="size-4 fill-amber-400 text-amber-400" />
                {club.ratingAverage?.toFixed(1)} ({club.ratingCount} reviews)
              </span>
            }
          />
        ) : null}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Location</CardTitle>
          <CardDescription>{club.locationName}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          {club.address || directionsUrl ? (
            <div className="flex flex-col items-start gap-2">
              {club.address ? (
                <p className="flex min-w-0 items-start gap-2">
                  <MapPin className="text-muted-foreground mt-0.5 size-4 shrink-0" />
                  <span className="min-w-0 break-words">{club.address}</span>
                </p>
              ) : null}
              {directionsUrl ? (
                <Button variant="outline" size="sm" className="shrink-0" asChild>
                  <a
                    href={directionsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Get directions
                    <ExternalLink className="size-3.5" />
                  </a>
                </Button>
              ) : null}
            </div>
          ) : null}
          {club.distanceKm != null ? (
            <p className="text-muted-foreground">
              {club.distanceKm.toFixed(1)} km away
            </p>
          ) : null}
          <div className="space-y-2">
            <MapLegend variants={["mine", "suggested"]} />
            <ClubMapLazy
              markers={[
                {
                  id: club.id,
                  name: club.name,
                  latitude: club.latitude,
                  longitude: club.longitude,
                  variant: plannedStatus ? "mine" : "suggested",
                },
              ]}
              center={{
                latitude: club.latitude,
                longitude: club.longitude,
              }}
              zoom={13}
              className="h-48"
            />
          </div>
        </CardContent>
      </Card>

      {(club.dailyStartTime || club.dailyEndTime) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Daily schedule</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="inline-flex items-center gap-2 text-sm">
              <Clock className="text-muted-foreground size-4" />
              {club.dailyStartTime ?? "—"} – {club.dailyEndTime ?? "—"}
            </p>
          </CardContent>
        </Card>
      )}

      {club.activities.length > 0 ? (
        <div className="space-y-2">
          <h2 className="text-lg font-semibold">Activities</h2>
          <div className="flex flex-wrap gap-2">
            {club.activities.map((activity) => (
              <Badge key={activity} variant="secondary">
                {activity}
              </Badge>
            ))}
          </div>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {club.isIndoor ? <Badge variant="outline">Indoor</Badge> : null}
        {club.isOutdoor ? <Badge variant="outline">Outdoor</Badge> : null}
        {club.sendFriendly ? (
          <Badge variant="outline" className="gap-1">
            <Users className="size-3" />
            SEND friendly
          </Badge>
        ) : null}
      </div>

      {club.accessibilityNotes ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Accessibility className="size-4" />
              Accessibility
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">
              {club.accessibilityNotes}
            </p>
          </CardContent>
        </Card>
      ) : null}

      {club.bookingUrl ? (
        <Button asChild>
          <a href={club.bookingUrl} target="_blank" rel="noopener noreferrer">
            Book now
            <ExternalLink className="size-4" />
          </a>
        </Button>
      ) : null}

      {onStatusChange ? (
        <>
          <Separator />
          <div className="space-y-3">
            <h2 className="text-lg font-semibold">Your status</h2>
            {bookingSummary ? (
              <p className="text-muted-foreground text-sm">{bookingSummary}</p>
            ) : null}
            <ClubStatusControls
              currentStatus={plannedStatus}
              onStatusChange={onStatusChange}
              onStatusClear={onStatusClear}
              disabled={statusControlsDisabled}
            />
          </div>
        </>
      ) : null}
    </div>
  );
}

function InfoCard({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <Card className="gap-2 py-4">
      <CardHeader className="px-4">
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-base font-medium">{value}</CardTitle>
      </CardHeader>
    </Card>
  );
}
