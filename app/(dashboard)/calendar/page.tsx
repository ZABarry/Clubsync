import { PageHeader } from "@/components/layout/page-header";
import { getPlannedCampsForCalendar } from "@/lib/actions/planned-camps";

import { CalendarView } from "./calendar-view";

export default async function CalendarPage() {
  const events = await getPlannedCampsForCalendar();

  return (
    <div>
      <PageHeader
        title="Calendar"
        description="View and manage your planned camps"
      />
      <CalendarView events={events} />
    </div>
  );
}
