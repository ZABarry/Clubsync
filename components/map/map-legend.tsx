import type { ClubMapMarker } from "@/lib/types/club";
import { cn } from "@/lib/utils";

const LEGEND_ITEMS: Array<{
  variant: ClubMapMarker["variant"];
  label: string;
  color: string;
}> = [
  { variant: "mine", label: "My clubs", color: "#FF6B54" },
  { variant: "friend", label: "Friend clubs", color: "#38BDF8" },
  { variant: "shared", label: "Shared clubs", color: "#C084FC" },
  { variant: "suggested", label: "Suggested", color: "#FBBF24" },
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
