"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ClubPostcodeFieldProps = {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string | null;
  hint?: string | null;
  disabled?: boolean;
};

export function ClubPostcodeField({
  id = "club-postcode",
  value,
  onChange,
  error,
  hint,
  disabled = false,
}: ClubPostcodeFieldProps) {
  return (
    <div className="space-y-1">
      <Label htmlFor={id}>UK postcode</Label>
      <Input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="e.g. KT3 4AA"
        autoComplete="postal-code"
        disabled={disabled}
      />
      {error ? (
        <p className="text-destructive text-sm">{error}</p>
      ) : hint ? (
        <p className="text-muted-foreground text-xs">{hint}</p>
      ) : (
        <p className="text-muted-foreground text-xs">
          Used to place the club on the map. Leave blank to keep the current
          map pin when editing.
        </p>
      )}
    </div>
  );
}
