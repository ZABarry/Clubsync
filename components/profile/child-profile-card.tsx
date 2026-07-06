"use client";

import { Cake, GraduationCap, Pencil, Trash2, UserRound } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatChildInterest } from "@/lib/clubs/child-interests";
import { formatChildSex, type ChildSex } from "@/lib/clubs/child-sex";
import { cn } from "@/lib/utils";

function formatSchoolYear(schoolYear: string | null): string | null {
  if (!schoolYear?.trim()) return null;
  const trimmed = schoolYear.trim();
  if (/^year\s/i.test(trimmed)) return trimmed;
  if (/^\d+$/.test(trimmed)) return `Year ${trimmed}`;
  return trimmed;
}

function ChildDetailChip({
  icon: Icon,
  children,
}: {
  icon: typeof Cake;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-border/70",
        "bg-muted/50 px-2 py-0.5 text-xs text-muted-foreground",
      )}
    >
      <Icon className="size-3 shrink-0 opacity-70" aria-hidden />
      {children}
    </span>
  );
}

export type ChildProfileCardData = {
  id: string;
  nickname: string;
  age: number;
  sex: ChildSex | null;
  schoolYear: string | null;
  interests: string[];
};

type ChildProfileCardProps = {
  child: ChildProfileCardData;
  onEdit: () => void;
  onDelete: () => void;
  disabled?: boolean;
};

export function ChildProfileCard({
  child,
  onEdit,
  onDelete,
  disabled = false,
}: ChildProfileCardProps) {
  const schoolYear = formatSchoolYear(child.schoolYear);
  const sexLabel = formatChildSex(child.sex);

  return (
    <Card className="gap-3 py-4">
      <CardHeader className="gap-2 px-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1 space-y-2">
            <CardTitle className="text-base">{child.nickname}</CardTitle>
            <div className="flex flex-wrap items-center gap-1.5">
              <ChildDetailChip icon={Cake}>Age {child.age}</ChildDetailChip>
              {sexLabel ? (
                <ChildDetailChip icon={UserRound}>{sexLabel}</ChildDetailChip>
              ) : null}
              {schoolYear ? (
                <ChildDetailChip icon={GraduationCap}>{schoolYear}</ChildDetailChip>
              ) : null}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onEdit}
              aria-label={`Edit ${child.nickname}`}
            >
              <Pencil className="size-3.5" />
              Edit
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onDelete}
              disabled={disabled}
              aria-label={`Delete ${child.nickname}`}
            >
              <Trash2 className="size-3.5" />
              Delete
            </Button>
          </div>
        </div>
      </CardHeader>
      {child.interests.length > 0 ? (
        <CardContent className="px-4 pt-0">
          <p className="text-muted-foreground mb-1.5 text-[11px] font-medium tracking-wide uppercase">
            Interests
          </p>
          <div className="flex flex-wrap gap-1.5">
            {child.interests.map((interest) => (
              <Badge key={interest} variant="secondary" className="text-xs">
                {formatChildInterest(interest)}
              </Badge>
            ))}
          </div>
        </CardContent>
      ) : (
        <CardContent className="text-muted-foreground px-4 pt-0 text-xs">
          No interests selected yet
        </CardContent>
      )}
    </Card>
  );
}
