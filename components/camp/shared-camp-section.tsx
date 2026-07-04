"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

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

type SharedCampForCamp = {
  id: string;
  title: string;
  createdBy: { displayName: string };
  participants: Array<{ parent: { id: string; displayName: string } }>;
  _count: { participants: number };
};

type SharedCampSectionProps = {
  sharedCamps: SharedCampForCamp[];
  currentParentId: string;
};

export function SharedCampSection({
  sharedCamps,
  currentParentId,
}: SharedCampSectionProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  if (sharedCamps.length === 0) return null;

  const handleJoin = (sharedCampId: string) => {
    startTransition(async () => {
      try {
        await joinSharedCamp(sharedCampId, { status: "INTERESTED" });
        toast.success("Joined shared camp");
        router.push(`/shared-camps/${sharedCampId}`);
      } catch {
        toast.error("Failed to join shared camp");
      }
    });
  };

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold">Shared camps</h2>
      <ul className="space-y-3">
        {sharedCamps.map((shared) => {
          const isParticipant = shared.participants.some(
            (p) => p.parent.id === currentParentId,
          );

          return (
            <li key={shared.id}>
              <Card className="gap-3 py-4">
                <CardHeader className="flex-row items-center justify-between gap-3 space-y-0 px-4">
                  <div className="min-w-0 flex-1">
                    <CardTitle className="text-sm">{shared.title}</CardTitle>
                    <CardDescription className="text-xs">
                      by {shared.createdBy.displayName}
                    </CardDescription>
                  </div>
                  <Badge variant="secondary">
                    {shared._count.participants} families
                  </Badge>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2 px-4">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/shared-camps/${shared.id}`}>View</Link>
                  </Button>
                  {!isParticipant ? (
                    <Button
                      size="sm"
                      disabled={pending}
                      onClick={() => handleJoin(shared.id)}
                    >
                      Join
                    </Button>
                  ) : null}
                </CardContent>
              </Card>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
