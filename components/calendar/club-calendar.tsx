"use client";

import type { EventClickArg } from "@fullcalendar/core";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import FullCalendar from "@fullcalendar/react";
import { useMemo } from "react";

import type { ClubCalendarEvent } from "@/lib/types/club";
import { getPlannedClubStatusCalendarColor } from "@/lib/clubs/planned-club-status-styles";
import { cn } from "@/lib/utils";

type CalendarViewMode = "dayGridDay" | "dayGridMonth";

type ClubCalendarProps = {
  events: ClubCalendarEvent[];
  onEventClick?: (event: ClubCalendarEvent) => void;
  className?: string;
  initialDate?: Date | string;
  initialView?: CalendarViewMode;
};

function toRequiredDate(value: Date | string): Date {
  return value instanceof Date ? value : new Date(value);
}

function toDate(value: Date | string | null): Date | null {
  if (value == null) return null;
  return value instanceof Date ? value : new Date(value);
}

function toAllDayEnd(start: Date, end: Date): Date {
  if (start.getTime() >= end.getTime()) {
    const next = new Date(start);
    next.setUTCDate(next.getUTCDate() + 1);
    return next;
  }
  const next = new Date(end);
  next.setUTCDate(next.getUTCDate() + 1);
  return next;
}

export function ClubCalendar({
  events,
  onEventClick,
  className,
  initialDate,
  initialView = "dayGridMonth",
}: ClubCalendarProps) {
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
            end: toAllDayEnd(start, end),
            allDay: true,
            backgroundColor: getPlannedClubStatusCalendarColor(event.status),
            borderColor: "transparent",
            extendedProps: {
              clubId: event.clubId,
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
    <div className={cn("club-calendar rounded-xl border bg-card p-2", className)}>
      <FullCalendar
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView={initialView}
        initialDate={initialDate ? toRequiredDate(initialDate) : undefined}
        events={calendarEvents}
        eventClick={handleEventClick}
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "dayGridDay,dayGridMonth",
        }}
        views={{
          dayGridMonth: {
            buttonText: "Month",
            dayMaxEvents: 3,
            fixedWeekCount: false,
          },
          dayGridDay: {
            buttonText: "Day",
            dayMaxEvents: false,
          },
        }}
        height="auto"
        eventDisplay="block"
      />
    </div>
  );
}
