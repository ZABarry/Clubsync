"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle>Confirming account</CardTitle>
          <CardDescription>{message}</CardDescription>
        </CardHeader>
        <CardContent className="text-muted-foreground text-sm">
          Email links use localhost and only work on the computer running the dev server.
        </CardContent>
      </Card>
    </div>
  );
}
