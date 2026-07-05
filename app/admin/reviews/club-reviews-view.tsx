"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { ClubImage } from "@/components/club/club-image";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { moderateClubPromotion } from "@/lib/actions/club-management";

type PendingReview = {
  id: string;
  name: string;
  description: string | null;
  locationName: string;
  imageUrl: string | null;
  submissionNote: string | null;
  owner: {
    displayName: string;
    user: { email: string };
  } | null;
};

type ClubReviewsViewProps = {
  clubs: PendingReview[];
};

export function ClubReviewsView({ clubs }: ClubReviewsViewProps) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [denyNotes, setDenyNotes] = useState<Record<string, string>>({});
  const [, startTransition] = useTransition();

  const moderate = (
    clubId: string,
    decision: "APPROVED" | "REJECTED",
  ) => {
    setLoadingId(clubId);
    startTransition(async () => {
      try {
        await moderateClubPromotion({
          clubId,
          decision,
          reviewNote: denyNotes[clubId],
        });
        toast.success(
          decision === "APPROVED" ? "Club approved" : "Club denied",
        );
        router.refresh();
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Moderation failed",
        );
      } finally {
        setLoadingId(null);
      }
    });
  };

  if (clubs.length === 0) {
    return (
      <div className="text-muted-foreground rounded-xl border bg-card py-12 text-center text-sm">
        No clubs pending review.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Club reviews"
        description="Approve or deny community club submissions."
      />
      <div className="space-y-4">
        {clubs.map((club) => (
          <div key={club.id} className="rounded-xl border bg-card p-4">
            <div className="flex flex-col gap-4 sm:flex-row">
              <ClubImage
                clubId={club.id}
                src={club.imageUrl ?? ""}
                alt={club.name}
                wrapperClassName="shrink-0"
                className="aspect-[16/9] w-full rounded-lg object-cover sm:w-48"
              />
              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold">{club.name}</h3>
                  <Badge variant="secondary">Pending</Badge>
                </div>
                <p className="text-muted-foreground text-sm">
                  {club.locationName}
                </p>
                {club.description ? (
                  <p className="text-sm">{club.description}</p>
                ) : null}
                <p className="text-sm">
                  Submitted by{" "}
                  <span className="font-medium">
                    {club.owner?.displayName ?? "Unknown"}
                  </span>
                  {club.owner?.user.email
                    ? ` (${club.owner.user.email})`
                    : null}
                </p>
                {club.submissionNote ? (
                  <div className="rounded-lg bg-muted/50 p-3 text-sm">
                    <p className="font-medium">Submission note</p>
                    <p className="text-muted-foreground mt-1">
                      {club.submissionNote}
                    </p>
                  </div>
                ) : null}
                <Textarea
                  placeholder="Denial note (required if rejecting)…"
                  value={denyNotes[club.id] ?? ""}
                  onChange={(e) =>
                    setDenyNotes((prev) => ({
                      ...prev,
                      [club.id]: e.target.value,
                    }))
                  }
                  rows={2}
                />
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    disabled={loadingId === club.id}
                    onClick={() => moderate(club.id, "APPROVED")}
                  >
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    disabled={loadingId === club.id}
                    onClick={() => moderate(club.id, "REJECTED")}
                  >
                    Deny
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
