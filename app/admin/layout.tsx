import { redirect } from "next/navigation";
import Link from "next/link";
import { Tent } from "lucide-react";

import { syncUser } from "@/lib/auth/server";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await syncUser();
  if (!user || user.role !== "ADMIN") redirect("/");

  return (
    <div className="min-h-full flex-1">
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 md:px-8">
          <Link href="/admin" className="flex items-center gap-2">
            <Tent className="size-5 text-primary" />
            <span className="font-semibold">ClubSync Admin</span>
          </Link>
          <Link
            href="/"
            className="text-muted-foreground text-sm hover:text-foreground"
          >
            ← Back to app
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8 md:px-8">{children}</main>
    </div>
  );
}
