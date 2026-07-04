import Link from "next/link";

import { ClubSyncLogo } from "@/components/brand/clubsync-logo";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-1 flex-col items-center justify-center bg-background px-4 py-12">
      <div className="mb-8 flex flex-col items-center gap-2 text-center">
        <Link href="/" className="flex items-center gap-2">
          <ClubSyncLogo size="lg" />
        </Link>
        <p className="text-muted-foreground max-w-sm text-sm">
          Plan clubs and activities together with trusted parent friends
        </p>
      </div>
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
