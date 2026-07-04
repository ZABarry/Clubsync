import {
  Accessibility,
  Clock,
  ExternalLink,
  MapPin,
  Star,
  Users,
} from "lucide-react";

import { CampStatusBadge } from "@/components/camp/camp-status-badge";
import { CampStatusControls } from "@/components/camp/camp-status-controls";
import { CampMap } from "@/components/map/camp-map";
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
import type { CampDetailData, PlannedCampStatus } from "@/lib/types/camp";
import { cn, formatOptionalDateRange, formatPrice } from "@/lib/utils";

type CampDetailProps = {
  camp: CampDetailData;
  plannedStatus?: PlannedCampStatus | null;
  onStatusChange?: (status: PlannedCampStatus) => void;
  statusControlsDisabled?: boolean;
  className?: string;
};

export function CampDetail({
  camp,
  plannedStatus,
  onStatusChange,
  statusControlsDisabled,
  className,
}: CampDetailProps) {
  const dateLabel = formatOptionalDateRange(camp.startDate, camp.endDate);
  const hasRating = (camp.ratingCount ?? 0) > 0;

  return (
    <div className={cn("space-y-6", className)}>
      {camp.imageUrl ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={camp.imageUrl}
          alt=""
          className="aspect-[21/9] w-full rounded-xl object-cover"
        />
      ) : null}

      <div className="space-y-2">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {camp.name}
            </h1>
            <p className="text-muted-foreground">{camp.providerName}</p>
          </div>
          {plannedStatus ? <CampStatusBadge status={plannedStatus} /> : null}
        </div>
        {camp.description ? (
          <p className="text-muted-foreground max-w-3xl text-sm leading-relaxed">
            {camp.description}
          </p>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <InfoCard label="Dates" value={dateLabel} />
        <InfoCard label="Price" value={formatPrice(camp.price)} />
        <InfoCard
          label="Ages"
          value={`${camp.ageMin}–${camp.ageMax} years`}
        />
        {hasRating ? (
          <InfoCard
            label="Rating"
            value={
              <span className="inline-flex items-center gap-1">
                <Star className="size-4 fill-amber-400 text-amber-400" />
                {camp.ratingAverage?.toFixed(1)} ({camp.ratingCount} reviews)
              </span>
            }
          />
        ) : null}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Location</CardTitle>
          <CardDescription>{camp.locationName}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          {camp.address ? (
            <p className="inline-flex items-start gap-2">
              <MapPin className="text-muted-foreground mt-0.5 size-4 shrink-0" />
              {camp.address}
            </p>
          ) : null}
          {camp.distanceKm != null ? (
            <p className="text-muted-foreground">
              {camp.distanceKm.toFixed(1)} km away
            </p>
          ) : null}
          <div className="space-y-2">
            <MapLegend variants={["mine", "suggested"]} />
            <CampMap
              markers={[
                {
                  id: camp.id,
                  name: camp.name,
                  latitude: camp.latitude,
                  longitude: camp.longitude,
                  variant: plannedStatus ? "mine" : "suggested",
                },
              ]}
              center={{
                latitude: camp.latitude,
                longitude: camp.longitude,
              }}
              zoom={13}
              className="h-48"
            />
          </div>
        </CardContent>
      </Card>

      {(camp.dailyStartTime || camp.dailyEndTime) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Daily schedule</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="inline-flex items-center gap-2 text-sm">
              <Clock className="text-muted-foreground size-4" />
              {camp.dailyStartTime ?? "—"} – {camp.dailyEndTime ?? "—"}
            </p>
          </CardContent>
        </Card>
      )}

      {camp.activities.length > 0 ? (
        <div className="space-y-2">
          <h2 className="text-sm font-medium">Activities</h2>
          <div className="flex flex-wrap gap-2">
            {camp.activities.map((activity) => (
              <Badge key={activity} variant="secondary">
                {activity}
              </Badge>
            ))}
          </div>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {camp.isIndoor ? <Badge variant="outline">Indoor</Badge> : null}
        {camp.isOutdoor ? <Badge variant="outline">Outdoor</Badge> : null}
        {camp.sendFriendly ? (
          <Badge variant="outline" className="gap-1">
            <Users className="size-3" />
            SEND friendly
          </Badge>
        ) : null}
      </div>

      {camp.accessibilityNotes ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Accessibility className="size-4" />
              Accessibility
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">
              {camp.accessibilityNotes}
            </p>
          </CardContent>
        </Card>
      ) : null}

      {onStatusChange ? (
        <>
          <Separator />
          <div className="space-y-3">
            <h2 className="text-sm font-medium">Your status</h2>
            <CampStatusControls
              currentStatus={plannedStatus}
              onStatusChange={onStatusChange}
              disabled={statusControlsDisabled}
            />
          </div>
        </>
      ) : null}

      {camp.bookingUrl ? (
        <Button asChild>
          <a href={camp.bookingUrl} target="_blank" rel="noopener noreferrer">
            Book now
            <ExternalLink className="size-4" />
          </a>
        </Button>
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
