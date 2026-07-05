import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { isDbConnectionError } from "@/lib/db/errors";
import { getNotifications, getUnreadNotificationCount } from "@/lib/actions/notifications";
import { syncUser } from "@/lib/auth/server";
import { showAdminNav } from "@/lib/auth/server";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let user;
  try {
    user = await syncUser();
  } catch (error) {
    if (isDbConnectionError(error)) redirect("/setup");
    throw error;
  }
  if (!user) redirect("/login");

  const pathname = (await headers()).get("x-pathname") ?? "";
  if (!user.parentProfile && !pathname.startsWith("/profile")) {
    redirect("/profile?onboarding=true");
  }

  const [notifications, unreadCount] = await Promise.all([
    getNotifications(8),
    getUnreadNotificationCount(),
  ]);

  return (
    <AppShell
      showAdmin={showAdminNav(user.role)}
      notifications={notifications}
      unreadCount={unreadCount}
    >
      {children}
    </AppShell>
  );
}
