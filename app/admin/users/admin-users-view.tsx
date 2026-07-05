"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getAdminUsers, promoteUserRole } from "@/lib/actions/club-management";

type AdminUser = {
  id: string;
  email: string;
  role: string;
  lastLoginAt: Date | null;
  createdAt: Date;
  parentProfile: {
    displayName: string;
    firstName: string | null;
    lastName: string | null;
  } | null;
};

type AdminUsersViewProps = {
  initialUsers: AdminUser[];
};

const ROLE_LABEL: Record<string, string> = {
  PARENT: "User",
  REVIEWER: "Camp reviewer",
  MASTER_ADMIN: "Master admin",
};

export function AdminUsersView({ initialUsers }: AdminUsersViewProps) {
  const router = useRouter();
  const [users, setUsers] = useState(initialUsers);
  const [search, setSearch] = useState("");
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const refresh = () => {
    startTransition(async () => {
      try {
        const next = await getAdminUsers({ search: search || undefined });
        setUsers(next as AdminUser[]);
      } catch {
        toast.error("Failed to search users");
      }
    });
  };

  const changeRole = (userId: string, role: "PARENT" | "REVIEWER") => {
    setLoadingId(userId);
    startTransition(async () => {
      try {
        await promoteUserRole({ userId, role });
        toast.success("Role updated");
        router.refresh();
        refresh();
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to update role",
        );
      } finally {
        setLoadingId(null);
      }
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Users"
        description="Search users and manage camp reviewer roles."
      />
      <div className="flex gap-2">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search email or name…"
          aria-label="Search users by email or name"
        />
        <Button type="button" onClick={refresh}>
          Search
        </Button>
      </div>
      <div className="rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Last login</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => {
              const name =
                [user.parentProfile?.firstName, user.parentProfile?.lastName]
                  .filter(Boolean)
                  .join(" ") ||
                user.parentProfile?.displayName ||
                "—";
              return (
                <TableRow key={user.id}>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{ROLE_LABEL[user.role]}</Badge>
                  </TableCell>
                  <TableCell>
                    {user.lastLoginAt
                      ? new Date(user.lastLoginAt).toLocaleString("en-GB")
                      : "Never"}
                  </TableCell>
                  <TableCell className="text-right">
                    {user.role === "PARENT" ? (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={loadingId === user.id}
                        onClick={() => changeRole(user.id, "REVIEWER")}
                      >
                        Make reviewer
                      </Button>
                    ) : user.role === "REVIEWER" ? (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={loadingId === user.id}
                        onClick={() => changeRole(user.id, "PARENT")}
                      >
                        Remove reviewer
                      </Button>
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
