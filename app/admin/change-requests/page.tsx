import { PageHeader } from "@/components/layout/page-header";
import { getPendingChangeRequests } from "@/lib/actions/admin";
import type { ModerationItem } from "@/lib/types/camp";

import { ChangeRequestsView } from "./change-requests-view";

export default async function AdminChangeRequestsPage() {
  const requests = await getPendingChangeRequests();

  const items: ModerationItem[] = (
    requests as Array<{
      id: string;
      fieldName: string;
      suggestedValue: string;
      createdAt: Date;
      moderationStatus: ModerationItem["status"];
      camp: { id: string; name: string };
      submittedBy: { displayName: string };
    }>
  ).map((r) => ({
    id: r.id,
    type: "Change request",
    title: `${r.camp.name} — ${r.fieldName}`,
    submittedBy: r.submittedBy.displayName,
    submittedAt: r.createdAt,
    status: r.moderationStatus,
    preview: r.suggestedValue,
  }));

  return (
    <div>
      <PageHeader
        title="Change requests"
        description="Review suggested updates to camp listings"
      />
      <ChangeRequestsView items={items} />
    </div>
  );
}
