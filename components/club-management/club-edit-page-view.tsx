"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { ClubEditForm } from "@/components/club-management/club-edit-form";
import { PageHeader } from "@/components/layout/page-header";
import {
  createManagedClub,
  submitClubForReview,
  updateManagedClub,
} from "@/lib/actions/club-management";
import type { z } from "zod";
import type { clubSchema } from "@/lib/validation/schemas";

type ClubEditPageViewProps = {
  mode: "admin" | "personal";
  clubId?: string;
  providers: { id: string; name: string }[];
  defaultValues?: Partial<z.infer<typeof clubSchema>>;
  promotionStatus?: string;
  reviewNote?: string | null;
  title: string;
  cancelHref: string;
};

export function ClubEditPageView({
  mode,
  clubId,
  providers,
  defaultValues,
  promotionStatus,
  reviewNote,
  title,
  cancelHref,
}: ClubEditPageViewProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [, startTransition] = useTransition();

  const save = (values: z.infer<typeof clubSchema>) => {
    setLoading(true);
    startTransition(async () => {
      try {
        if (clubId) {
          await updateManagedClub(clubId, values, mode);
          toast.success("Club saved");
        } else {
          const club = await createManagedClub(values, mode);
          toast.success("Club created");
          router.push(
            mode === "admin"
              ? `/admin/clubs/${club.id}/edit`
              : `/my-clubs/${club.id}/edit`,
          );
          return;
        }
        router.push(cancelHref);
        router.refresh();
      } catch {
        toast.error("Failed to save club");
      } finally {
        setLoading(false);
      }
    });
  };

  const submitForReview = (submissionNote: string) => {
    if (!clubId) return;
    setLoading(true);
    startTransition(async () => {
      try {
        await submitClubForReview({ clubId, submissionNote });
        toast.success("Submitted for review");
        router.push(cancelHref);
        router.refresh();
      } catch {
        toast.error("Failed to submit for review");
      } finally {
        setLoading(false);
      }
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader title={title} description="Update club details and save when done." />
      <ClubEditForm
        clubId={clubId}
        providers={providers}
        defaultValues={defaultValues}
        mode={mode}
        loading={loading}
        cancelHref={cancelHref}
        onSave={save}
        onSubmitForReview={clubId ? submitForReview : undefined}
        promotionStatus={promotionStatus}
        reviewNote={reviewNote}
      />
    </div>
  );
}
