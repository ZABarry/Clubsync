"use client";

import { Star } from "lucide-react";

import { cn } from "@/lib/utils";

type StarRatingInputProps = {
  value: number;
  onChange: (value: number) => void;
  max?: number;
  disabled?: boolean;
  id?: string;
  "aria-label"?: string;
};

export function StarRatingInput({
  value,
  onChange,
  max = 5,
  disabled = false,
  id,
  "aria-label": ariaLabel = "Rating",
}: StarRatingInputProps) {
  return (
    <div
      id={id}
      role="radiogroup"
      aria-label={ariaLabel}
      className="flex items-center gap-1"
    >
      {Array.from({ length: max }, (_, index) => {
        const starValue = index + 1;
        const filled = starValue <= value;

        return (
          <button
            key={starValue}
            type="button"
            role="radio"
            aria-checked={value === starValue}
            disabled={disabled}
            onClick={() => onChange(starValue)}
            className={cn(
              "rounded p-0.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              disabled && "cursor-not-allowed opacity-50",
            )}
          >
            <Star
              className={cn(
                "size-6",
                filled
                  ? "fill-amber-400 text-amber-400"
                  : "text-muted-foreground/40",
              )}
              aria-hidden
            />
            <span className="sr-only">
              {starValue} star{starValue === 1 ? "" : "s"}
            </span>
          </button>
        );
      })}
    </div>
  );
}
