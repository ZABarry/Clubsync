import { redirect } from "next/navigation";

import { ClubManagementView } from "@/components/club-management/club-management-view";
import { getManagedClubs } from "@/lib/actions/club-management";
import { syncUser } from "@/lib/auth/server";

export default async function MyClubsPage() {
  const user = await syncUser();
  if (!user) redirect("/login");
  if (!user.parentProfile) redirect("/profile?onboarding=true");

  const clubs = await getManagedClubs({}, "personal");

  return (
    <ClubManagementView
      mode="personal"
      initialClubs={clubs}
      defaultLatitude={user.parentProfile.latitude}
      defaultLongitude={user.parentProfile.longitude}
      title="My clubs"
      description="Manage community clubs you have added and submit them for review."
      listPath="/my-clubs"
      newPath="/my-clubs/new"
    />
  );
}
