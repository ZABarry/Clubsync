"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { ModerationQueue } from "@/components/admin/moderation-queue";
import { moderateRating } from "@/lib/actions/admin";
import type { ModerationItem } from "@/lib/types/club";

type RatingsViewProps = {
  items: ModerationItem[];
};

export function RatingsView({ items }: RatingsViewProps) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const moderate = (item: ModerationItem, status: "APPROVED" | "REJECTED") => {
    setLoadingId(item.id);
    startTransition(async () => {
      try {
        await moderateRating(item.id, status);
        toast.success(status === "APPROVED" ? "Rating approved" : "Rating rejected");
        router.refresh();
      } catch {
        toast.error("Failed to moderate rating");
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
      emptyMessage="No pending ratings to review."
    />
  );
}
