import { AppShell } from "@/components/layout/app-shell";
import { getInvitePreview } from "@/lib/actions/friends";
import { syncUser } from "@/lib/auth/server";

import { InviteView } from "./invite-view";

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const [user, preview] = await Promise.all([
    syncUser(),
    getInvitePreview(token).catch(() => null),
  ]);
  const showAdmin = user?.role === "ADMIN";

  return (
    <AppShell showAdmin={showAdmin}>
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <InviteView token={token} requesterName={preview?.requesterName} />
      </div>
    </AppShell>
  );
}
