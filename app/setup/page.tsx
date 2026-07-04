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
          <CardTitle>One last step: database password</CardTitle>
          <CardDescription>
            Your Supabase tables are created and seeded. ClubSync just needs
            your database password in <code className="text-xs">.env.local</code>.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <p className="text-muted-foreground">
            The Supabase MCP cannot read your database password for security
            reasons. Replace <code>YOUR_DB_PASSWORD</code> in{" "}
            <code>.env.local</code>, then restart the dev server.
          </p>
          <p className="text-muted-foreground">
            On Vercel, add <code>DATABASE_URL</code> and <code>DIRECT_URL</code>{" "}
            under Project Settings → Environment Variables (same pooler URLs as
            below), then redeploy.
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
              Restart <code>npm run dev</code>
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
