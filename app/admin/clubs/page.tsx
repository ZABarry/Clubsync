import { redirect } from "next/navigation";

import { ClubManagementView } from "@/components/club-management/club-management-view";
import { getManagedClubs } from "@/lib/actions/club-management";
import { syncUser } from "@/lib/auth/server";
import { isReviewerRole } from "@/lib/auth/roles";

export default async function AdminClubsPage() {
  const user = await syncUser();
  if (!user || !isReviewerRole(user.role)) redirect("/");

  const clubs = await getManagedClubs({}, "admin");

  return (
    <ClubManagementView
      mode="admin"
      initialClubs={clubs}
      title="Manage clubs"
      description="Compressed list of all clubs with filters and quick actions."
      listPath="/admin/clubs"
      newPath="/admin/clubs/new"
    />
  );
}
