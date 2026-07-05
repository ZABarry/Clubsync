"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Suspense, useTransition } from "react";
import { toast } from "sonner";

import { BackLink } from "@/components/layout/back-link";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { joinSharedClub } from "@/lib/actions/shared-clubs";
import { formatOptionalDateRange } from "@/lib/utils";

type Participant = {
  id: string;
  status: string;
  parent: { id: string; displayName: string };
  child: { nickname: string; age: number } | null;
};

type SharedClubViewProps = {
  sharedClub: {
    id: string;
    title: string;
    notes: string | null;
    createdBy: { displayName: string };
    club: {
      id: string;
      name: string;
      startDate: Date | null;
      endDate: Date | null;
      locationName: string;
      bookingUrl: string | null;
      provider: { name: string };
    };
    participants: Participant[];
  };
  currentParentId: string;
};

function initials(name: string): string {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function SharedClubView({
  sharedClub,
  currentParentId,
}: SharedClubViewProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const isParticipant = sharedClub.participants.some(
    (p) => p.parent.id === currentParentId,
  );

  const handleJoin = () => {
    startTransition(async () => {
      try {
        await joinSharedClub(sharedClub.id, { status: "INTERESTED" });
        toast.success("Joined shared club");
        router.refresh();
      } catch {
        toast.error("Failed to join");
      }
    });
  };

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          {sharedClub.title}
        </h1>
        <p className="text-muted-foreground">
          {sharedClub.club.name} · {sharedClub.club.provider.name}
        </p>
        <p className="text-sm">
          {formatOptionalDateRange(
            sharedClub.club.startDate,
            sharedClub.club.endDate,
          )}
        </p>
        <p className="text-muted-foreground text-sm">
          {sharedClub.club.locationName}
        </p>
        {sharedClub.notes ? (
          <p className="text-sm">{sharedClub.notes}</p>
        ) : null}
        <p className="text-muted-foreground text-xs">
          Created by {sharedClub.createdBy.displayName}
        </p>
      </div>

      {!isParticipant ? (
        <Button onClick={handleJoin} disabled={pending}>
          Join this shared club
        </Button>
      ) : null}

      <Button variant="outline" asChild>
        <Link href={`/clubs/${sharedClub.club.id}?from=friends`}>
          View club details
        </Link>
      </Button>

      {sharedClub.club.bookingUrl ? (
        <Button asChild>
          <a
            href={sharedClub.club.bookingUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            Book club
          </a>
        </Button>
      ) : null}

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Participants</h2>
        {sharedClub.participants.length === 0 ? (
          <Card className="py-8">
            <CardContent className="text-muted-foreground text-center text-sm">
              No participants yet.
            </CardContent>
          </Card>
        ) : (
          <ul className="space-y-3">
            {sharedClub.participants.map((p) => (
              <li key={p.id}>
                <Card className="gap-3 py-4">
                  <CardHeader className="flex-row items-center gap-3 space-y-0 px-4">
                    <Avatar>
                      <AvatarFallback>
                        {initials(p.parent.displayName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <CardTitle className="text-sm">
                        {p.parent.displayName}
                      </CardTitle>
                      {p.child ? (
                        <CardDescription>
                          {p.child.nickname} (age {p.child.age})
                        </CardDescription>
                      ) : null}
                    </div>
                    <Badge variant="secondary">
                      {p.status.toLowerCase()}
                    </Badge>
                  </CardHeader>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Suspense fallback={null}>
        <BackLink fallback="friends" />
      </Suspense>
    </div>
  );
}
