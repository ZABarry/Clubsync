"use client";

import Link from "next/link";
import { MapPin, Pencil } from "lucide-react";

import { ClubImage } from "@/components/club/club-image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ManagedClubListItem } from "@/lib/actions/club-management";
import { cn } from "@/lib/utils";

type ClubCompactListProps = {
  clubs: ManagedClubListItem[];
  editBasePath: string;
  onDeactivate?: (clubId: string) => void;
  onPublish?: (clubId: string) => void;
  onArchive?: (clubId: string) => void;
  onReinstate?: (clubId: string) => void;
  pendingId?: string | null;
};

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: "Published",
  DRAFT: "Draft",
  ARCHIVED: "Deleted",
};

const PROMOTION_LABEL: Record<string, string> = {
  OFFICIAL: "Official",
  LOCAL: "Community",
  PENDING: "Pending review",
  DENIED: "Denied",
};

function statusBadgeClass(status: string) {
  switch (status) {
    case "DRAFT":
      return "border-amber-500/35 bg-amber-500/15 text-amber-900 dark:text-amber-100";
    case "ARCHIVED":
      return "border-destructive/30 bg-destructive/10 text-destructive";
    default:
      return "";
  }
}

export function ClubCompactList({
  clubs,
  editBasePath,
  onDeactivate,
  onPublish,
  onArchive,
  onReinstate,
  pendingId,
}: ClubCompactListProps) {
  if (clubs.length === 0) {
    return (
      <div className="text-muted-foreground rounded-xl border bg-card py-12 text-center text-sm">
        No clubs found.
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {clubs.map((club) => {
        const isDraft = club.status === "DRAFT";
        const isDeleted = club.status === "ARCHIVED";

        return (
        <div
          key={club.id}
          className={cn(
            "relative flex gap-3 rounded-xl border bg-card p-3 sm:items-center",
            isDraft &&
              "border-dashed border-amber-500/45 bg-amber-500/[0.06]",
            isDeleted &&
              "border-dashed border-destructive/35 bg-destructive/[0.04] opacity-80",
          )}
        >
          {isDraft ? (
            <span
              className="absolute inset-y-0 left-0 w-1 rounded-l-xl bg-amber-500"
              aria-hidden
            />
          ) : null}
          {isDeleted ? (
            <span
              className="absolute inset-y-0 left-0 w-1 rounded-l-xl bg-destructive"
              aria-hidden
            />
          ) : null}
          <ClubImage
            clubId={club.id}
            src={club.imageUrl}
            alt={club.name}
            wrapperClassName="shrink-0"
            className={cn(
              "size-16 rounded-md object-cover sm:size-20",
              isDraft && "opacity-80 saturate-50",
              isDeleted && "opacity-60 grayscale",
            )}
          />
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <p
                className={cn(
                  "truncate font-medium",
                  isDraft && "text-amber-950 dark:text-amber-50",
                  isDeleted && "text-muted-foreground line-through",
                )}
              >
                {club.name}
              </p>
              <Badge
                variant="outline"
                className={statusBadgeClass(club.status)}
              >
                {STATUS_LABEL[club.status]}
              </Badge>
              <Badge
                variant={
                  club.promotionStatus === "PENDING" ? "secondary" : "outline"
                }
              >
                {PROMOTION_LABEL[club.promotionStatus]}
              </Badge>
            </div>
            {isDraft ? (
              <p className="text-xs font-medium text-amber-800/80 dark:text-amber-200/80">
                Not published — hidden from Discover
              </p>
            ) : null}
            {isDeleted ? (
              <p className="text-destructive/80 text-xs font-medium">
                Deleted — removed from all listings
              </p>
            ) : null}
            <p className="text-muted-foreground truncate text-sm">
              {club.locationName} · {club.providerName}
            </p>
            {club.distanceKm != null ? (
              <p className="text-muted-foreground inline-flex items-center gap-1 text-xs">
                <MapPin className="size-3" />
                {club.distanceKm.toFixed(1)} km away
              </p>
            ) : null}
          </div>
          <div className="flex shrink-0 flex-col gap-1 sm:flex-row">
            <Button size="sm" variant="outline" asChild>
              <Link href={`${editBasePath}/${club.id}/edit`}>
                <Pencil className="size-3.5" />
                Edit
              </Link>
            </Button>
            {onPublish && club.status === "DRAFT" ? (
              <Button
                size="sm"
                variant="ghost"
                disabled={pendingId === club.id}
                onClick={() => onPublish(club.id)}
              >
                Publish
              </Button>
            ) : null}
            {onDeactivate && club.status === "ACTIVE" ? (
              <Button
                size="sm"
                variant="ghost"
                disabled={pendingId === club.id}
                onClick={() => onDeactivate(club.id)}
              >
                Deactivate
              </Button>
            ) : null}
            {onArchive && club.status !== "ARCHIVED" ? (
              <Button
                size="sm"
                variant="ghost"
                className={cn("text-destructive")}
                disabled={pendingId === club.id}
                onClick={() => onArchive(club.id)}
              >
                Delete
              </Button>
            ) : null}
            {onReinstate && club.status === "ARCHIVED" ? (
              <Button
                size="sm"
                variant="ghost"
                disabled={pendingId === club.id}
                onClick={() => onReinstate(club.id)}
              >
                Reinstate
              </Button>
            ) : null}
          </div>
        </div>
        );
      })}
    </div>
  );
}
