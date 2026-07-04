"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { ModerationQueue } from "@/components/admin/moderation-queue";
import { moderateSubmission } from "@/lib/actions/admin";
import type { ModerationItem } from "@/lib/types/club";

type SubmissionsViewProps = {
  items: ModerationItem[];
};

export function SubmissionsView({ items }: SubmissionsViewProps) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const moderate = (item: ModerationItem, status: "APPROVED" | "REJECTED") => {
    setLoadingId(item.id);
    startTransition(async () => {
      try {
        await moderateSubmission(item.id, status);
        toast.success(status === "APPROVED" ? "Submission approved" : "Submission rejected");
        router.refresh();
      } catch {
        toast.error("Failed to moderate submission");
      } finally {
        setLoadingId(null);
      }
    });
  };

  return (
    <ModerationQueue
      items={items}
      loadingId={loadingId}
      onApprove={(item) => moderate(item, "APPROVED")}
      onReject={(item) => moderate(item, "REJECTED")}
      emptyMessage="No pending club submissions."
    />
  );
}
