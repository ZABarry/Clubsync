import {
  Calendar,
  Compass,
  Plus,
  Sparkles,
  UserPlus,
  Users,
} from "lucide-react";
import Link from "next/link";

import { CampCalendar } from "@/components/calendar/camp-calendar";
import { CampCard } from "@/components/camp/camp-card";
import { FriendActivityList } from "@/components/camp/friend-activity-list";
import { PageHeader } from "@/components/layout/page-header";
import { CampMap } from "@/components/map/camp-map";
import { MapLegend } from "@/components/map/map-legend";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getCampById, getCamps } from "@/lib/actions/camps";
import { getFriendActivity } from "@/lib/actions/friends";
import { buildMapMarkersForCamps } from "@/lib/actions/map-markers";
import {
  getPlannedCampsForCalendar,
  getPlannedCampsForParent,
} from "@/lib/actions/planned-camps";
import { getDashboardRecommendations } from "@/lib/actions/recommendations";
import { syncUser } from "@/lib/auth/server";
import type { CampMapMarker, PlannedCampStatus } from "@/lib/types/camp";

type PlannedCampRow = {
  id: string;
  status: PlannedCampStatus;
  camp: {
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

  let recommendedCamps: Awaited<ReturnType<typeof getCamps>> = [];
  let upcomingPlanned: PlannedCampRow[] = [];
  let calendarEvents: Awaited<ReturnType<typeof getPlannedCampsForCalendar>> =
    [];
  let friendActivity: Awaited<ReturnType<typeof getFriendActivity>> = [];
  let mapMarkers: CampMapMarker[] = [];

  try {
    recommendedCamps = await getDashboardRecommendations(4);
    if (recommendedCamps.length === 0) {
      const allCamps = await getCamps();
      recommendedCamps = [...allCamps]
        .sort((a, b) => (b.ratingAverage ?? 0) - (a.ratingAverage ?? 0))
        .slice(0, 4);
    }

    const planned = (await getPlannedCampsForParent()) as PlannedCampRow[];
    upcomingPlanned = planned.filter(
      (p) =>
        p.status !== "CANCELLED" &&
        p.camp.startDate != null &&
        new Date(p.camp.startDate) >= new Date(),
    ).slice(0, 4);

    calendarEvents = await getPlannedCampsForCalendar();
    friendActivity = (await getFriendActivity()).slice(0, 5);

    const mapCampIds = [
      ...new Set([
        ...upcomingPlanned.map((p) => p.camp.id),
        ...recommendedCamps.map((c) => c.id),
      ]),
    ].slice(0, 12);

    const campDetails = await Promise.all(
      mapCampIds.map((id) => getCampById(id)),
    );

    mapMarkers = await buildMapMarkersForCamps(
      campDetails
        .filter((c): c is NonNullable<typeof c> => c != null)
        .map((camp) => ({
          id: camp.id,
          name: camp.name,
          latitude: camp.latitude,
          longitude: camp.longitude,
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
        description="Your clubs and activities planning hub"
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
              Add your details and children to get personalised camp
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
            <span>Find camps</span>
          </Link>
        </Button>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Recommended camps</h2>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/discover">View all</Link>
          </Button>
        </div>
        {recommendedCamps.length === 0 ? (
          <Card className="py-8">
            <CardContent className="text-muted-foreground text-center text-sm">
              No camps found yet.{" "}
              <Link href="/discover" className="text-primary hover:underline">
                Explore camps
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {recommendedCamps.map((camp) => (
              <Link key={camp.id} href={`/camps/${camp.id}`}>
                <CampCard camp={camp} />
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
              No upcoming camps planned.{" "}
              <Link href="/discover" className="text-primary hover:underline">
                Find a camp
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {upcomingPlanned.map((planned) => (
              <Link key={planned.id} href={`/camps/${planned.camp.id}`}>
                <CampCard
                  camp={{
                    id: planned.camp.id,
                    name: planned.camp.name,
                    providerName: planned.camp.provider.name,
                    startDate: planned.camp.startDate,
                    endDate: planned.camp.endDate,
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
                Your calendar is empty. Add camps from Discover.
              </CardContent>
            </Card>
          ) : (
            <CampCalendar events={calendarEvents.slice(0, 10)} />
          )}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Nearby camps</h2>
        {mapMarkers.length === 0 ? (
          <Card className="py-8">
            <CardContent className="text-muted-foreground text-center text-sm">
              Set your home postcode in Profile to see camps on the map.
            </CardContent>
          </Card>
        ) : (
          <>
            <MapLegend className="mb-2" />
            <CampMap
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
