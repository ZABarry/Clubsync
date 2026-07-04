"use client";

import { Check, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ModerationItem } from "@/lib/types/club";
import { cn } from "@/lib/utils";

type ModerationQueueProps = {
  items: ModerationItem[];
  onApprove?: (item: ModerationItem) => void;
  onReject?: (item: ModerationItem) => void;
  loadingId?: string | null;
  className?: string;
  emptyMessage?: string;
};

const STATUS_VARIANT: Record<
  ModerationItem["status"],
  "default" | "secondary" | "destructive" | "outline"
> = {
  PENDING: "secondary",
  APPROVED: "default",
  REJECTED: "destructive",
};

export function ModerationQueue({
  items,
  onApprove,
  onReject,
  loadingId,
  className,
  emptyMessage = "No items in the moderation queue.",
}: ModerationQueueProps) {
  if (items.length === 0) {
    return (
      <div
        className={cn(
          "text-muted-foreground rounded-xl border bg-card py-12 text-center text-sm",
          className,
        )}
      >
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className={cn("rounded-xl border bg-card", className)}>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Type</TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Submitted by</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => {
            const isLoading = loadingId === item.id;
            const canModerate = item.status === "PENDING";

            return (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.type}</TableCell>
                <TableCell>
                  <div className="max-w-xs">
                    <p className="truncate font-medium">{item.title}</p>
                    {item.preview ? (
                      <p className="text-muted-foreground truncate text-xs">
                        {item.preview}
                      </p>
                    ) : null}
                  </div>
                </TableCell>
                <TableCell>{item.submittedBy}</TableCell>
                <TableCell>
                  {new Date(item.submittedAt).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </TableCell>
                <TableCell>
                  <Badge variant={STATUS_VARIANT[item.status]}>
                    {item.status.toLowerCase()}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  {canModerate && (onApprove || onReject) ? (
                    <div className="flex justify-end gap-1">
                      {onApprove ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={isLoading}
                          onClick={() => onApprove(item)}
                          aria-label={`Approve ${item.title}`}
                        >
                          <Check className="size-4 text-emerald-600" />
                        </Button>
                      ) : null}
                      {onReject ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={isLoading}
                          onClick={() => onReject(item)}
                          aria-label={`Reject ${item.title}`}
                        >
                          <X className="size-4 text-destructive" />
                        </Button>
                      ) : null}
                    </div>
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
  );
}
