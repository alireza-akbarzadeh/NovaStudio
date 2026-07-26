"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Id } from "@/convex/_generated/dataModel";
import { parseConvexErrorMessage } from "@/features/github/lib/github-errors";
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

export function CalendarHubView() {
  const deadlines = useWorkspaceDeadlines(100);
  const projects = useWorkspaceProjects();
  const createDeadline = useCreateDeadline();
  const deleteDeadline = useDeleteDeadline();

  const [selected, setSelected] = useState<Date | undefined>(new Date());
  const [title, setTitle] = useState("");
  const [projectId, setProjectId] = useState("");
  const [saving, setSaving] = useState(false);

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

  async function handleCreate() {
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

  return (
    <div className="mx-auto w-full max-w-5xl">
      <HubPageHeader
        title="Calendar"
        description="Deadlines across your projects — pick a day to review or add one."
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
            <h2 className="text-sm font-semibold tracking-tight">
              {selected
                ? selected.toLocaleDateString(undefined, {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                  })
                : "Select a day"}
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
                onClick={() => void handleCreate()}
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
