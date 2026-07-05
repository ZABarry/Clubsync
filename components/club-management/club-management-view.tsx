"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { ClubCompactList } from "@/components/club-management/club-compact-list";
import {
  ClubManagementFilters,
  type ClubManagementFilterValues,
} from "@/components/club-management/club-management-filters";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import {
  archiveClub,
  deactivateClub,
  getManagedClubs,
  type ManagedClubListItem,
} from "@/lib/actions/club-management";

type ClubManagementViewProps = {
  mode: "admin" | "personal";
  initialClubs: ManagedClubListItem[];
  defaultLatitude?: number | null;
  defaultLongitude?: number | null;
  title: string;
  description: string;
  listPath: string;
  newPath: string;
};

export function ClubManagementView({
  mode,
  initialClubs,
  defaultLatitude,
  defaultLongitude,
  title,
  description,
  listPath,
  newPath,
}: ClubManagementViewProps) {
  const router = useRouter();
  const [clubs, setClubs] = useState(initialClubs);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const refresh = (filters: ClubManagementFilterValues = {}) => {
    startTransition(async () => {
      try {
        const next = await getManagedClubs(filters, mode);
        setClubs(next);
      } catch {
        toast.error("Failed to load clubs");
      }
    });
  };

  const runAction = async (
    clubId: string,
    action: "deactivate" | "archive",
  ) => {
    setPendingId(clubId);
    startTransition(async () => {
      try {
        if (action === "deactivate") {
          await deactivateClub(clubId, mode);
          toast.success("Club deactivated");
        } else {
          await archiveClub(clubId, mode);
          toast.success("Club deleted");
        }
        router.refresh();
        refresh();
      } catch {
        toast.error("Action failed");
      } finally {
        setPendingId(null);
      }
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={title}
        description={description}
        actions={
          <Button asChild>
            <Link href={newPath}>
              <Plus className="size-4" />
              Add club
            </Link>
          </Button>
        }
      />

      <ClubManagementFilters
        defaultLatitude={defaultLatitude}
        defaultLongitude={defaultLongitude}
        showAdminFilters={mode === "admin"}
        onApply={refresh}
      />

      <ClubCompactList
        clubs={clubs}
        editBasePath={listPath}
        pendingId={pendingId ?? (pending ? "loading" : null)}
        onDeactivate={(id) => runAction(id, "deactivate")}
        onArchive={(id) => runAction(id, "archive")}
      />
    </div>
  );
}
