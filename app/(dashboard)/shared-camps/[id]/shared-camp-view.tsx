"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

import { CampStatusBadge } from "@/components/camp/camp-status-badge";
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
import { joinSharedCamp } from "@/lib/actions/shared-camps";
import { formatDateRange } from "@/lib/utils";

type Participant = {
  id: string;
  status: string;
  parent: { id: string; displayName: string };
  child: { nickname: string; age: number } | null;
};

type SharedCampViewProps = {
  sharedCamp: {
    id: string;
    title: string;
    notes: string | null;
    createdBy: { displayName: string };
    camp: {
      id: string;
      name: string;
      startDate: Date;
      endDate: Date;
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

export function SharedCampView({
  sharedCamp,
  currentParentId,
}: SharedCampViewProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const isParticipant = sharedCamp.participants.some(
    (p) => p.parent.id === currentParentId,
  );

  const handleJoin = () => {
    startTransition(async () => {
      try {
        await joinSharedCamp(sharedCamp.id, { status: "INTERESTED" });
        toast.success("Joined shared camp");
        router.refresh();
      } catch {
        toast.error("Failed to join");
      }
    });
  };

  const start = new Date(sharedCamp.camp.startDate);
  const end = new Date(sharedCamp.camp.endDate);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">{sharedCamp.title}</h1>
        <p className="text-muted-foreground">
          {sharedCamp.camp.name} · {sharedCamp.camp.provider.name}
        </p>
        <p className="text-sm">{formatDateRange(start, end)}</p>
        <p className="text-muted-foreground text-sm">
          {sharedCamp.camp.locationName}
        </p>
        {sharedCamp.notes ? (
          <p className="text-sm">{sharedCamp.notes}</p>
        ) : null}
        <p className="text-muted-foreground text-xs">
          Created by {sharedCamp.createdBy.displayName}
        </p>
      </div>

      {!isParticipant ? (
        <Button onClick={handleJoin} disabled={pending}>
          Join this shared camp
        </Button>
      ) : null}

      <Button variant="outline" asChild>
        <Link href={`/camps/${sharedCamp.camp.id}`}>View camp details</Link>
      </Button>

      {sharedCamp.camp.bookingUrl ? (
        <Button asChild>
          <a
            href={sharedCamp.camp.bookingUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            Book camp
          </a>
        </Button>
      ) : null}

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Participants</h2>
        {sharedCamp.participants.length === 0 ? (
          <Card className="py-8">
            <CardContent className="text-muted-foreground text-center text-sm">
              No participants yet.
            </CardContent>
          </Card>
        ) : (
          <ul className="space-y-3">
            {sharedCamp.participants.map((p) => (
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

      <Button variant="ghost" asChild>
        <Link href="/friends">← Back to friends</Link>
      </Button>
    </div>
  );
}
