import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, LayoutDashboard } from "lucide-react";

import { ClubZerLogo } from "@/components/brand/clubzer-logo";
import { syncUser } from "@/lib/auth/server";
import { isReviewerRole } from "@/lib/auth/roles";
import { isDbConnectionError } from "@/lib/db/errors";
export const metadata: Metadata = {
  title: "Admin",
};

export default async function AdminLayout({
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
  if (!user || !isReviewerRole(user.role)) redirect("/");

  return (
    <div className="club-brand-bg flex min-h-0 flex-1 flex-col overflow-hidden">
      <header className="shrink-0 border-b bg-card/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl min-w-0 items-center justify-between px-4 py-4 md:px-8">
          <Link href="/admin" className="flex min-w-0 items-center gap-3">
            <ClubZerLogo size="md" />
            <span className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-primary">
              Admin
            </span>
          </Link>
          <nav className="flex items-center gap-1">
            <Link
              href="/admin"
              aria-label="Admin dashboard"
              title="Admin dashboard"
              className="text-muted-foreground hover:text-foreground hover:bg-accent inline-flex size-9 items-center justify-center rounded-md transition-colors"
            >
              <LayoutDashboard className="size-4" aria-hidden />
            </Link>
            <Link
              href="/"
              aria-label="Back to app"
              title="Back to app"
              className="text-muted-foreground hover:text-foreground hover:bg-accent inline-flex size-9 items-center justify-center rounded-md transition-colors"
            >
              <ArrowLeft className="size-4" aria-hidden />
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto min-h-0 min-w-0 max-w-6xl flex-1 overflow-y-auto px-4 py-8 md:px-8">
        {children}
      </main>
    </div>
  );
}
