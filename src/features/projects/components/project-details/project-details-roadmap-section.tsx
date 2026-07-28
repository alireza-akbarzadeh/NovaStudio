"use client";

import { CheckCircle2Icon, CircleIcon } from "lucide-react";

import type { ProjectDetailsTodo } from "@/features/projects/lib/project-details-types";
import { todoStatusLabel } from "@/features/projects/lib/project-details-utils";
import { cn } from "@/lib/utils";

type ProjectDetailsRoadmapSectionProps = {
  todos: ProjectDetailsTodo[];
};

export function ProjectDetailsRoadmapSection({
  todos,
}: ProjectDetailsRoadmapSectionProps) {
  return (
    <section className="rounded-[24px] border border-border/60 bg-card/85 p-6">
      <h2 className="text-lg font-semibold tracking-tight">Public roadmap</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        What the team is building next.
      </p>
      {todos.length > 0 ? (
        <ul className="mt-4 space-y-2">
          {todos.map((todo) => (
            <li
              key={todo.id}
              className="flex items-start gap-3 rounded-xl border border-border/50 bg-muted/15 px-3 py-3"
            >
              {todo.status === "done" ? (
                <CheckCircle2Icon className="mt-0.5 size-4 shrink-0 text-emerald-500" />
              ) : (
                <CircleIcon
                  className={cn(
                    "mt-0.5 size-4 shrink-0",
                    todo.status === "in-progress"
                      ? "text-violet-500"
                      : "text-muted-foreground",
                  )}
                />
              )}
              <div className="min-w-0 flex-1">
                <p
                  className={cn(
                    "text-sm",
                    todo.status === "done" &&
                      "text-muted-foreground line-through",
                  )}
                >
                  {todo.title}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {todoStatusLabel[todo.status]}
                </p>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 rounded-2xl border border-dashed border-border/70 px-4 py-8 text-center text-sm text-muted-foreground">
          The owner hasn&apos;t published a roadmap yet.
        </p>
      )}
    </section>
  );
}
