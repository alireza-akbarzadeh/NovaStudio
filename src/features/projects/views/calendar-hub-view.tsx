/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import Link from "next/link";
import { ExternalLinkIcon, Loader2Icon, VideoIcon } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Id } from "@/convex/_generated/dataModel";
import { parseConvexErrorMessage } from "@/features/github/lib/github-errors";
import {
  useConnectGoogleCalendar,
  useGoogleCalendarConnection,
} from "@/features/integrations/hooks/use-google-calendar-connection";
import {
  useGoogleCalendarEvents,
  type GoogleCalendarEvent,
} from "@/features/integrations/hooks/use-google-calendar-events";
import { HubPageHeader } from "@/features/projects/components/workspace/hub-page-header";
import {
  useCreateDeadline,
  useDeleteDeadline,
  useWorkspaceDeadlines,
  useWorkspaceProjects,
} from "@/features/projects/hooks/use-workspace";
import { cn } from "@/lib/utils";

const toneDot = {
  orange: "bg-orange-500",
  blue: "bg-sky-500",
  violet: "bg-violet-500",
  green: "bg-emerald-500",
} as const;

function dayKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function startOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function endOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(23, 59, 59, 999);
  return next;
}

function formatEventTime(event: GoogleCalendarEvent) {
  if (event.allDay) return "All day";
  const start = new Date(event.start);
  const end = new Date(event.end);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return "";
  }
  const opts: Intl.DateTimeFormatOptions = {
    hour: "numeric",
    minute: "2-digit",
  };
  return `${start.toLocaleTimeString(undefined, opts)} – ${end.toLocaleTimeString(undefined, opts)}`;
}

function toLocalInputValue(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function CalendarHubView() {
  const deadlines = useWorkspaceDeadlines(100);
  const projects = useWorkspaceProjects();
  const createDeadline = useCreateDeadline();
  const deleteDeadline = useDeleteDeadline();
  const {
    isConnected: isGoogleConnected,
    isLoading: isGoogleLoading,
    hasCalendarScope,
  } = useGoogleCalendarConnection();
  const { connect, isConnecting } = useConnectGoogleCalendar();
  const { listEvents, createEvent, isListing, isCreating } =
    useGoogleCalendarEvents();

  const [selected, setSelected] = useState<Date | undefined>(new Date());
  const [title, setTitle] = useState("");
  const [projectId, setProjectId] = useState("");
  const [saving, setSaving] = useState(false);

  const [meetingTitle, setMeetingTitle] = useState("");
  const [meetingStart, setMeetingStart] = useState("");
  const [meetingEnd, setMeetingEnd] = useState("");
  const [addMeetLink, setAddMeetLink] = useState(true);
  const [events, setEvents] = useState<GoogleCalendarEvent[] | null>(null);
  const [eventsError, setEventsError] = useState<string | null>(null);

  const byDay = useMemo(() => {
    const map = new Map<string, NonNullable<typeof deadlines>>();
    for (const item of deadlines ?? []) {
      const d = new Date(item.dueAt);
      const key = dayKey(d);
      const list = map.get(key) ?? [];
      list.push(item);
      map.set(key, list);
    }
    return map;
  }, [deadlines]);

  const selectedKey = selected ? dayKey(selected) : null;
  const dayItems = selectedKey ? (byDay.get(selectedKey) ?? []) : [];
  const daysWithDeadlines = useMemo(
    () =>
      [...byDay.keys()].map((key) => {
        const [y, m, d] = key.split("-").map(Number);
        return new Date(y!, m!, d!);
      }),
    [byDay],
  );

  const dayEvents = useMemo(() => {
    if (!selected || !events) return [];
    const start = startOfDay(selected).getTime();
    const end = endOfDay(selected).getTime();
    return events.filter((event) => {
      const eventStart = new Date(event.start).getTime();
      if (Number.isNaN(eventStart)) return false;
      return eventStart >= start && eventStart <= end;
    });
  }, [events, selected]);

  const loadEvents = useCallback(async () => {
    if (!isGoogleConnected || !hasCalendarScope) {
      setEvents(null);
      return;
    }
    const now = new Date();
    const timeMin = startOfDay(
      new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7),
    ).toISOString();
    const timeMax = endOfDay(
      new Date(now.getFullYear(), now.getMonth(), now.getDate() + 45),
    ).toISOString();
    setEventsError(null);
    try {
      setEvents(await listEvents({ timeMin, timeMax, maxResults: 80 }));
    } catch (error) {
      setEvents(null);
      setEventsError(
        error instanceof Error ? error.message : "Failed to load meetings",
      );
    }
  }, [hasCalendarScope, isGoogleConnected, listEvents]);

  useEffect(() => {
    void loadEvents();
  }, [loadEvents]);

  useEffect(() => {
    if (!selected) return;
    const start = new Date(selected);
    start.setHours(10, 0, 0, 0);
    const end = new Date(selected);
    end.setHours(10, 30, 0, 0);
    setMeetingStart(toLocalInputValue(start));
    setMeetingEnd(toLocalInputValue(end));
  }, [selected]);

  async function handleCreateDeadline() {
    if (!selected || !projectId || !title.trim()) return;
    setSaving(true);
    try {
      const dueAt = new Date(selected);
      dueAt.setHours(17, 0, 0, 0);
      await createDeadline({
        projectId: projectId as Id<"projects">,
        title: title.trim(),
        dueAt: dueAt.getTime(),
        tone: "violet",
      });
      setTitle("");
      toast.success("Deadline added");
    } catch (error) {
      toast.error(parseConvexErrorMessage(error, "Could not create deadline"));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteDeadline({ deadlineId: id as Id<"projectDeadlines"> });
      toast.success("Deadline removed");
    } catch (error) {
      toast.error(parseConvexErrorMessage(error, "Could not delete deadline"));
    }
  }

  async function handleCreateMeeting() {
    if (!meetingTitle.trim() || !meetingStart || !meetingEnd) return;
    const start = new Date(meetingStart);
    const end = new Date(meetingEnd);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      toast.error("Pick a valid start and end time");
      return;
    }
    if (end <= start) {
      toast.error("End time must be after start time");
      return;
    }

    try {
      await createEvent({
        title: meetingTitle.trim(),
        startIso: start.toISOString(),
        endIso: end.toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        addMeetLink,
      });
      setMeetingTitle("");
      await loadEvents();
    } catch {
      // toast in hook
    }
  }

  const googleReady = isGoogleConnected && hasCalendarScope;

  return (
    <div className="mx-auto w-full max-w-5xl">
      <HubPageHeader
        title="Calendar"
        description="Project deadlines and Google Calendar meetings in one place."
      />

      <div className="grid gap-6 lg:grid-cols-[auto_1fr]">
        <div className="rounded-[22px] border border-border/60 bg-card/80 p-3 backdrop-blur-xl">
          <Calendar
            mode="single"
            selected={selected}
            onSelect={setSelected}
            modifiers={{ hasDeadline: daysWithDeadlines }}
            modifiersClassNames={{
              hasDeadline:
                "relative after:absolute after:bottom-1 after:left-1/2 after:size-1 after:-translate-x-1/2 after:rounded-full after:bg-primary",
            }}
            className="rounded-xl"
          />
        </div>

        <div className="space-y-4">
          <section className="rounded-[22px] border border-border/60 bg-card/80 p-5 backdrop-blur-xl">
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-sm font-semibold tracking-tight">
                Meetings
                {selected
                  ? ` · ${selected.toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })}`
                  : ""}
              </h2>
              {googleReady ? (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 rounded-lg text-xs"
                  disabled={isListing}
                  onClick={() => void loadEvents()}
                >
                  {isListing ? (
                    <Loader2Icon className="size-3.5 animate-spin" />
                  ) : (
                    "Refresh"
                  )}
                </Button>
              ) : null}
            </div>

            {isGoogleLoading ? (
              <p className="mt-3 text-sm text-muted-foreground">
                Loading Google Calendar…
              </p>
            ) : !googleReady ? (
              <div className="mt-3 space-y-3">
                <p className="text-sm text-muted-foreground">
                  Connect Google Calendar to see meetings and create events with
                  Meet links.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    className="rounded-xl"
                    disabled={isConnecting}
                    onClick={() => void connect()}
                  >
                    {isConnecting ? "Connecting…" : "Connect Google Calendar"}
                  </Button>
                  <Button asChild size="sm" variant="outline" className="rounded-xl">
                    <Link href="/projects/integrations">Integrations</Link>
                  </Button>
                </div>
              </div>
            ) : eventsError ? (
              <div className="mt-3 space-y-2">
                <p className="text-sm text-destructive">{eventsError}</p>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 rounded-lg text-xs"
                  onClick={() => void loadEvents()}
                >
                  Try again
                </Button>
              </div>
            ) : isListing && events === null ? (
              <p className="mt-3 text-sm text-muted-foreground">
                Loading meetings…
              </p>
            ) : dayEvents.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">
                No meetings on this day.
              </p>
            ) : (
              <ul className="mt-3 space-y-3">
                {dayEvents.map((event) => (
                  <li
                    key={event.id}
                    className="flex items-start gap-2.5 rounded-xl border border-border/50 bg-background/40 px-3 py-2.5"
                  >
                    <span className="mt-1.5 size-2 shrink-0 rounded-full bg-[#4285F4]" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {event.title}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {formatEventTime(event)}
                      </p>
                      <div className="mt-1.5 flex flex-wrap gap-2">
                        {event.hangoutLink ? (
                          <a
                            href={event.hangoutLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline"
                          >
                            <VideoIcon className="size-3" />
                            Join Meet
                          </a>
                        ) : null}
                        {event.htmlLink ? (
                          <a
                            href={event.htmlLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-primary"
                          >
                            <ExternalLinkIcon className="size-3" />
                            Open in Google
                          </a>
                        ) : null}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {googleReady ? (
            <section className="rounded-[22px] border border-border/60 bg-card/80 p-5 backdrop-blur-xl">
              <h2 className="mb-3 text-sm font-semibold tracking-tight">
                Schedule meeting
              </h2>
              <div className="flex flex-col gap-2">
                <Input
                  value={meetingTitle}
                  onChange={(event) => setMeetingTitle(event.target.value)}
                  placeholder="Meeting title"
                  className="h-9 rounded-xl"
                />
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Input
                    type="datetime-local"
                    value={meetingStart}
                    onChange={(event) => setMeetingStart(event.target.value)}
                    className="h-9 rounded-xl"
                  />
                  <Input
                    type="datetime-local"
                    value={meetingEnd}
                    onChange={(event) => setMeetingEnd(event.target.value)}
                    className="h-9 rounded-xl"
                  />
                </div>
                <label className="flex items-center gap-2 text-xs text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={addMeetLink}
                    onChange={(event) => setAddMeetLink(event.target.checked)}
                    className="size-3.5 rounded border-border"
                  />
                  Add Google Meet link
                </label>
                <Button
                  size="sm"
                  className="w-fit rounded-xl"
                  disabled={
                    isCreating ||
                    !meetingTitle.trim() ||
                    !meetingStart ||
                    !meetingEnd
                  }
                  onClick={() => void handleCreateMeeting()}
                >
                  {isCreating ? (
                    <>
                      <Loader2Icon className="size-3.5 animate-spin" />
                      Creating…
                    </>
                  ) : (
                    "Create meeting"
                  )}
                </Button>
              </div>
            </section>
          ) : null}

          <section className="rounded-[22px] border border-border/60 bg-card/80 p-5 backdrop-blur-xl">
            <h2 className="text-sm font-semibold tracking-tight">
              Deadlines
              {selected
                ? ` · ${selected.toLocaleDateString(undefined, {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                  })}`
                : ""}
            </h2>

            {deadlines === undefined ? (
              <p className="mt-3 text-sm text-muted-foreground">Loading…</p>
            ) : dayItems.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">
                No deadlines on this day.
              </p>
            ) : (
              <ul className="mt-3 space-y-3">
                {dayItems.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-start gap-2.5 rounded-xl border border-border/50 bg-background/40 px-3 py-2.5"
                  >
                    <span
                      className={cn(
                        "mt-1.5 size-2 shrink-0 rounded-full",
                        toneDot[item.tone] ?? toneDot.violet,
                      )}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{item.title}</p>
                      <Link
                        href={`/projects/${item.projectId}`}
                        className="truncate text-[11px] text-muted-foreground hover:text-primary"
                      >
                        {item.project}
                      </Link>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 rounded-lg text-xs"
                      onClick={() => void handleDelete(item.id)}
                    >
                      Remove
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-[22px] border border-border/60 bg-card/80 p-5 backdrop-blur-xl">
            <h2 className="mb-3 text-sm font-semibold tracking-tight">
              Add deadline
            </h2>
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Deadline title"
                className="h-9 min-w-[180px] flex-1 rounded-xl border border-border/60 bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
              />
              <Select value={projectId || undefined} onValueChange={setProjectId}>
                <SelectTrigger className="h-9 w-full rounded-xl sm:w-[200px]">
                  <SelectValue placeholder="Project" />
                </SelectTrigger>
                <SelectContent>
                  {(projects ?? []).map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                size="sm"
                className="rounded-xl"
                disabled={saving || !title.trim() || !projectId || !selected}
                onClick={() => void handleCreateDeadline()}
              >
                Add
              </Button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
