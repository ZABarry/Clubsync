"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { MinimalBrandPage } from "@/components/layout/minimal-brand-page";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import { createClient } from "@/lib/auth/client";

export default function AuthConfirmPage() {
  const router = useRouter();
  const [message, setMessage] = useState("Confirming your account…");

  useEffect(() => {
    const supabase = createClient();

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        router.push("/profile?onboarding=true");
        router.refresh();
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.push("/profile?onboarding=true");
        router.refresh();
        return;
      }

      const hash = window.location.hash;
      if (hash.includes("access_token")) {
        return;
      }

      setMessage(
        "If confirmation did not complete, open the email link on this computer while npm run dev is running, or sign in at /login if already confirmed.",
      );
    });

    return () => listener.subscription.unsubscribe();
  }, [router]);

  return (
    <MinimalBrandPage>
      <Card>
        <CardHeader>
          <h1 className="text-lg font-semibold leading-none">
            Confirming account
          </h1>
          <CardDescription>{message}</CardDescription>
        </CardHeader>
        <CardContent className="text-muted-foreground text-sm">
          Email links use localhost and only work on the computer running the dev
          server.
        </CardContent>
      </Card>
    </MinimalBrandPage>
  );
}
