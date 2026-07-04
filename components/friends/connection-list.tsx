import { ArrowDownLeft, ArrowUpRight } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { TrustedConnection } from "@/lib/types/club";
import { cn } from "@/lib/utils";

type ConnectionListProps = {
  connections: TrustedConnection[];
  className?: string;
  emptyMessage?: string;
  actions?: (connection: TrustedConnection) => React.ReactNode;
};

function initials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

const STATUS_VARIANT: Record<
  TrustedConnection["status"],
  "default" | "secondary" | "destructive" | "outline"
> = {
  ACCEPTED: "default",
  PENDING: "secondary",
  DECLINED: "destructive",
  REVOKED: "outline",
};

export function ConnectionList({
  connections,
  className,
  emptyMessage = "No trusted connections yet.",
  actions,
}: ConnectionListProps) {
  if (connections.length === 0) {
    return (
      <Card className={cn("py-8", className)}>
        <CardContent className="text-muted-foreground text-center text-sm">
          {emptyMessage}
        </CardContent>
      </Card>
    );
  }

  return (
    <ul className={cn("space-y-3", className)}>
      {connections.map((connection) => (
        <li key={connection.id}>
          <Card className="gap-3 py-4">
            <CardHeader className="flex-row items-center gap-3 space-y-0 px-4">
              <Avatar>
                <AvatarFallback>{initials(connection.displayName)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <CardTitle className="text-sm font-medium">
                    {connection.displayName}
                  </CardTitle>
                  <Badge variant={STATUS_VARIANT[connection.status]}>
                    {connection.status.toLowerCase()}
                  </Badge>
                  {connection.direction === "sent" ? (
                    <span className="text-muted-foreground inline-flex items-center gap-0.5 text-xs">
                      <ArrowUpRight className="size-3" />
                      Sent
                    </span>
                  ) : (
                    <span className="text-muted-foreground inline-flex items-center gap-0.5 text-xs">
                      <ArrowDownLeft className="size-3" />
                      Received
                    </span>
                  )}
                </div>
                {connection.acceptedAt ? (
                  <CardDescription className="text-xs">
                    Connected{" "}
                    {new Date(connection.acceptedAt).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </CardDescription>
                ) : null}
              </div>
              {actions ? actions(connection) : null}
            </CardHeader>
          </Card>
        </li>
      ))}
    </ul>
  );
}
