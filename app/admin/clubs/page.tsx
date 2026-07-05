import { redirect } from "next/navigation";

import { ClubManagementView } from "@/components/club-management/club-management-view";
import { getManagedClubActivityTypes, getManagedClubs } from "@/lib/actions/club-management";
import { syncUser } from "@/lib/auth/server";
import { isMasterAdminRole, isReviewerRole } from "@/lib/auth/roles";

export default async function AdminClubsPage() {
  const user = await syncUser();
  if (!user || !isReviewerRole(user.role)) redirect("/");

  const [clubs, activityTypes] = await Promise.all([
    getManagedClubs({}, "admin"),
    getManagedClubActivityTypes("admin"),
  ]);

  return (
    <ClubManagementView
      mode="admin"
      initialClubs={clubs}
      activityTypes={activityTypes}
      isMasterAdmin={isMasterAdminRole(user.role)}
      title="Manage clubs"
      description="Compressed list of all clubs with filters and quick actions."
      listPath="/admin/clubs"
      newPath="/admin/clubs/new"
    />
  );
}
