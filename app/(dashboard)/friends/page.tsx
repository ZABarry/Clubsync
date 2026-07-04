import { PageHeader } from "@/components/layout/page-header";
import {
  getFriendActivity,
  getTrustedConnections,
} from "@/lib/actions/friends";
import { getSharedClubsForParent } from "@/lib/actions/shared-clubs";

import { FriendsView } from "./friends-view";

export default async function FriendsPage() {
  const [connections, activities, sharedClubs] = await Promise.all([
    getTrustedConnections(),
    getFriendActivity(),
    getSharedClubsForParent(),
  ]);

  return (
    <div>
      <PageHeader
        title="Friends"
        description="Connect with trusted parents and see their club plans"
      />
      <FriendsView
        connections={connections}
        activities={activities}
        sharedClubs={sharedClubs}
      />
    </div>
  );
}
