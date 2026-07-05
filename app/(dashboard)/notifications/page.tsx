import Link from "next/link";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import {
  getNotifications,
  markAllNotificationsRead,
} from "@/lib/actions/notifications";
import { syncUser } from "@/lib/auth/server";
import { redirect } from "next/navigation";

export default async function NotificationsPage() {
  const user = await syncUser();
  if (!user) redirect("/login");

  const notifications = await getNotifications(50);

  return (
    <div className="space-y-6">
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
      <div className="space-y-3">
        {notifications.length === 0 ? (
          <p className="text-muted-foreground text-sm">No notifications yet.</p>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification.id}
              className={`rounded-xl border bg-card p-4 ${!notification.readAt ? "border-primary/30" : ""}`}
            >
              <p className="font-medium">{notification.title}</p>
              {notification.body ? (
                <p className="text-muted-foreground mt-1 text-sm">
                  {notification.body}
                </p>
              ) : null}
              {notification.link ? (
                <Button variant="link" className="h-auto p-0 mt-2" asChild>
                  <Link href={notification.link}>View</Link>
                </Button>
              ) : null}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
