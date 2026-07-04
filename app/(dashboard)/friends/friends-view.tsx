"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

import { FriendActivityList } from "@/components/club/friend-activity-list";
import { ConnectionList } from "@/components/friends/connection-list";
import { InviteButton } from "@/components/friends/invite-button";
import {
  SharedClubList,
  type SharedClubSummary,
} from "@/components/friends/shared-club-list";
import { Button } from "@/components/ui/button";
import {
  createInviteLink,
  revokeConnection,
} from "@/lib/actions/friends";
import type { FriendClubActivity } from "@/lib/privacy/friend-visibility";
import type { TrustedConnection } from "@/lib/types/club";

type FriendsViewProps = {
  connections: TrustedConnection[];
  activities: FriendClubActivity[];
  sharedClubs: SharedClubSummary[];
};

export function FriendsView({ connections, activities, sharedClubs }: FriendsViewProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const handleCreateInvite = async () => {
    const { inviteToken } = await createInviteLink();
    return inviteToken;
  };

  const handleRevoke = (connectionId: string) => {
    startTransition(async () => {
      try {
        await revokeConnection(connectionId);
        toast.success("Connection removed");
        router.refresh();
      } catch {
        toast.error("Failed to remove connection");
      }
    });
  };

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Invite a friend</h2>
        <p className="text-muted-foreground text-sm">
          Share a link with another parent to connect as trusted friends.
        </p>
        <InviteButton onCreateInvite={handleCreateInvite} />
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Connections</h2>
        <ConnectionList
          connections={connections}
          actions={(connection) =>
            connection.status === "ACCEPTED" ? (
              <Button
                variant="ghost"
                size="sm"
                disabled={pending}
                onClick={() => handleRevoke(connection.id)}
              >
                Remove
              </Button>
            ) : null
          }
        />
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Shared clubs</h2>
        <SharedClubList sharedClubs={sharedClubs} />
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Friend activity</h2>
        <FriendActivityList activities={activities} />
      </section>
    </div>
  );
}
