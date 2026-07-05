import { redirect } from "next/navigation";

import { ClubManagementView } from "@/components/club-management/club-management-view";
import { getManagedClubActivityTypes, getManagedClubs } from "@/lib/actions/club-management";
import { syncUser } from "@/lib/auth/server";

export default async function MyClubsPage() {
  const user = await syncUser();
  if (!user) redirect("/login");
  if (!user.parentProfile) redirect("/profile?onboarding=true");

  const [clubs, activityTypes] = await Promise.all([
    getManagedClubs({}, "personal"),
    getManagedClubActivityTypes("personal"),
  ]);

  return (
    <ClubManagementView
      mode="personal"
      initialClubs={clubs}
      activityTypes={activityTypes}
      defaultLatitude={user.parentProfile.latitude}
      defaultLongitude={user.parentProfile.longitude}
      title="Community clubs"
      description="Manage community clubs you have added and submit them for review."
      listPath="/my-clubs"
      newPath="/my-clubs/new"
    />
  );
}
