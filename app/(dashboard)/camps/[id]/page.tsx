import { notFound } from "next/navigation";

import { PageHeader } from "@/components/layout/page-header";
import { getCampById } from "@/lib/actions/camps";
import { getFriendActivityForCamp } from "@/lib/actions/friends";
import { getRatingsForCamp } from "@/lib/actions/ratings";
import { getSharedCampsForCamp } from "@/lib/actions/shared-camps";
import { syncUser } from "@/lib/auth/server";

import { CampDetailView } from "./camp-detail-view";

export default async function CampDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await syncUser();
  const camp = await getCampById(id);

  if (!camp) notFound();

  const [ratings, friendActivity, sharedCamps] = await Promise.all([
    getRatingsForCamp(id),
    getFriendActivityForCamp(id).catch(() => []),
    getSharedCampsForCamp(id).catch(() => []),
  ]);

  return (
    <div>
      <PageHeader title={camp.name} />
      <CampDetailView
        camp={camp}
        plannedStatus={camp.plannedStatus ?? null}
        ratings={ratings}
        friendActivity={friendActivity}
        sharedCamps={sharedCamps}
        currentParentId={user?.parentProfile?.id ?? null}
      />
    </div>
  );
}
