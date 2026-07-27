"use client";

import { useAction } from "convex/react";
import { useCallback, useState } from "react";
import { toast } from "sonner";

import { api } from "@/convex/_generated/api";
import { parseConvexErrorMessage } from "@/features/github/lib/github-errors";

export type GoogleCalendarEvent = {
  id: string;
  title: string;
  description?: string | null;
  htmlLink?: string | null;
  hangoutLink?: string | null;
  location?: string | null;
  start: string;
  end: string;
  allDay: boolean;
  status?: string | null;
};

export function useGoogleCalendarEvents() {
  const listEventsAction = useAction(api.googleCalendarActions.listEvents);
  const createEventAction = useAction(api.googleCalendarActions.createEvent);

  const [isListing, setIsListing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const listEvents = useCallback(
    async (args: { timeMin: string; timeMax: string; maxResults?: number }) => {
      setIsListing(true);
      try {
        return (await listEventsAction(args)) as GoogleCalendarEvent[];
      } catch (error) {
        throw new Error(
          parseConvexErrorMessage(error, "Failed to load Google Calendar events"),
        );
      } finally {
        setIsListing(false);
      }
    },
    [listEventsAction],
  );

  const createEvent = useCallback(
    async (args: {
      title: string;
      description?: string;
      startIso: string;
      endIso: string;
      timeZone?: string;
      addMeetLink?: boolean;
    }) => {
      setIsCreating(true);
      try {
        const event = (await createEventAction(args)) as GoogleCalendarEvent;
        toast.success(
          event.hangoutLink ? "Meeting created with Meet link" : "Meeting created",
        );
        return event;
      } catch (error) {
        toast.error(
          parseConvexErrorMessage(error, "Failed to create meeting"),
        );
        throw error;
      } finally {
        setIsCreating(false);
      }
    },
    [createEventAction],
  );

  return {
    listEvents,
    createEvent,
    isListing,
    isCreating,
  };
}
