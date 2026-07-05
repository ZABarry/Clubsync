import {
  Calendar,
  CalendarDays,
  Compass,
  Plus,
  Sparkles,
  UserPlus,
  Users,
} from "lucide-react";
import Link from "next/link";

import { ClubCard } from "@/components/club/club-card";
import { FriendActivityList } from "@/components/club/friend-activity-list";
import {
  HomeCalendarSection,
  HomeMapSection,
} from "@/components/dashboard/home-interactive-sections";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { EmptyStateCard } from "@/components/ui/empty-state-card";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getClubById } from "@/lib/actions/clubs";
import { getFriendActivity } from "@/lib/actions/friends";
import { buildMapMarkersForClubs } from "@/lib/actions/map-markers";
import {
  getPlannedClubsForCalendar,
  getPlannedClubsForParent,
} from "@/lib/actions/planned-clubs";
import {
  getDashboardRecommendations,
  type DashboardRecommendationsResult,
} from "@/lib/actions/recommendations";
import { RecommendedClubsSection } from "@/components/club/recommended-clubs-section";
import { syncUser } from "@/lib/auth/server";
import type { ClubMapMarker, PlannedClubStatus } from "@/lib/types/club";

type PlannedClubRow = {
  id: string;
  status: PlannedClubStatus;
  club: {
    id: string;
    name: string;
    startDate: Date | string | null;
    endDate: Date | string | null;
    provider: { name: string };
  };
};

export default async function HomePage() {
  const user = await syncUser();
  const displayName = user?.parentProfile?.displayName ?? "there";

  let recommended: DashboardRecommendationsResult = {
    clubs: [],
    offset: 0,
    hasMore: false,
    total: 0,
  };
  let upcomingPlanned: PlannedClubRow[] = [];
  let calendarEvents: Awaited<ReturnType<typeof getPlannedClubsForCalendar>> =
    [];
  let friendActivity: Awaited<ReturnType<typeof getFriendActivity>> = [];
  let mapMarkers: ClubMapMarker[] = [];

  try {
    const [recommendedResult, planned, calendarEventsResult, friendActivityResult] =
      await Promise.all([
        getDashboardRecommendations({ limit: 4, offset: 0 }),
        getPlannedClubsForParent(),
        getPlannedClubsForCalendar(),
        getFriendActivity(),
      ]);

    recommended = recommendedResult;

    const plannedRows = planned as PlannedClubRow[];
    upcomingPlanned = plannedRows.filter(
      (p) =>
        p.status !== "CANCELLED" &&
        p.club.startDate != null &&
        new Date(p.club.startDate) >= new Date(),
    ).slice(0, 4);

    calendarEvents = calendarEventsResult;
    friendActivity = friendActivityResult.slice(0, 5);

    const mapClubIds = [
      ...new Set([
        ...upcomingPlanned.map((p) => p.club.id),
        ...recommended.clubs.map((c) => c.id),
      ]),
    ].slice(0, 12);

    const clubDetails = await Promise.all(
      mapClubIds.map((id) => getClubById(id)),
    );

    mapMarkers = await buildMapMarkersForClubs(
      clubDetails
        .filter((c): c is NonNullable<typeof c> => c != null)
        .map((club) => ({
          id: club.id,
          name: club.name,
          latitude: club.latitude,
          longitude: club.longitude,
        })),
    );
  } catch {
    // Profile may not be set up yet — show onboarding prompts
  }

  const parentLat = user?.parentProfile?.latitude;
  const parentLng = user?.parentProfile?.longitude;

  const needsOnboarding = !user?.parentProfile;

  return (
    <div className="space-y-8">
      <PageHeader
        title={`Hello, ${displayName}`}
        description="The smarter way to discover and organise children's activities."
        actions={
          <Button variant="outline" size="sm" asChild>
            <Link href="/planner">
              <Sparkles className="size-4" />
              Smart planner
            </Link>
          </Button>
        }
      />

      {needsOnboarding ? (
        <Card className="border-primary/30 bg-accent/30">
          <CardHeader>
            <CardTitle className="text-base">Complete your profile</CardTitle>
            <CardDescription>
              Add your details and children to get personalised club
              recommendations.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/profile?onboarding=true">Set up profile</Link>
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <section className="grid gap-3 sm:grid-cols-3">
        <Button variant="outline" className="h-auto flex-col gap-2 py-4" asChild>
          <Link href="/profile?addChild=true">
            <Plus className="size-5" />
            <span>Add child</span>
          </Link>
        </Button>
        <Button variant="outline" className="h-auto flex-col gap-2 py-4" asChild>
          <Link href="/friends">
            <UserPlus className="size-5" />
            <span>Invite friend</span>
          </Link>
        </Button>
        <Button variant="outline" className="h-auto flex-col gap-2 py-4" asChild>
          <Link href="/discover">
            <Compass className="size-5" />
            <span>Find clubs</span>
          </Link>
        </Button>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Nearby clubs</h2>
        <HomeMapSection
          mapMarkers={mapMarkers}
          parentLat={parentLat}
          parentLng={parentLng}
        />
      </section>

      <RecommendedClubsSection initial={recommended} />

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Upcoming plans</h2>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/calendar">
              <Calendar className="size-4" />
              Calendar
            </Link>
          </Button>
        </div>
        {upcomingPlanned.length === 0 ? (
          <EmptyStateCard icon={CalendarDays}>
            <p className="text-muted-foreground text-sm">
              No upcoming clubs planned.{" "}
              <Link href="/discover" className="text-primary hover:underline">
                Find a club
              </Link>
            </p>
          </EmptyStateCard>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {upcomingPlanned.map((planned) => (
              <ClubCard
                key={planned.id}
                club={{
                  id: planned.club.id,
                  name: planned.club.name,
                  providerName: planned.club.provider.name,
                  startDate: planned.club.startDate,
                  endDate: planned.club.endDate,
                  activities: [],
                  plannedStatus: planned.status,
                }}
                detailHref={`/clubs/${planned.club.id}?from=home`}
              />
            ))}
          </div>
        )}
      </section>

      <section className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Friend activity</h2>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/friends">
                <Users className="size-4" />
                Friends
              </Link>
            </Button>
          </div>
          <FriendActivityList activities={friendActivity} from="home" />
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Calendar snapshot</h2>
          <HomeCalendarSection calendarEvents={calendarEvents} />
        </div>
      </section>
    </div>
  );
}
