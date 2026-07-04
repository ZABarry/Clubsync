import { PageHeader } from "@/components/layout/page-header";
import { getPlannedClubsForCalendar } from "@/lib/actions/planned-clubs";

import { CalendarView } from "./calendar-view";

export default async function CalendarPage() {
  const events = await getPlannedClubsForCalendar();

  return (
    <div>
      <PageHeader
        title="Calendar"
        description="View and manage your planned clubs"
      />
      <CalendarView events={events} />
    </div>
  );
}
