import { redirect } from "next/navigation";

import { AdminUsersView } from "./admin-users-view";
import { getAdminUsers } from "@/lib/actions/club-management";
import { syncUser } from "@/lib/auth/server";
import { isMasterAdminRole } from "@/lib/auth/roles";

export default async function AdminUsersPage() {
  const user = await syncUser();
  if (!user || !isMasterAdminRole(user.role)) redirect("/admin");

  const users = await getAdminUsers({});

  return <AdminUsersView initialUsers={users} />;
}
