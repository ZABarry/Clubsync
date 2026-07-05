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
    <div className="grid min-w-0 gap-3">
      {clubs.map((club) => {
        const isDraft = club.status === "DRAFT";
        const isDeleted = club.status === "ARCHIVED";

        return (
        <div
          key={club.id}
          className={cn(
            "relative flex min-w-0 flex-col gap-3 rounded-xl border bg-card p-3 text-card-foreground lg:flex-row lg:items-center",
            isDraft &&
              "border-dashed border-amber-500/50 bg-amber-50/60 dark:bg-amber-950/25",
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
          <div className="flex min-w-0 flex-1 gap-3">
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
              <p
                className={cn(
                  "font-semibold leading-snug line-clamp-2 text-foreground",
                  isDeleted && "text-muted-foreground line-through",
                )}
              >
                {club.name}
              </p>
              <div className="flex flex-wrap items-center gap-1.5">
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
                <p className="text-xs font-medium text-amber-800 dark:text-amber-200">
                  Not published — hidden from Discover
                </p>
              ) : null}
              {isDeleted ? (
                <p className="text-destructive/80 text-xs font-medium">
                  Deleted — removed from all listings
                </p>
              ) : null}
              <p className="text-muted-foreground line-clamp-2 text-sm">
                {club.locationName} · {club.providerName}
              </p>
              {club.distanceKm != null ? (
                <p className="text-muted-foreground inline-flex items-center gap-1 text-xs">
                  <MapPin className="size-3" />
                  {club.distanceKm.toFixed(1)} km away
                </p>
              ) : null}
            </div>
          </div>
          <div className="grid w-full min-w-0 grid-cols-2 gap-1.5 border-t pt-2 lg:flex lg:w-auto lg:max-w-none lg:flex-wrap lg:justify-end lg:gap-1 lg:border-t-0 lg:pt-0 lg:shrink-0">
            <Button
              size="sm"
              variant="outline"
              className="col-span-2 w-full min-w-0 lg:col-span-1 lg:w-auto"
              asChild
            >
              <Link href={`${editBasePath}/${club.id}/edit`}>
                <Pencil className="size-3.5" />
                Edit
              </Link>
            </Button>
            {onPublish && club.status === "DRAFT" ? (
              <Button
                size="sm"
                variant="ghost"
                className="w-full min-w-0 lg:w-auto"
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
                className="w-full min-w-0 lg:w-auto"
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
                className={cn("w-full min-w-0 text-destructive lg:w-auto")}
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
                className="w-full min-w-0 lg:w-auto"
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
