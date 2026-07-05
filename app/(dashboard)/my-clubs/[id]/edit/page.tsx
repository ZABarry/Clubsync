import { redirect } from "next/navigation";

import { ClubEditPageView } from "@/components/club-management/club-edit-page-view";
import {
  getAdminProvidersForForm,
  getClubForEdit,
} from "@/lib/actions/club-management";
import { syncUser } from "@/lib/auth/server";

function clubToFormDefaults(club: Awaited<ReturnType<typeof getClubForEdit>>) {
  return {
    providerId: club.providerId,
    name: club.name,
    description: club.description ?? "",
    locationName: club.locationName,
    address: club.address ?? "",
    latitude: club.latitude,
    longitude: club.longitude,
    activities: club.activities,
    ageMin: club.ageMin,
    ageMax: club.ageMax,
    startDate: club.startDate
      ? new Date(club.startDate).toISOString().slice(0, 10)
      : "",
    endDate: club.endDate
      ? new Date(club.endDate).toISOString().slice(0, 10)
      : "",
    dailyStartTime: club.dailyStartTime ?? "",
    dailyEndTime: club.dailyEndTime ?? "",
    price: club.price ?? undefined,
    dailyRate: club.dailyRate ?? undefined,
    priceNote: club.priceNote ?? "",
    bookingUrl: club.bookingUrl ?? "",
    imageUrl: club.imageUrl ?? "",
    sourceUrl: club.sourceUrl ?? "",
    dataConfidence: club.dataConfidence ?? "",
    region: club.region,
    status: club.status,
    isIndoor: club.isIndoor,
    isOutdoor: club.isOutdoor,
    sendFriendly: club.sendFriendly,
    accessibilityNotes: club.accessibilityNotes ?? "",
  };
}

export default async function MyClubEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await syncUser();
  if (!user?.parentProfile) redirect("/profile?onboarding=true");

  const { id } = await params;
  const [club, providers] = await Promise.all([
    getClubForEdit(id, "personal"),
    getAdminProvidersForForm(),
  ]);

  return (
    <ClubEditPageView
      mode="personal"
      clubId={club.id}
      providers={providers}
      defaultValues={clubToFormDefaults(club)}
      promotionStatus={club.promotionStatus}
      reviewNote={club.reviewNote}
      title={`Edit ${club.name}`}
      cancelHref="/my-clubs"
    />
  );
}
