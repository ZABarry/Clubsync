import type { LucideIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type EmptyStateCardProps = {
  icon: LucideIcon;
  children: React.ReactNode;
  className?: string;
};

export function EmptyStateCard({
  icon: Icon,
  children,
  className,
}: EmptyStateCardProps) {
  return (
    <Card className={cn("py-8", className)}>
      <CardContent className="flex flex-col items-center gap-2 text-center">
        <Icon className="text-muted-foreground size-8" aria-hidden />
        <div className="text-muted-foreground text-sm">{children}</div>
      </CardContent>
    </Card>
  );
}
