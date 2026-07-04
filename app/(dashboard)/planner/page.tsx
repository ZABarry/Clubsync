import { PageHeader } from "@/components/layout/page-header";
import { getTrustedConnections } from "@/lib/actions/friends";
import { getChildren } from "@/lib/actions/profiles";
import type { ChildOption } from "@/lib/types/camp";

import { PlannerView } from "./planner-view";

export default async function PlannerPage() {
  let children: ChildOption[] = [];
  let connections: Awaited<ReturnType<typeof getTrustedConnections>> = [];

  try {
    const childRows = (await getChildren()) as ChildOption[];
    children = childRows.map((c) => ({
      id: c.id,
      nickname: c.nickname,
      age: c.age,
    }));
    connections = await getTrustedConnections();
  } catch {
    // Profile not set up
  }

  const friendOptions = connections
    .filter((c) => c.status === "ACCEPTED")
    .map((c) => ({
      id: c.id,
      displayName: c.displayName,
    }));

  return (
    <div>
      <PageHeader
        title="Smart planner"
        description="Get personalised camp recommendations for your child"
      />
      <PlannerView children={children} friends={friendOptions} />
    </div>
  );
}
