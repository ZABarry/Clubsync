import { PageHeader } from "@/components/layout/page-header";
import {
  getFriendActivity,
  getTrustedConnections,
} from "@/lib/actions/friends";
import { getSharedCampsForParent } from "@/lib/actions/shared-camps";

import { FriendsView } from "./friends-view";

export default async function FriendsPage() {
  const [connections, activities, sharedCamps] = await Promise.all([
    getTrustedConnections(),
    getFriendActivity(),
    getSharedCampsForParent(),
  ]);

  return (
    <div>
      <PageHeader
        title="Friends"
        description="Connect with trusted parents and see their camp plans"
      />
      <FriendsView
        connections={connections}
        activities={activities}
        sharedCamps={sharedCamps}
      />
    </div>
  );
}
