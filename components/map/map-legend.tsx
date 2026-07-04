import type { CampMapMarker } from "@/lib/types/camp";
import { cn } from "@/lib/utils";

const LEGEND_ITEMS: Array<{
  variant: CampMapMarker["variant"];
  label: string;
  color: string;
}> = [
  { variant: "mine", label: "My camps", color: "#0ea5e9" },
  { variant: "friend", label: "Friend camps", color: "#8b5cf6" },
  { variant: "shared", label: "Shared camps", color: "#ec4899" },
  { variant: "suggested", label: "Suggested", color: "#f59e0b" },
];

type MapLegendProps = {
  className?: string;
  variants?: CampMapMarker["variant"][];
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
