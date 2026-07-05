"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { ClubCard } from "@/components/club/club-card";
import { SmartPlannerForm } from "@/components/planner/smart-planner-form";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getRecommendations } from "@/lib/actions/recommendations";
import type { ScoredClub } from "@/lib/recommendations/score-clubs";
import type { ChildOption, FriendOption } from "@/lib/types/club";
import type { smartPlannerSchema } from "@/lib/validation/schemas";
import type { z } from "zod";

type PlannerViewProps = {
  children: ChildOption[];
  friends: FriendOption[];
};

export function PlannerView({ children, friends }: PlannerViewProps) {
  const [results, setResults] = useState<ScoredClub[]>([]);
  const [loading, setLoading] = useState(false);
  const [, startTransition] = useTransition();

  const handleSubmit = async (values: z.infer<typeof smartPlannerSchema>) => {
    setLoading(true);
    startTransition(async () => {
      try {
        const recommendations = await getRecommendations(values);
        setResults(recommendations);
        if (recommendations.length === 0) {
          toast.info("No clubs matched your criteria. Try widening your search.");
        }
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Failed to get recommendations",
        );
      } finally {
        setLoading(false);
      }
    });
  };

  if (children.length === 0) {
    return (
      <Card className="py-8">
        <CardContent className="text-muted-foreground text-center text-sm">
          Add a child to your{" "}
          <Link href="/profile" className="text-primary hover:underline">
            profile
          </Link>{" "}
          to use the smart planner.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      <SmartPlannerForm
        children={children}
        friends={friends}
        onSubmit={handleSubmit}
        loading={loading}
      />

      {results.length > 0 ? (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Ranked recommendations</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {results.map((club, index) => (
              <div key={club.id} className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">#{index + 1}</Badge>
                  <span className="text-muted-foreground text-xs">
                    Score: {club.recommendationScore}
                  </span>
                </div>
                <Link href={`/clubs/${club.id}?from=planner`}>
                  <ClubCard
                    club={{
                      id: club.id,
                      name: club.name,
                      providerName: "",
                      startDate: club.startDate,
                      endDate: club.endDate,
                      price: club.price,
                      dailyRate: club.dailyRate,
                      priceNote: club.priceNote,
                      ratingAverage: club.ratingAverage,
                      ratingCount: club.ratingCount,
                      activities: club.activities,
                      distanceKm: club.distanceKm,
                    }}
                  />
                </Link>
                {club.recommendationReasons.length > 0 ? (
                  <Card className="py-3">
                    <CardHeader className="px-4 py-0">
                      <CardDescription className="text-xs">
                        {club.recommendationReasons.join(" · ")}
                      </CardDescription>
                    </CardHeader>
                  </Card>
                ) : null}
              </div>
            ))}
          </div>
        </section>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">How it works</CardTitle>
            <CardDescription>
              Fill in your child&apos;s dates and preferences, and we&apos;ll
              rank clubs by age fit, interests, distance, friend activity and
              ratings.
            </CardDescription>
          </CardHeader>
        </Card>
      )}
    </div>
  );
}
