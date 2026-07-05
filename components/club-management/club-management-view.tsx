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
  publishClub,
  reinstateClub,
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
  isMasterAdmin?: boolean;
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
  isMasterAdmin = false,
}: ClubManagementViewProps) {
  const router = useRouter();
  const [clubs, setClubs] = useState(initialClubs);
  const [activeFilters, setActiveFilters] = useState<ClubManagementFilterValues>(
    {},
  );
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const refresh = (filters: ClubManagementFilterValues = activeFilters) => {
    setActiveFilters(filters);
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
    action: "deactivate" | "publish" | "archive" | "reinstate",
  ) => {
    setPendingId(clubId);
    startTransition(async () => {
      try {
        if (action === "deactivate") {
          await deactivateClub(clubId, mode);
          toast.success("Club deactivated");
        } else if (action === "publish") {
          await publishClub(clubId, mode);
          toast.success("Club published");
        } else if (action === "reinstate") {
          await reinstateClub(clubId);
          toast.success("Club reinstated");
        } else {
          await archiveClub(clubId, mode);
          toast.success("Club deleted");
        }
        router.refresh();
        refresh(activeFilters);
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
        showDeletedToggle={mode === "admin" && isMasterAdmin}
        onApply={refresh}
      />

      <ClubCompactList
        clubs={clubs}
        editBasePath={listPath}
        pendingId={pendingId ?? (pending ? "loading" : null)}
        onDeactivate={(id) => runAction(id, "deactivate")}
        onPublish={(id) => runAction(id, "publish")}
        onArchive={(id) => runAction(id, "archive")}
        onReinstate={
          isMasterAdmin ? (id) => runAction(id, "reinstate") : undefined
        }
      />
    </div>
  );
}
