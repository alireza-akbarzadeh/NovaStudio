"use client";

import {
  GitMergeIcon,
  MessageSquareIcon,
  RocketIcon,
  UserPlusIcon,
  RefreshCwIcon,
} from "lucide-react";

import type { WorkspaceActivity } from "@/features/projects/lib/projects-workspace-types";
import { cn } from "@/lib/utils";

const typeMeta = {
  updated: { icon: RefreshCwIcon, tone: "bg-violet-500/15 text-violet-600" },
  contributor: { icon: UserPlusIcon, tone: "bg-sky-500/15 text-sky-600" },
  merged: { icon: GitMergeIcon, tone: "bg-emerald-500/15 text-emerald-600" },
  comment: {
    icon: MessageSquareIcon,
    tone: "bg-orange-500/15 text-orange-600",
  },
  released: { icon: RocketIcon, tone: "bg-fuchsia-500/15 text-fuchsia-600" },
  joined: { icon: UserPlusIcon, tone: "bg-emerald-500/15 text-emerald-600" },
} as const;

type ActivityFeedItemProps = {
  item: WorkspaceActivity;
  isLast?: boolean;
};

export function ActivityFeedItem({ item, isLast }: ActivityFeedItemProps) {
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
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              {item.detail}
            </p>
          </div>
          <span
            className="inline-flex size-7 shrink-0 items-center justify-center rounded-full text-[9px] font-semibold text-white"
            style={{ backgroundColor: item.avatar.color }}
            title={item.avatar.initials}
          >
            {item.avatar.initials}
          </span>
        </div>
        <p className="mt-1 text-[11px] text-muted-foreground">{item.time}</p>
      </div>
    </li>
  );
}
