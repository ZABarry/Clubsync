"use client";

import dynamic from "next/dynamic";
import type { ComponentProps } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const ClubMapInner = dynamic(
  () => import("./club-map").then((mod) => mod.ClubMap),
  {
    ssr: false,
    loading: () => <Skeleton className="size-full rounded-xl" aria-hidden />,
  },
);

type ClubMapLazyProps = ComponentProps<
  typeof import("./club-map").ClubMap
>;

export function ClubMapLazy({ className, ...props }: ClubMapLazyProps) {
  return (
    <div className={cn("relative overflow-hidden rounded-xl", className)}>
      <ClubMapInner {...props} className="size-full border-0" />
    </div>
  );
}
