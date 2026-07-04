import { PageHeader } from "@/components/layout/page-header";
import { getClubs } from "@/lib/actions/clubs";
import { buildMapMarkersForClubs } from "@/lib/actions/map-markers";
import type { ClubCalendarEvent, ClubFilterValues } from "@/lib/types/club";
import { clubFilterSchema } from "@/lib/validation/schemas";

import { DiscoverView } from "./discover-view";

type SearchParams = Record<string, string | string[] | undefined>;

function parseSearchParams(searchParams: SearchParams): ClubFilterValues {
  const raw: Record<string, string> = {};
  for (const [key, value] of Object.entries(searchParams)) {
    if (typeof value === "string") raw[key] = value;
  }
  return clubFilterSchema.parse(raw);
}

export default async function DiscoverPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const filters = parseSearchParams(params);
  const clubs = await getClubs(filters);

  const calendarEvents: ClubCalendarEvent[] = clubs.slice(0, 20).map((club) => ({
    id: club.id,
    title: club.name,
    start: club.startDate,
    end: club.endDate,
    status: club.plannedStatus ?? undefined,
    clubId: club.id,
  }));

  const mapMarkers = await buildMapMarkersForClubs(
    clubs
      .filter((club) => club.latitude != null && club.longitude != null)
      .slice(0, 30)
      .map((club) => ({
        id: club.id,
        name: club.name,
        latitude: club.latitude!,
        longitude: club.longitude!,
      })),
  );

  return (
    <div>
      <PageHeader
        title="Discover clubs"
        description="Search and filter clubs and activities near you"
      />
      <DiscoverView
        clubs={clubs}
        calendarEvents={calendarEvents}
        mapMarkers={mapMarkers}
        defaultFilters={filters}
      />
    </div>
  );
}
