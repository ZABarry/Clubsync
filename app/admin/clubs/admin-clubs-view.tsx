"use client";

import { Pencil, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import type { z } from "zod";

import { ClubForm } from "@/components/admin/club-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  createClub,
  deleteClub,
  updateClub,
} from "@/lib/actions/admin";
import { clubSchema } from "@/lib/validation/schemas";
import { formatOptionalDateRange } from "@/lib/utils";

type Club = {
  id: string;
  name: string;
  status: string;
  startDate: Date | null;
  endDate: Date | null;
  providerId: string;
  description: string | null;
  locationName: string;
  address: string | null;
  latitude: number;
  longitude: number;
  activities: string[];
  ageMin: number;
  ageMax: number;
  dailyStartTime: string | null;
  dailyEndTime: string | null;
  price: number | null;
  dailyRate: number | null;
  priceNote: string | null;
  bookingUrl: string | null;
  imageUrl: string | null;
  isIndoor: boolean;
  isOutdoor: boolean;
  sendFriendly: boolean;
  accessibilityNotes: string | null;
  provider: { name: string };
};

function clubToFormDefaults(club: Club) {
  return {
    providerId: club.providerId,
    name: club.name,
    description: club.description ?? "",
    locationName: club.locationName,
    address: club.address ?? "",
    latitude: club.latitude,
    longitude: club.longitude,
    activities: club.activities,
    ageMin: club.ageMin,
    ageMax: club.ageMax,
    startDate: club.startDate
      ? new Date(club.startDate).toISOString().slice(0, 10)
      : "",
    endDate: club.endDate
      ? new Date(club.endDate).toISOString().slice(0, 10)
      : "",
    dailyStartTime: club.dailyStartTime ?? "",
    dailyEndTime: club.dailyEndTime ?? "",
    price: club.price ?? undefined,
    dailyRate: club.dailyRate ?? undefined,
    bookingUrl: club.bookingUrl ?? "",
    imageUrl: club.imageUrl ?? "",
    status: club.status as "ACTIVE" | "DRAFT" | "ARCHIVED",
    isIndoor: club.isIndoor,
    isOutdoor: club.isOutdoor,
    sendFriendly: club.sendFriendly,
    accessibilityNotes: club.accessibilityNotes ?? "",
  };
}

type AdminClubsViewProps = {
  clubs: Club[];
  providers: { id: string; name: string }[];
};

export function AdminClubsView({ clubs, providers }: AdminClubsViewProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Club | null>(null);
  const [pending, startTransition] = useTransition();

  const openCreate = () => {
    setEditing(null);
    setOpen(true);
  };

  const openEdit = (club: Club) => {
    setEditing(club);
    setOpen(true);
  };

  const handleSubmit = async (values: z.infer<typeof clubSchema>) => {
    startTransition(async () => {
      try {
        if (editing) {
          await updateClub(editing.id, values);
          toast.success("Club updated");
        } else {
          await createClub(values);
          toast.success("Club created");
        }
        setOpen(false);
        router.refresh();
      } catch {
        toast.error("Failed to save club");
      }
    });
  };

  const handleDelete = (clubId: string) => {
    startTransition(async () => {
      try {
        await deleteClub(clubId);
        toast.success("Club archived");
        router.refresh();
      } catch {
        toast.error("Failed to archive club");
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreate}>
              <Plus className="size-4" />
              Add club
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editing ? "Edit club" : "Create club"}</DialogTitle>
            </DialogHeader>
            <ClubForm
              key={editing?.id ?? "new"}
              providers={providers}
              defaultValues={editing ? clubToFormDefaults(editing) : undefined}
              onSubmit={handleSubmit}
              loading={pending}
              submitLabel={editing ? "Update club" : "Create club"}
            />
          </DialogContent>
        </Dialog>
      </div>

      {clubs.length === 0 ? (
        <Card className="py-12">
          <CardContent className="text-muted-foreground text-center text-sm">
            No clubs yet. Create your first club listing.
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead>Dates</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clubs.map((club) => (
                <TableRow key={club.id}>
                  <TableCell className="font-medium">{club.name}</TableCell>
                  <TableCell>{club.provider.name}</TableCell>
                  <TableCell className="text-sm">
                    {formatOptionalDateRange(club.startDate, club.endDate)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{club.status.toLowerCase()}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEdit(club)}
                        aria-label={`Edit ${club.name}`}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={pending}
                        onClick={() => handleDelete(club.id)}
                      >
                        Archive
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
