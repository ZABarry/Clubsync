import { PageHeader } from "@/components/layout/page-header";
import { getPendingSubmissions } from "@/lib/actions/admin";
import type { ModerationItem } from "@/lib/types/club";

import { SubmissionsView } from "./submissions-view";

export default async function AdminSubmissionsPage() {
  const submissions = await getPendingSubmissions();

  const items: ModerationItem[] = (
    submissions as Array<{
      id: string;
      clubName: string;
      providerName: string | null;
      notes: string | null;
      createdAt: Date;
      moderationStatus: ModerationItem["status"];
      submittedBy: { displayName: string };
    }>
  ).map((s) => ({
    id: s.id,
    type: "Club submission",
    title: s.clubName,
    submittedBy: s.submittedBy.displayName,
    submittedAt: s.createdAt,
    status: s.moderationStatus,
    preview: s.providerName ?? s.notes ?? undefined,
  }));

  return (
    <div>
      <PageHeader
        title="Club submissions"
        description="Review new clubs submitted by parents"
      />
      <SubmissionsView items={items} />
    </div>
  );
}
