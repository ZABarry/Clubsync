"use client";

import type { EventClickArg } from "@fullcalendar/core";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import FullCalendar from "@fullcalendar/react";
import { useMemo } from "react";

import type { CampCalendarEvent } from "@/lib/types/camp";
import { cn } from "@/lib/utils";

type CampCalendarProps = {
  events: CampCalendarEvent[];
  onEventClick?: (event: CampCalendarEvent) => void;
  className?: string;
  initialDate?: Date | string;
};

function toRequiredDate(value: Date | string): Date {
  return value instanceof Date ? value : new Date(value);
}

function toDate(value: Date | string | null): Date | null {
  if (value == null) return null;
  return value instanceof Date ? value : new Date(value);
}

const STATUS_COLORS: Record<string, string> = {
  SUGGESTED: "#38bdf8",
  INTERESTED: "#3b82f6",
  FAVOURITE: "#8b5cf6",
  PLANNED: "#f59e0b",
  BOOKED: "#10b981",
  PAID: "#22c55e",
  CANCELLED: "#ef4444",
};

export function CampCalendar({
  events,
  onEventClick,
  className,
  initialDate,
}: CampCalendarProps) {
  const calendarEvents = useMemo(
    () =>
      events.flatMap((event) => {
        const start = toDate(event.start);
        const end = toDate(event.end);
        if (!start || !end) return [];

        return [
          {
            id: event.id,
            title: event.title,
            start,
            end,
            allDay: true,
            backgroundColor: event.status
              ? STATUS_COLORS[event.status]
              : STATUS_COLORS.INTERESTED,
            borderColor: "transparent",
            extendedProps: {
              campId: event.campId,
              status: event.status,
            },
          },
        ];
      }),
    [events],
  );

  const handleEventClick = (info: EventClickArg) => {
    if (!onEventClick) return;

    const matched = events.find((e) => e.id === info.event.id);
    if (matched) {
      onEventClick(matched);
    }
  };

  return (
    <div className={cn("camp-calendar rounded-xl border bg-card p-2", className)}>
      <FullCalendar
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        initialDate={initialDate ? toRequiredDate(initialDate) : undefined}
        events={calendarEvents}
        eventClick={handleEventClick}
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "",
        }}
        height="auto"
        fixedWeekCount={false}
        dayMaxEvents={3}
        eventDisplay="block"
      />
    </div>
  );
}
