"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

const FROM_LABELS: Record<string, { href: string; label: string }> = {
  home: { href: "/", label: "Home" },
  discover: { href: "/discover", label: "Discover" },
  calendar: { href: "/calendar", label: "Calendar" },
  planner: { href: "/planner", label: "Smart planner" },
  friends: { href: "/friends", label: "Friends" },
  notifications: { href: "/notifications", label: "Notifications" },
};

type BackLinkProps = {
  fallback?: keyof typeof FROM_LABELS;
};

export function BackLink({ fallback = "discover" }: BackLinkProps) {
  const searchParams = useSearchParams();
  const from = searchParams.get("from");
  const target =
    (from && from in FROM_LABELS
      ? FROM_LABELS[from as keyof typeof FROM_LABELS]
      : null) ??
    FROM_LABELS[fallback] ??
    FROM_LABELS.discover;

  return (
    <Link
      href={target.href}
      className="text-muted-foreground hover:text-foreground inline-flex items-center text-sm transition-colors"
    >
      ← Back to {target.label.toLowerCase()}
    </Link>
  );
}
