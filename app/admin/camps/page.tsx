import { PageHeader } from "@/components/layout/page-header";
import { getAdminCamps, getAdminProviders } from "@/lib/actions/admin";

import { AdminCampsView } from "./admin-camps-view";

export default async function AdminCampsPage() {
  const [camps, providers] = await Promise.all([
    getAdminCamps(),
    getAdminProviders(),
  ]);

  return (
    <div>
      <PageHeader
        title="Manage camps"
        description="Create, edit and archive camp listings"
      />
      <AdminCampsView
        camps={camps}
        providers={providers.map((p: { id: string; name: string }) => ({
          id: p.id,
          name: p.name,
        }))}
      />
    </div>
  );
}
