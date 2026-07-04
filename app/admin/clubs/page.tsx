import { PageHeader } from "@/components/layout/page-header";
import { getAdminClubs, getAdminProviders } from "@/lib/actions/admin";

import { AdminClubsView } from "./admin-clubs-view";

export default async function AdminClubsPage() {
  const [clubs, providers] = await Promise.all([
    getAdminClubs(),
    getAdminProviders(),
  ]);

  return (
    <div>
      <PageHeader
        title="Manage clubs"
        description="Create, edit and archive club listings"
      />
      <AdminClubsView
        clubs={clubs}
        providers={providers.map((p: { id: string; name: string }) => ({
          id: p.id,
          name: p.name,
        }))}
      />
    </div>
  );
}
