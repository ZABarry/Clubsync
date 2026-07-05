import { PageHeader } from "@/components/layout/page-header";
import { getChildren } from "@/lib/actions/profiles";
import { syncUser } from "@/lib/auth/server";

import { ProfileView } from "./profile-view";

type SearchParams = Record<string, string | string[] | undefined>;

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const user = await syncUser();
  const profile = user?.parentProfile;

  let children: Awaited<ReturnType<typeof getChildren>> = [];
  if (profile) {
    children = await getChildren();
  }

  return (
    <div>
      <PageHeader
        title="Profile"
        description="Manage your account, children and preferences"
      />
      <ProfileView
        displayName={profile?.displayName ?? ""}
        firstName={profile?.firstName ?? null}
        lastName={profile?.lastName ?? null}
        homePostcode={profile?.homePostcode ?? null}
        defaultSearchRadiusKm={profile?.defaultSearchRadiusKm ?? 10}
        children={children}
        showOnboarding={params.onboarding === "true"}
        showAddChild={params.addChild === "true"}
      />
    </div>
  );
}
