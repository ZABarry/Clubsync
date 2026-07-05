"use client";

import dynamic from "next/dynamic";
import type { ComponentProps } from "react";

import { Skeleton } from "@/components/ui/skeleton";

const ClubCalendarInner = dynamic(
  () => import("./club-calendar").then((mod) => mod.ClubCalendar),
  {
    ssr: false,
    loading: () => (
      <Skeleton className="h-80 w-full rounded-xl" aria-label="Loading calendar" />
    ),
  },
);

type ClubCalendarLazyProps = ComponentProps<
  typeof import("./club-calendar").ClubCalendar
>;

export function ClubCalendarLazy(props: ClubCalendarLazyProps) {
  return <ClubCalendarInner {...props} />;
}
