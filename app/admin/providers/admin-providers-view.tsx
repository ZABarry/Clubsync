"use client";

import { Pencil, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import type { z } from "zod";

import { ProviderForm } from "@/components/admin/provider-form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
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
  createProvider,
  deleteProvider,
  updateProvider,
} from "@/lib/actions/admin";
import { providerSchema } from "@/lib/validation/schemas";

type Provider = {
  id: string;
  name: string;
  website: string | null;
  contactEmail: string | null;
  _count: { clubs: number };
};

type AdminProvidersViewProps = {
  providers: Provider[];
};

export function AdminProvidersView({ providers }: AdminProvidersViewProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Provider | null>(null);
  const [pending, startTransition] = useTransition();

  const handleSubmit = async (values: z.infer<typeof providerSchema>) => {
    startTransition(async () => {
      try {
        if (editing) {
          await updateProvider(editing.id, values);
          toast.success("Provider updated");
        } else {
          await createProvider(values);
          toast.success("Provider created");
        }
        setOpen(false);
        router.refresh();
      } catch {
        toast.error("Failed to save provider");
      }
    });
  };

  const handleDelete = (providerId: string) => {
    startTransition(async () => {
      try {
        await deleteProvider(providerId);
        toast.success("Provider deleted");
        router.refresh();
      } catch {
        toast.error("Failed to delete provider");
      }
    });
  };

  return (
    <div className="min-w-0 space-y-6">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditing(null)}>
              <Plus className="size-4" />
              Add provider
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editing ? "Edit provider" : "Create provider"}
              </DialogTitle>
            </DialogHeader>
            <ProviderForm
              defaultValues={
                editing
                  ? {
                      name: editing.name,
                      website: editing.website ?? "",
                      contactEmail: editing.contactEmail ?? "",
                    }
                  : undefined
              }
              onSubmit={handleSubmit}
              loading={pending}
              submitLabel={editing ? "Update provider" : "Create provider"}
            />
          </DialogContent>
        </Dialog>
      </div>

      {providers.length === 0 ? (
        <Card className="py-12">
          <CardContent className="text-muted-foreground text-center text-sm">
            No providers yet.
          </CardContent>
        </Card>
      ) : (
        <div className="min-w-0 overflow-hidden rounded-xl border bg-card">
          <Table className="table-fixed">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[22%]">Name</TableHead>
                <TableHead className="w-[34%]">Website</TableHead>
                <TableHead className="w-[26%]">Email</TableHead>
                <TableHead className="w-[8%]">Clubs</TableHead>
                <TableHead className="w-[10%] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {providers.map((provider) => (
                <TableRow key={provider.id}>
                  <TableCell className="truncate font-medium">
                    <span className="block truncate" title={provider.name}>
                      {provider.name}
                    </span>
                  </TableCell>
                  <TableCell className="max-w-0 truncate text-sm">
                    {provider.website ? (
                      <a
                        href={provider.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary block truncate hover:underline"
                        title={provider.website}
                      >
                        {provider.website}
                      </a>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell className="max-w-0 truncate text-sm">
                    {provider.contactEmail ? (
                      <a
                        href={`mailto:${provider.contactEmail}`}
                        className="block truncate hover:underline"
                        title={provider.contactEmail}
                      >
                        {provider.contactEmail}
                      </a>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell>{provider._count.clubs}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setEditing(provider);
                          setOpen(true);
                        }}
                        aria-label={`Edit ${provider.name}`}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={pending}
                        onClick={() => handleDelete(provider.id)}
                      >
                        Delete
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
