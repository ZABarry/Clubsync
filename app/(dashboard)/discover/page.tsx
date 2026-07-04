import { PageHeader } from "@/components/layout/page-header";
import { getCamps } from "@/lib/actions/camps";
import { buildMapMarkersForCamps } from "@/lib/actions/map-markers";
import type { CampCalendarEvent, CampFilterValues } from "@/lib/types/camp";
import { campFilterSchema } from "@/lib/validation/schemas";

import { DiscoverView } from "./discover-view";

type SearchParams = Record<string, string | string[] | undefined>;

function parseSearchParams(searchParams: SearchParams): CampFilterValues {
  const raw: Record<string, string> = {};
  for (const [key, value] of Object.entries(searchParams)) {
    if (typeof value === "string") raw[key] = value;
  }
  return campFilterSchema.parse(raw);
}

export default async function DiscoverPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const filters = parseSearchParams(params);
  const camps = await getCamps(filters);

  const calendarEvents: CampCalendarEvent[] = camps.slice(0, 20).map((camp) => ({
    id: camp.id,
    title: camp.name,
    start: camp.startDate,
    end: camp.endDate,
    status: camp.plannedStatus ?? undefined,
    campId: camp.id,
  }));

  const mapMarkers = await buildMapMarkersForCamps(
    camps
      .filter((camp) => camp.latitude != null && camp.longitude != null)
      .slice(0, 30)
      .map((camp) => ({
        id: camp.id,
        name: camp.name,
        latitude: camp.latitude!,
        longitude: camp.longitude!,
      })),
  );

  return (
    <div>
      <PageHeader
        title="Discover camps"
        description="Search and filter clubs and activities near you"
      />
      <DiscoverView
        camps={camps}
        calendarEvents={calendarEvents}
        mapMarkers={mapMarkers}
        defaultFilters={filters}
      />
    </div>
  );
}
