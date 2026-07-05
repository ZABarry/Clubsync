"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { Button } from "@/components/ui/button";
import { markNotificationRead } from "@/lib/actions/notifications";
import { cn } from "@/lib/utils";

type NotificationRow = {
  id: string;
  title: string;
  body: string | null;
  link: string | null;
  readAt: Date | null;
  createdAt: Date;
};

type NotificationsListProps = {
  notifications: NotificationRow[];
};

function formatRelativeTime(date: Date): string {
  const now = Date.now();
  const then = new Date(date).getTime();
  const diffMs = now - then;
  const diffMins = Math.floor(diffMs / 60_000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return new Date(date).toLocaleDateString();
}

export function NotificationsList({ notifications }: NotificationsListProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const openNotification = (notification: NotificationRow) => {
    startTransition(async () => {
      if (!notification.readAt) {
        await markNotificationRead(notification.id);
      }
      router.refresh();
      if (notification.link) {
        router.push(notification.link);
      }
    });
  };

  if (notifications.length === 0) {
    return (
      <div className="rounded-xl border bg-card py-12 text-center">
        <p className="text-muted-foreground text-sm">No notifications yet.</p>
        <p className="text-muted-foreground mt-2 text-xs">
          You&apos;ll be notified about community club reviews and updates to
          your submissions.
        </p>
        <Button variant="outline" size="sm" className="mt-4" asChild>
          <Link href="/my-clubs">Community clubs</Link>
        </Button>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {notifications.map((notification) => (
        <li key={notification.id}>
          <div
            className={cn(
              "rounded-xl border bg-card p-4",
              !notification.readAt && "border-primary/30",
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <p className="font-medium">{notification.title}</p>
              <time
                className="text-muted-foreground shrink-0 text-xs"
                dateTime={new Date(notification.createdAt).toISOString()}
              >
                {formatRelativeTime(notification.createdAt)}
              </time>
            </div>
            {notification.body ? (
              <p className="text-muted-foreground mt-1 text-sm">
                {notification.body}
              </p>
            ) : null}
            {notification.link ? (
              <Button
                variant="link"
                className="h-auto p-0 mt-2"
                onClick={() => openNotification(notification)}
              >
                View
              </Button>
            ) : (
              <Button
                variant="link"
                className="h-auto p-0 mt-2"
                onClick={() => openNotification(notification)}
              >
                Mark read
              </Button>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
