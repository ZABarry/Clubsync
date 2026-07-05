"use client";

import Link from "next/link";
import { RefreshCw } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { ClubCard } from "@/components/club/club-card";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  getDashboardRecommendations,
  type DashboardRecommendationsResult,
} from "@/lib/actions/recommendations";

const PAGE_SIZE = 4;

type RecommendedClubsSectionProps = {
  initial: DashboardRecommendationsResult;
};

export function RecommendedClubsSection({
  initial,
}: RecommendedClubsSectionProps) {
  const [clubs, setClubs] = useState(initial.clubs);
  const [offset, setOffset] = useState(initial.offset);
  const [hasMore, setHasMore] = useState(initial.hasMore);
  const [total, setTotal] = useState(initial.total);
  const [pending, startTransition] = useTransition();

  const refresh = () => {
    startTransition(async () => {
      try {
        const nextOffset = hasMore ? offset + PAGE_SIZE : 0;
        const result = await getDashboardRecommendations({
          limit: PAGE_SIZE,
          offset: nextOffset,
        });

        setClubs(result.clubs);
        setOffset(result.offset);
        setHasMore(result.hasMore);
        setTotal(result.total);
      } catch {
        toast.error("Failed to refresh recommendations");
      }
    });
  };

  const canRefresh = total > PAGE_SIZE;

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">Recommended clubs</h2>
        <div className="flex items-center gap-1">
          {canRefresh ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={refresh}
              disabled={pending}
            >
              <RefreshCw
                className={pending ? "size-4 animate-spin" : "size-4"}
              />
              {hasMore ? "Show more" : "Start over"}
            </Button>
          ) : null}
          <Button variant="ghost" size="sm" asChild>
            <Link href="/discover">View all</Link>
          </Button>
        </div>
      </div>
      {clubs.length === 0 ? (
        <Card className="py-8">
          <CardContent className="text-muted-foreground text-center text-sm">
            No clubs found yet.{" "}
            <Link href="/discover" className="text-primary hover:underline">
              Explore clubs
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {clubs.map((club) => (
            <ClubCard
              key={club.id}
              club={club}
              detailHref={`/clubs/${club.id}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
