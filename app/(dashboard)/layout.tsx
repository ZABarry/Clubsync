import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { isDbConnectionError } from "@/lib/db/errors";
import { syncUser } from "@/lib/auth/server";

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

  return (
    <AppShell showAdmin={user.role === "ADMIN"}>{children}</AppShell>
  );
}
