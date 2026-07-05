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
  onArchive?: (clubId: string) => void;
  pendingId?: string | null;
};

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: "Active",
  DRAFT: "Draft",
  ARCHIVED: "Archived",
};

const PROMOTION_LABEL: Record<string, string> = {
  OFFICIAL: "Official",
  LOCAL: "Community",
  PENDING: "Pending review",
  DENIED: "Denied",
};

export function ClubCompactList({
  clubs,
  editBasePath,
  onDeactivate,
  onArchive,
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
      {clubs.map((club) => (
        <div
          key={club.id}
          className="flex gap-3 rounded-xl border bg-card p-3 sm:items-center"
        >
          <ClubImage
            clubId={club.id}
            src={club.imageUrl}
            alt={club.name}
            wrapperClassName="shrink-0"
            className="size-16 rounded-md object-cover sm:size-20"
          />
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="truncate font-medium">{club.name}</p>
              <Badge variant="outline">{STATUS_LABEL[club.status]}</Badge>
              <Badge
                variant={
                  club.promotionStatus === "PENDING" ? "secondary" : "outline"
                }
              >
                {PROMOTION_LABEL[club.promotionStatus]}
              </Badge>
            </div>
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
          </div>
        </div>
      ))}
    </div>
  );
}
