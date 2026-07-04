"use client";

import { Pencil, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import type { z } from "zod";

import { CampForm } from "@/components/admin/camp-form";
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
  createCamp,
  deleteCamp,
  updateCamp,
} from "@/lib/actions/admin";
import { campSchema } from "@/lib/validation/schemas";
import { formatOptionalDateRange } from "@/lib/utils";

type Camp = {
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
  bookingUrl: string | null;
  imageUrl: string | null;
  isIndoor: boolean;
  isOutdoor: boolean;
  sendFriendly: boolean;
  accessibilityNotes: string | null;
  provider: { name: string };
};

function campToFormDefaults(camp: Camp) {
  return {
    providerId: camp.providerId,
    name: camp.name,
    description: camp.description ?? "",
    locationName: camp.locationName,
    address: camp.address ?? "",
    latitude: camp.latitude,
    longitude: camp.longitude,
    activities: camp.activities,
    ageMin: camp.ageMin,
    ageMax: camp.ageMax,
    startDate: camp.startDate
      ? new Date(camp.startDate).toISOString().slice(0, 10)
      : "",
    endDate: camp.endDate
      ? new Date(camp.endDate).toISOString().slice(0, 10)
      : "",
    dailyStartTime: camp.dailyStartTime ?? "",
    dailyEndTime: camp.dailyEndTime ?? "",
    price: camp.price ?? undefined,
    bookingUrl: camp.bookingUrl ?? "",
    imageUrl: camp.imageUrl ?? "",
    status: camp.status as "ACTIVE" | "DRAFT" | "ARCHIVED",
    isIndoor: camp.isIndoor,
    isOutdoor: camp.isOutdoor,
    sendFriendly: camp.sendFriendly,
    accessibilityNotes: camp.accessibilityNotes ?? "",
  };
}

type AdminCampsViewProps = {
  camps: Camp[];
  providers: { id: string; name: string }[];
};

export function AdminCampsView({ camps, providers }: AdminCampsViewProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Camp | null>(null);
  const [pending, startTransition] = useTransition();

  const openCreate = () => {
    setEditing(null);
    setOpen(true);
  };

  const openEdit = (camp: Camp) => {
    setEditing(camp);
    setOpen(true);
  };

  const handleSubmit = async (values: z.infer<typeof campSchema>) => {
    startTransition(async () => {
      try {
        if (editing) {
          await updateCamp(editing.id, values);
          toast.success("Camp updated");
        } else {
          await createCamp(values);
          toast.success("Camp created");
        }
        setOpen(false);
        router.refresh();
      } catch {
        toast.error("Failed to save camp");
      }
    });
  };

  const handleDelete = (campId: string) => {
    startTransition(async () => {
      try {
        await deleteCamp(campId);
        toast.success("Camp archived");
        router.refresh();
      } catch {
        toast.error("Failed to archive camp");
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
              Add camp
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editing ? "Edit camp" : "Create camp"}</DialogTitle>
            </DialogHeader>
            <CampForm
              key={editing?.id ?? "new"}
              providers={providers}
              defaultValues={editing ? campToFormDefaults(editing) : undefined}
              onSubmit={handleSubmit}
              loading={pending}
              submitLabel={editing ? "Update camp" : "Create camp"}
            />
          </DialogContent>
        </Dialog>
      </div>

      {camps.length === 0 ? (
        <Card className="py-12">
          <CardContent className="text-muted-foreground text-center text-sm">
            No camps yet. Create your first camp listing.
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
              {camps.map((camp) => (
                <TableRow key={camp.id}>
                  <TableCell className="font-medium">{camp.name}</TableCell>
                  <TableCell>{camp.provider.name}</TableCell>
                  <TableCell className="text-sm">
                    {formatOptionalDateRange(camp.startDate, camp.endDate)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{camp.status.toLowerCase()}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEdit(camp)}
                        aria-label={`Edit ${camp.name}`}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={pending}
                        onClick={() => handleDelete(camp.id)}
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
