import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import {
  getNotifications,
  markAllNotificationsRead,
} from "@/lib/actions/notifications";
import { syncUser } from "@/lib/auth/server";
import { redirect } from "next/navigation";

import { NotificationsList } from "./notifications-list";

export default async function NotificationsPage() {
  const user = await syncUser();
  if (!user) redirect("/login");

  const notifications = await getNotifications(50);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Notifications"
        description="Your recent activity."
        actions={
          notifications.some((n) => !n.readAt) ? (
            <form
              action={async () => {
                "use server";
                await markAllNotificationsRead();
              }}
            >
              <Button type="submit" variant="outline" size="sm">
                Mark all read
              </Button>
            </form>
          ) : undefined
        }
      />
      <NotificationsList notifications={notifications} />
    </div>
  );
}
