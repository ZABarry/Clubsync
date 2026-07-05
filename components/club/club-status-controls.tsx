"use client";

import type { PlannedClubStatus } from "@/lib/types/club";
import {
  Ban,
  Bookmark,
  CalendarCheck,
  CreditCard,
  Heart,
  Sparkles,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const STATUS_OPTIONS: {
  status: PlannedClubStatus;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { status: "INTERESTED", label: "Interested", icon: Sparkles },
  { status: "FAVOURITE", label: "Favourite", icon: Heart },
  { status: "PLANNED", label: "Planned", icon: Bookmark },
  { status: "BOOKED", label: "Booked", icon: CalendarCheck },
  { status: "PAID", label: "Paid", icon: CreditCard },
  { status: "CANCELLED", label: "Cancelled", icon: Ban },
];

type ClubStatusControlsProps = {
  currentStatus?: PlannedClubStatus | null;
  onStatusChange: (status: PlannedClubStatus) => void;
  onStatusClear?: () => void;
  disabled?: boolean;
  className?: string;
};

export function ClubStatusControls({
  currentStatus,
  onStatusChange,
  onStatusClear,
  disabled = false,
  className,
}: ClubStatusControlsProps) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {STATUS_OPTIONS.map(({ status, label, icon: Icon }) => {
        const isActive = currentStatus === status;

        return (
          <Button
            key={status}
            type="button"
            variant={isActive ? "default" : "outline"}
            size="sm"
            disabled={disabled}
            onClick={() => {
              if (isActive && onStatusClear) {
                onStatusClear();
                return;
              }
              onStatusChange(status);
            }}
            aria-pressed={isActive}
          >
            <Icon className="size-3.5" />
            {label}
          </Button>
        );
      })}
    </div>
  );
}
