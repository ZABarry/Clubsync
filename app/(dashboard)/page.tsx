import {
  Calendar,
  Compass,
  Plus,
  Sparkles,
  UserPlus,
  Users,
} from "lucide-react";
import Link from "next/link";

import { ClubCalendar } from "@/components/calendar/club-calendar";
import { ClubCard } from "@/components/club/club-card";
import { FriendActivityList } from "@/components/club/friend-activity-list";
import { PageHeader } from "@/components/layout/page-header";
import { ClubMap } from "@/components/map/club-map";
import { MapLegend } from "@/components/map/map-legend";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getClubById, getClubs } from "@/lib/actions/clubs";
import { getFriendActivity } from "@/lib/actions/friends";
import { buildMapMarkersForClubs } from "@/lib/actions/map-markers";
import {
  getPlannedClubsForCalendar,
  getPlannedClubsForParent,
} from "@/lib/actions/planned-clubs";
import { getDashboardRecommendations } from "@/lib/actions/recommendations";
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

  let recommendedClubs: Awaited<ReturnType<typeof getClubs>> = [];
  let upcomingPlanned: PlannedClubRow[] = [];
  let calendarEvents: Awaited<ReturnType<typeof getPlannedClubsForCalendar>> =
    [];
  let friendActivity: Awaited<ReturnType<typeof getFriendActivity>> = [];
  let mapMarkers: ClubMapMarker[] = [];

  try {
    recommendedClubs = await getDashboardRecommendations(4);
    if (recommendedClubs.length === 0) {
      const allClubs = await getClubs();
      recommendedClubs = [...allClubs]
        .sort((a, b) => (b.ratingAverage ?? 0) - (a.ratingAverage ?? 0))
        .slice(0, 4);
    }

    const planned = (await getPlannedClubsForParent()) as PlannedClubRow[];
    upcomingPlanned = planned.filter(
      (p) =>
        p.status !== "CANCELLED" &&
        p.club.startDate != null &&
        new Date(p.club.startDate) >= new Date(),
    ).slice(0, 4);

    calendarEvents = await getPlannedClubsForCalendar();
    friendActivity = (await getFriendActivity()).slice(0, 5);

    const mapClubIds = [
      ...new Set([
        ...upcomingPlanned.map((p) => p.club.id),
        ...recommendedClubs.map((c) => c.id),
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
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Recommended clubs</h2>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/discover">View all</Link>
          </Button>
        </div>
        {recommendedClubs.length === 0 ? (
          <Card className="py-8">
            <CardContent className="text-muted-foreground text-center text-sm">
              No clubs found yet.{" "}
              <Link href="/discover" className="text-primary hover:underline">
                Explore clubs
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {recommendedClubs.map((club) => (
              <Link key={club.id} href={`/clubs/${club.id}`}>
                <ClubCard club={club} />
              </Link>
            ))}
          </div>
        )}
      </section>

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
          <Card className="py-8">
            <CardContent className="text-muted-foreground text-center text-sm">
              No upcoming clubs planned.{" "}
              <Link href="/discover" className="text-primary hover:underline">
                Find a club
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {upcomingPlanned.map((planned) => (
              <Link key={planned.id} href={`/clubs/${planned.club.id}`}>
                <ClubCard
                  club={{
                    id: planned.club.id,
                    name: planned.club.name,
                    providerName: planned.club.provider.name,
                    startDate: planned.club.startDate,
                    endDate: planned.club.endDate,
                    activities: [],
                    plannedStatus: planned.status,
                  }}
                />
              </Link>
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
          <FriendActivityList activities={friendActivity} />
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Calendar snapshot</h2>
          {calendarEvents.length === 0 ? (
            <Card className="py-8">
              <CardContent className="text-muted-foreground text-center text-sm">
                Your calendar is empty. Add clubs from Discover.
              </CardContent>
            </Card>
          ) : (
            <ClubCalendar events={calendarEvents.slice(0, 10)} />
          )}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Nearby clubs</h2>
        {mapMarkers.length === 0 ? (
          <Card className="py-8">
            <CardContent className="text-muted-foreground text-center text-sm">
              Set your home postcode in Profile to see clubs on the map.
            </CardContent>
          </Card>
        ) : (
          <>
            <MapLegend className="mb-2" />
            <ClubMap
              markers={mapMarkers}
              center={
                parentLat != null && parentLng != null
                  ? { latitude: parentLat, longitude: parentLng }
                  : undefined
              }
              className="h-64"
            />
          </>
        )}
      </section>
    </div>
  );
}
