import { redirect } from "next/navigation";

import { ClubEditPageView } from "@/components/club-management/club-edit-page-view";
import { getAdminProvidersForForm } from "@/lib/actions/club-management";
import { syncUser } from "@/lib/auth/server";

export default async function MyClubNewPage() {
  const user = await syncUser();
  if (!user?.parentProfile) redirect("/profile?onboarding=true");

  const providers = await getAdminProvidersForForm();

  return (
    <ClubEditPageView
      mode="personal"
      providers={providers}
      title="Add community club"
      cancelHref="/my-clubs"
    />
  );
}
