"use client";

import { useAuth, useUser } from "@clerk/nextjs";
import usePresence from "@convex-dev/presence/react";
import { useQuery } from "convex/react";
import {
  ActivityIcon,
  GitMergeIcon,
  MessageSquareIcon,
  RefreshCwIcon,
  RocketIcon,
  UserPlusIcon,
} from "lucide-react";
import { useMemo } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import { useEditorTabs } from "@/features/workspace/hooks/use-editor-tabs";
import { useWorkspaceStore } from "@/features/workspace/store/workspace-store";
import { cn } from "@/lib/utils";

type WorkspaceActivityPanelProps = {
  projectId: string;
};

type MemberInfo = Pick<
  Doc<"projectMembers">,
  "userId" | "name" | "imageUrl" | "color"
>;

const TYPE_DOT: Record<
  "updated" | "contributor" | "merged" | "comment" | "released" | "joined",
  string
> = {
  updated: "bg-violet-500",
  contributor: "bg-sky-500",
  merged: "bg-emerald-500",
  comment: "bg-orange-500",
  released: "bg-fuchsia-500",
  joined: "bg-teal-500",
};

const TYPE_ICON = {
  updated: RefreshCwIcon,
  contributor: UserPlusIcon,
  merged: GitMergeIcon,
  comment: MessageSquareIcon,
  released: RocketIcon,
  joined: UserPlusIcon,
} as const;

export function WorkspaceActivityPanel({
  projectId,
}: WorkspaceActivityPanelProps) {
  const { userId } = useAuth();
  const { user } = useUser();
  const currentFilePath = useWorkspaceStore((s) => s.currentFilePath);
  const { openTab } = useEditorTabs(projectId);

  const activity = useQuery(api.workspace.listProjectActivity, {
    projectId: projectId as Id<"projects">,
    limit: 50,
  });
  const members = useQuery(api.sharing.listMembers, {
    projectId: projectId as Id<"projects">,
  });
  const presenceState = usePresence(
    api.presence,
    projectId,
    userId ?? "anonymous",
  );

  const memberById = useMemo(() => {
    const map = new Map<string, MemberInfo>();
    for (const member of members ?? []) {
      map.set(member.userId, member);
    }
    return map;
  }, [members]);

  const online = useMemo(() => {
    if (!presenceState) return [];
    return presenceState
      .filter((entry) => entry.online)
      .map((entry) => {
        const member = memberById.get(entry.userId);
        const isSelf = entry.userId === userId;
        return {
          userId: entry.userId,
          name:
            member?.name ??
            (isSelf
              ? user?.fullName ||
                user?.primaryEmailAddress?.emailAddress ||
                "You"
              : entry.userId),
          imageUrl: member?.imageUrl ?? (isSelf ? user?.imageUrl : undefined),
          color: member?.color ?? "#90A4AE",
          isSelf,
        };
      })
      .sort((a, b) => Number(b.isSelf) - Number(a.isSelf));
  }, [memberById, presenceState, user, userId]);

  const openActivityItem = (item: {
    id: string;
    type: string;
    detail?: string;
    hasDiff: boolean;
  }) => {
    if (item.hasDiff && item.detail) {
      openTab({
        kind: "activity-diff",
        path: item.detail,
        activityId: item.id,
      });
      return;
    }
    if (item.type === "updated" && item.detail) {
      // Older events without a snapshot — open working-tree diff as fallback.
      openTab({ kind: "diff", path: item.detail });
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
        {activity === undefined ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <div
                key={index}
                className="h-10 animate-pulse rounded-lg bg-ws-hover/60"
              />
            ))}
          </div>
        ) : activity.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-2 py-10 text-center">
            <ActivityIcon
              className="size-5 text-ws-text-muted"
              strokeWidth={1.75}
            />
            <p className="text-xs text-ws-text-muted">
              No activity yet. Edits and team events will show up here live.
            </p>
          </div>
        ) : (
          <ul className="relative space-y-0">
            {activity.map((item, index) => {
              const Icon = TYPE_ICON[item.type];
              const isLast = index === activity.length - 1;
              const isCurrentFile =
                currentFilePath != null && item.detail === currentFilePath;
              const clickable =
                item.hasDiff || (item.type === "updated" && Boolean(item.detail));

              return (
                <li key={item.id} className="relative flex gap-3 pb-4 last:pb-0">
                  {!isLast ? (
                    <span
                      aria-hidden
                      className="absolute top-4 bottom-0 left-[7px] w-px bg-ws-border-subtle"
                    />
                  ) : null}
                  <span
                    className={cn(
                      "relative z-10 mt-1.5 size-2 shrink-0 rounded-full ring-2 ring-ws-panel",
                      TYPE_DOT[item.type],
                    )}
                    title={item.type}
                  />
                  <div className="min-w-0 flex-1">
                    <button
                      type="button"
                      disabled={!clickable}
                      onClick={() => openActivityItem(item)}
                      className={cn(
                        "w-full rounded-md text-left transition-colors",
                        clickable
                          ? "-mx-1.5 px-1.5 py-0.5 hover:bg-ws-hover/80 focus-visible:bg-ws-hover/80 focus-visible:outline-none"
                          : "cursor-default",
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p
                          className={cn(
                            "text-[12px] leading-snug text-ws-text",
                            isCurrentFile && "font-medium",
                            clickable && "group-hover:underline",
                          )}
                        >
                          {item.title}
                        </p>
                        <span className="shrink-0 text-[10px] tabular-nums text-ws-text-muted">
                          {item.time}
                        </span>
                      </div>
                      {item.detail ? (
                        <p className="mt-0.5 truncate text-[10px] text-ws-text-muted">
                          {item.detail}
                          {item.hasDiff ? " · view diff" : ""}
                        </p>
                      ) : null}
                    </button>
                    <div className="mt-1.5 flex items-center gap-1.5">
                      <span
                        className="inline-flex size-4 items-center justify-center rounded-full text-[8px] font-semibold text-white"
                        style={{ backgroundColor: item.avatar.color }}
                        title={item.avatar.name}
                      >
                        {item.avatar.initials}
                      </span>
                      <Icon
                        className="size-3 text-ws-text-muted"
                        strokeWidth={1.75}
                      />
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="shrink-0 border-t border-ws-border-subtle p-3">
        <div className="flex items-center gap-2 rounded-lg border border-ws-border-subtle bg-ws-hover/40 px-2.5 py-2">
          <span className="relative flex size-2 shrink-0">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-60" />
            <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-medium text-ws-text">Session live</p>
            <p className="text-[10px] text-ws-text-muted">
              {online.length === 1
                ? "1 collaborator"
                : `${online.length} collaborators`}
            </p>
          </div>
          <div className="flex items-center -space-x-1.5">
            {online.slice(0, 4).map((person) => (
              <span
                key={person.userId}
                className="relative inline-flex rounded-full"
                style={{ boxShadow: `0 0 0 1.5px ${person.color}` }}
              >
                <Avatar size="sm" className="size-5 border border-ws-panel">
                  {person.imageUrl ? (
                    <AvatarImage src={person.imageUrl} alt="" />
                  ) : null}
                  <AvatarFallback
                    className="text-[7px] text-white"
                    style={{ backgroundColor: person.color }}
                  >
                    {person.name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
