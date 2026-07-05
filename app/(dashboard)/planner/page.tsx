import { PageHeader } from "@/components/layout/page-header";
import { getTrustedConnections } from "@/lib/actions/friends";
import { getChildren } from "@/lib/actions/profiles";
import type { ChildOption } from "@/lib/types/club";

import { PlannerView } from "./planner-view";

export default async function PlannerPage() {
  let children: ChildOption[] = [];
  let connections: Awaited<ReturnType<typeof getTrustedConnections>> = [];

  try {
    const [childRows, connectionsResult] = await Promise.all([
      getChildren(),
      getTrustedConnections(),
    ]);

    children = (childRows as ChildOption[]).map((c) => ({
      id: c.id,
      nickname: c.nickname,
      age: c.age,
    }));
    connections = connectionsResult;
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
        description="Get personalised club recommendations for your child"
      />
      <PlannerView children={children} friends={friendOptions} />
    </div>
  );
}
