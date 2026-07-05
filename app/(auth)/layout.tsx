import Link from "next/link";

import { CLUBZER_TAGLINE } from "@/lib/brand";
import { ClubZerLogo } from "@/components/brand/clubzer-logo";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="club-brand-bg flex min-h-0 flex-1 flex-col items-center justify-center overflow-y-auto px-4 py-12">
      <div className="mb-8 flex flex-col items-center gap-3 text-center">
        <Link href="/" className="flex items-center gap-2">
          <ClubZerLogo size="lg" />
        </Link>
        <p className="text-muted-foreground max-w-sm text-sm leading-relaxed">
          {CLUBZER_TAGLINE}
        </p>
      </div>
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
