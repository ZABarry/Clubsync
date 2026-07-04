import { notFound } from "next/navigation";

import { PageHeader } from "@/components/layout/page-header";
import { getSharedCamp } from "@/lib/actions/shared-camps";
import { syncUser } from "@/lib/auth/server";

import { SharedCampView } from "./shared-camp-view";

export default async function SharedCampPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await syncUser();
  const profileId = user?.parentProfile?.id;

  if (!profileId) notFound();

  let sharedCamp;
  try {
    sharedCamp = await getSharedCamp(id);
  } catch {
    notFound();
  }

  if (!sharedCamp) notFound();

  return (
    <div>
      <PageHeader title="Shared camp" />
      <SharedCampView
        sharedCamp={sharedCamp}
        currentParentId={profileId}
      />
    </div>
  );
}
