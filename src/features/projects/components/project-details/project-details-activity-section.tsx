"use client";

import {
  Loader2Icon,
  RocketIcon,
  SparklesIcon,
  UserPlusIcon,
} from "lucide-react";

import { useCommunityProjectActivity } from "@/features/projects/hooks/use-project-details";
import type { ProjectCommunityActivity } from "@/features/projects/lib/project-details-types";
import { cn } from "@/lib/utils";

const typeMeta = {
  released: {
    icon: RocketIcon,
    tone: "bg-fuchsia-500/15 text-fuchsia-600 dark:text-fuchsia-400",
  },
  sponsored: {
    icon: SparklesIcon,
    tone: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  },
  joined: {
    icon: UserPlusIcon,
    tone: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  },
  contributor: {
    icon: UserPlusIcon,
    tone: "bg-sky-500/15 text-sky-600 dark:text-sky-400",
  },
} as const;

type ProjectDetailsActivitySectionProps = {
  projectId: string;
};

function ActivityRow({
  item,
  isLast,
}: {
  item: ProjectCommunityActivity;
  isLast: boolean;
}) {
  const meta = typeMeta[item.type];
  const Icon = meta.icon;

  return (
    <li className="relative flex gap-3 pb-5 last:pb-0">
      {!isLast ? (
        <span
          aria-hidden
          className="absolute top-8 bottom-0 left-[15px] w-px bg-border/80"
        />
      ) : null}
      <span
        className={cn(
          "relative z-10 inline-flex size-8 shrink-0 items-center justify-center rounded-full",
          meta.tone,
        )}
      >
        <Icon className="size-3.5" />
      </span>
      <div className="min-w-0 flex-1 pt-0.5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-medium tracking-tight">{item.title}</p>
            {item.detail ? (
              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                {item.detail}
              </p>
            ) : null}
          </div>
          <span
            className="inline-flex size-7 shrink-0 items-center justify-center rounded-full text-[9px] font-semibold text-white"
            style={{ backgroundColor: item.avatar.color }}
            title={item.avatar.name}
          >
            {item.avatar.initials}
          </span>
        </div>
        <p className="mt-1 text-[11px] text-muted-foreground">{item.time}</p>
      </div>
    </li>
  );
}

export function ProjectDetailsActivitySection({
  projectId,
}: ProjectDetailsActivitySectionProps) {
  const activity = useCommunityProjectActivity(projectId);

  return (
    <section className="rounded-[24px] border border-border/60 bg-card/85 p-6">
      <h2 className="text-lg font-semibold tracking-tight">Activity</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Shipped items, sponsors, and new contributors.
      </p>

      {activity === undefined ? (
        <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2Icon className="size-4 animate-spin" />
          Loading activity…
        </div>
      ) : activity.length === 0 ? (
        <p className="mt-4 rounded-2xl border border-dashed border-border/70 px-4 py-8 text-center text-sm text-muted-foreground">
          No public activity yet. Ship a roadmap item, welcome a contributor, or
          receive a sponsor to see updates here.
        </p>
      ) : (
        <ul className="mt-4">
          {activity.map((item, index) => (
            <ActivityRow
              key={item.id}
              item={item}
              isLast={index === activity.length - 1}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
