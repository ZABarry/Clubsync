import { PageHeader } from "@/components/layout/page-header";
import { getAdminProviders } from "@/lib/actions/admin";

import { AdminProvidersView } from "./admin-providers-view";

export default async function AdminProvidersPage() {
  const providers = await getAdminProviders();

  return (
    <div>
      <PageHeader
        title="Manage providers"
        description="Create and edit camp providers"
      />
      <AdminProvidersView providers={providers} />
    </div>
  );
}
