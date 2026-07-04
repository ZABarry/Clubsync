import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function SetupPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>Database connection required</CardTitle>
          <CardDescription>
            ClubZer needs your Supabase Postgres URLs to load after sign-in.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <p className="text-muted-foreground">
            <strong>Local dev:</strong> add the URLs to{" "}
            <code className="text-xs">.env.local</code>, then restart{" "}
            <code className="text-xs">npm run dev</code>.
          </p>
          <p className="text-muted-foreground">
            <strong>Production (Vercel):</strong> add{" "}
            <code className="text-xs">DATABASE_URL</code> and{" "}
            <code className="text-xs">DIRECT_URL</code> in{" "}
            <a
              href="https://vercel.com/barrys-projects-4e566e47/clubzer/settings/environment-variables"
              className="text-primary underline"
              target="_blank"
              rel="noreferrer"
            >
              Vercel → Environment Variables
            </a>
            , enable them for <strong>Production</strong>, then redeploy.
          </p>
          <ol className="list-decimal space-y-2 pl-5">
            <li>
              Open{" "}
              <a
                href="https://supabase.com/dashboard/project/mhsevtlbujuslukyysvd/database/settings"
                className="text-primary underline"
                target="_blank"
                rel="noreferrer"
              >
                Supabase → Database settings
              </a>
            </li>
            <li>
              Click <strong>Connect</strong> (top of the page) → choose{" "}
              <strong>ORMs</strong> → <strong>Prisma</strong>
            </li>
            <li>
              Copy the <strong>Transaction pooler</strong> URI (port 6543) into{" "}
              <code>DATABASE_URL</code>
            </li>
            <li>
              Copy the <strong>Direct connection</strong> URI (port 5432) into{" "}
              <code>DIRECT_URL</code>
            </li>
            <li>
              If you don&apos;t know the password, click{" "}
              <strong>Reset database password</strong> on the Database settings
              page first
            </li>
            <li>
              Restart dev or redeploy on Vercel after saving env vars
            </li>
          </ol>
          <Button asChild>
            <Link href="/login">Back to login</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
