import { notFound } from "next/navigation";

import { getSharedClub } from "@/lib/actions/shared-clubs";
import { requireAuth } from "@/lib/auth/server";
import { PageHeader } from "@/components/layout/page-header";

import { SharedClubView } from "./shared-club-view";

export default async function SharedClubPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireAuth();
  const currentParentId = user.parentProfile?.id ?? "";

  let sharedClub;
  try {
    sharedClub = await getSharedClub(id);
  } catch {
    notFound();
  }

  if (!sharedClub) notFound();

  return (
    <>
      <PageHeader title="Shared club" />
      <SharedClubView
        sharedClub={sharedClub}
        currentParentId={currentParentId}
      />
    </>
  );
}
