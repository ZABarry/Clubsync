"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  deleteAdminUser,
  getAdminUsers,
  promoteUserRole,
  setUserActive,
} from "@/lib/actions/club-management";

type AdminUser = {
  id: string;
  email: string;
  role: string;
  isActive: boolean;
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
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);
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

  const runAction = (
    userId: string,
    action: () => Promise<unknown>,
    successMessage: string,
  ) => {
    setLoadingId(userId);
    startTransition(async () => {
      try {
        await action();
        toast.success(successMessage);
        router.refresh();
        refresh();
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Action failed",
        );
      } finally {
        setLoadingId(null);
      }
    });
  };

  const changeRole = (userId: string, role: "PARENT" | "REVIEWER") => {
    runAction(
      userId,
      () => promoteUserRole({ userId, role }),
      "Role updated",
    );
  };

  const toggleActive = (userId: string, isActive: boolean) => {
    runAction(
      userId,
      () => setUserActive({ userId, isActive }),
      isActive ? "User reactivated" : "User deactivated",
    );
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    const userId = deleteTarget.id;
    setDeleteTarget(null);
    runAction(userId, () => deleteAdminUser({ userId }), "User deleted");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Users"
        description="Search users, manage roles, deactivate accounts, or permanently delete users."
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
              <TableHead>Status</TableHead>
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
              const isMasterAdmin = user.role === "MASTER_ADMIN";
              const isLoading = loadingId === user.id;

              return (
                <TableRow key={user.id}>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{ROLE_LABEL[user.role]}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.isActive ? "default" : "secondary"}>
                      {user.isActive ? "Active" : "Deactivated"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {user.lastLoginAt
                      ? new Date(user.lastLoginAt).toLocaleString("en-GB")
                      : "Never"}
                  </TableCell>
                  <TableCell className="text-right">
                    {isMasterAdmin ? (
                      <span className="text-muted-foreground text-xs">—</span>
                    ) : (
                      <div className="flex flex-wrap justify-end gap-2">
                        {user.role === "PARENT" ? (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={isLoading}
                            onClick={() => changeRole(user.id, "REVIEWER")}
                          >
                            Make reviewer
                          </Button>
                        ) : user.role === "REVIEWER" ? (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={isLoading}
                            onClick={() => changeRole(user.id, "PARENT")}
                          >
                            Remove reviewer
                          </Button>
                        ) : null}
                        {user.isActive ? (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={isLoading}
                            onClick={() => toggleActive(user.id, false)}
                          >
                            Deactivate
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={isLoading}
                            onClick={() => toggleActive(user.id, true)}
                          >
                            Reactivate
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="destructive"
                          disabled={isLoading}
                          onClick={() => setDeleteTarget(user)}
                        >
                          Delete
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete user permanently?</DialogTitle>
            <DialogDescription>
              This removes {deleteTarget?.email} from the database and deletes
              their authentication account. Their profile, children, plans, and
              related data will be permanently removed. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteTarget(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={loadingId === deleteTarget?.id}
              onClick={confirmDelete}
            >
              Delete user
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
