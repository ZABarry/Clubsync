"use client";

import { Pencil, Trash2 } from "lucide-react";

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

function formatSchoolYear(schoolYear: string | null): string | null {
  if (!schoolYear?.trim()) return null;
  const trimmed = schoolYear.trim();
  if (/^year\s/i.test(trimmed)) return trimmed;
  if (/^\d+$/.test(trimmed)) return `Year ${trimmed}`;
  return trimmed;
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
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2.5 gap-y-1.5">
            <CardTitle className="shrink-0 text-base">{child.nickname}</CardTitle>
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge variant="secondary" className="text-xs">
                Age {child.age}
              </Badge>
              {sexLabel ? (
                <Badge variant="secondary" className="text-xs">
                  {sexLabel}
                </Badge>
              ) : null}
              {schoolYear ? (
                <Badge variant="secondary" className="text-xs">
                  {schoolYear}
                </Badge>
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
