"use client";

import { CheckCircle, Loader2, XCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { acceptInvite } from "@/lib/actions/friends";

type InviteViewProps = {
  token: string;
  requesterName?: string | null;
};

export function InviteView({ token, requesterName }: InviteViewProps) {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [pending, startTransition] = useTransition();

  const handleAccept = () => {
    startTransition(async () => {
      try {
        await acceptInvite(token);
        setStatus("success");
        toast.success("Invite accepted!");
        setTimeout(() => router.push("/friends"), 1500);
      } catch (err) {
        setStatus("error");
        toast.error(
          err instanceof Error ? err.message : "Failed to accept invite",
        );
      }
    });
  };

  return (
    <Card className="mx-auto max-w-md">
      <CardHeader className="text-center">
        <CardTitle>Friend invite</CardTitle>
        <CardDescription>
          {requesterName
            ? `${requesterName} invited you to connect as trusted parent friends on ClubZer.`
            : "Accept this invite to connect as trusted parent friends on ClubZer."}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4">
        {status === "success" ? (
          <div className="flex flex-col items-center gap-2 text-emerald-600">
            <CheckCircle className="size-12" />
            <p className="font-medium">Connected!</p>
            <p className="text-muted-foreground text-sm">
              Redirecting to friends…
            </p>
          </div>
        ) : status === "error" ? (
          <div className="flex flex-col items-center gap-2 text-destructive">
            <XCircle className="size-12" />
            <p className="font-medium">Could not accept invite</p>
            <Button variant="outline" asChild>
              <Link href="/friends">Go to friends</Link>
            </Button>
          </div>
        ) : (
          <Button onClick={handleAccept} disabled={pending} className="w-full">
            {pending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : null}
            Accept invite
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
