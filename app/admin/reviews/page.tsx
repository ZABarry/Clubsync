import { redirect } from "next/navigation";

import { ClubReviewsView } from "./club-reviews-view";
import { getPendingClubReviews } from "@/lib/actions/club-management";
import { syncUser } from "@/lib/auth/server";
import { isReviewerRole } from "@/lib/auth/roles";

export default async function AdminReviewsPage() {
  const user = await syncUser();
  if (!user || !isReviewerRole(user.role)) redirect("/");

  const clubs = await getPendingClubReviews();

  return <ClubReviewsView clubs={clubs} />;
}
