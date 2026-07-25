"use client";

import {
  WORKSPACE_DEADLINES,
} from "@/features/projects/lib/projects-workspace-data";
import { cn } from "@/lib/utils";

const toneDot = {
  orange: "bg-orange-500",
  blue: "bg-sky-500",
  violet: "bg-violet-500",
  green: "bg-emerald-500",
} as const;

export function SidebarDeadlinesWidget() {
  return (
    <section className="rounded-[20px] border border-border/60 bg-card/80 p-4 shadow-[0_12px_36px_-28px_rgba(76,29,149,0.4)] backdrop-blur-xl">
      <h3 className="text-sm font-semibold tracking-tight">Upcoming Deadlines</h3>
      <ul className="mt-3 space-y-3">
        {WORKSPACE_DEADLINES.map((item) => (
          <li key={item.id} className="flex items-start gap-2.5">
            <span
              className={cn(
                "mt-1.5 size-2 shrink-0 rounded-full",
                toneDot[item.tone],
              )}
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium">{item.title}</p>
              <p className="truncate text-[11px] text-muted-foreground">
                {item.project}
              </p>
            </div>
            <span className="shrink-0 text-[11px] text-muted-foreground">
              {item.due}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
