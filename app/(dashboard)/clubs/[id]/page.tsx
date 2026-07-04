import { notFound } from "next/navigation";

import { getClubById } from "@/lib/actions/clubs";
import { getFriendActivityForClub } from "@/lib/actions/friends";
import { getRatingsForClub } from "@/lib/actions/ratings";
import { getSharedClubsForClub } from "@/lib/actions/shared-clubs";
import { requireAuth } from "@/lib/auth/server";
import { PageHeader } from "@/components/layout/page-header";

import { ClubDetailView } from "./club-detail-view";

export default async function ClubDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireAuth();

  const club = await getClubById(id);

  if (!club) notFound();

  const [ratings, friendActivity, sharedClubs] = await Promise.all([
    getRatingsForClub(id),
    getFriendActivityForClub(id).catch(() => []),
    getSharedClubsForClub(id).catch(() => []),
  ]);

  return (
    <>
      <PageHeader title={club.name} />
      <ClubDetailView
        club={club}
        plannedStatus={club.plannedStatus ?? null}
        ratings={ratings}
        friendActivity={friendActivity}
        sharedClubs={sharedClubs}
        currentParentId={user.parentProfile?.id ?? null}
      />
    </>
  );
}
