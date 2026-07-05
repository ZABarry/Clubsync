import Link from "next/link";

import { CLUBZER_TAGLINE } from "@/lib/brand";
import { ClubZerLogo } from "@/components/brand/clubzer-logo";

type MinimalBrandPageProps = {
  children: React.ReactNode;
};

export function MinimalBrandPage({ children }: MinimalBrandPageProps) {
  return (
    <div className="club-brand-bg flex min-h-screen flex-col items-center justify-center overflow-y-auto px-4 py-12">
      <a
        href="#page-main"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:m-4 focus:rounded-md focus:bg-background focus:px-4 focus:py-2 focus:shadow-md"
      >
        Skip to main content
      </a>
      <div className="mb-8 flex flex-col items-center gap-3 text-center">
        <Link href="/" className="flex items-center gap-2">
          <ClubZerLogo size="lg" />
        </Link>
        <p className="text-muted-foreground max-w-sm text-sm leading-relaxed">
          {CLUBZER_TAGLINE}
        </p>
      </div>
      <main id="page-main" className="w-full max-w-lg">
        {children}
      </main>
    </div>
  );
}
