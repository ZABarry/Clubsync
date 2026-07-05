import { redirect } from "next/navigation";

import { ClubEditPageView } from "@/components/club-management/club-edit-page-view";
import { getAdminProvidersForForm } from "@/lib/actions/club-management";
import { syncUser } from "@/lib/auth/server";
import { isReviewerRole } from "@/lib/auth/roles";

export default async function AdminClubNewPage() {
  const user = await syncUser();
  if (!user || !isReviewerRole(user.role)) redirect("/");

  const providers = await getAdminProvidersForForm();

  return (
    <ClubEditPageView
      mode="admin"
      providers={providers}
      title="Add club"
      cancelHref="/admin/clubs"
    />
  );
}
