import type { ClubMapMarker } from "@/lib/types/club";
import { cn } from "@/lib/utils";

const LEGEND_ITEMS: Array<{
  variant: ClubMapMarker["variant"];
  label: string;
  color: string;
}> = [
  { variant: "mine", label: "My clubs", color: "#0ea5e9" },
  { variant: "friend", label: "Friend clubs", color: "#8b5cf6" },
  { variant: "shared", label: "Shared clubs", color: "#ec4899" },
  { variant: "suggested", label: "Suggested", color: "#f59e0b" },
];

type MapLegendProps = {
  className?: string;
  variants?: ClubMapMarker["variant"][];
};

export function MapLegend({ className, variants }: MapLegendProps) {
  const items = variants
    ? LEGEND_ITEMS.filter((item) => variants.includes(item.variant))
    : LEGEND_ITEMS;

  return (
    <div className={cn("flex flex-wrap gap-3 text-xs", className)}>
      {items.map((item) => (
        <span key={item.variant} className="inline-flex items-center gap-1.5">
          <span
            className="size-3 rounded-full border border-white shadow-sm"
            style={{ backgroundColor: item.color }}
          />
          {item.label}
        </span>
      ))}
    </div>
  );
}
