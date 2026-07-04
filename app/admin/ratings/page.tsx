import { PageHeader } from "@/components/layout/page-header";
import { getPendingRatings } from "@/lib/actions/admin";
import type { ModerationItem } from "@/lib/types/camp";

import { RatingsView } from "./ratings-view";

export default async function AdminRatingsPage() {
  const ratings = await getPendingRatings();

  const items: ModerationItem[] = (
    ratings as Array<{
      id: string;
      rating: number;
      reviewText: string | null;
      createdAt: Date;
      moderationStatus: ModerationItem["status"];
      camp: { id: string; name: string };
      parent: { displayName: string };
    }>
  ).map((r) => ({
    id: r.id,
    type: "Rating",
    title: `${r.camp.name} — ${r.rating}/5`,
    submittedBy: r.parent.displayName,
    submittedAt: r.createdAt,
    status: r.moderationStatus,
    preview: r.reviewText ?? undefined,
  }));

  return (
    <div>
      <PageHeader
        title="Ratings moderation"
        description="Approve or reject user ratings and reviews"
      />
      <RatingsView items={items} />
    </div>
  );
}
