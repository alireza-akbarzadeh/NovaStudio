"use client";

import { useAuth, useUser } from "@clerk/nextjs";
import usePresence from "@convex-dev/presence/react";
import { useQuery } from "convex/react";
import { useEffect, useMemo, useRef } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import { useEditorTabs } from "@/features/workspace/hooks/use-editor-tabs";
import { useWorkspaceFocusList } from "@/features/workspace/hooks/use-workspace-focus-sync";
import { useWorkspaceStore } from "@/features/workspace/store/workspace-store";
import { cn } from "@/lib/utils";

type ProjectPresenceAvatarsProps = {
  projectId: string;
};

type MemberInfo = Pick<
  Doc<"projectMembers">,
  "userId" | "name" | "imageUrl" | "color"
>;

type FocusInfo = {
  openFile: string | null;
  view: "code" | "preview" | "other";
  previewPath: string | null;
  terminalCwd: string | null;
  updatedAt?: number;
};

function formatFocus(focus: FocusInfo | undefined): string {
  if (!focus) return "Online";
  const parts: string[] = [];
  if (focus.openFile) {
    const name = focus.openFile.split("/").pop() ?? focus.openFile;
    parts.push(name);
    if (focus.view === "preview") {
      parts.push(`Preview ${focus.previewPath || "/"}`);
    }
  } else if (focus.view === "preview") {
    parts.push(`Preview ${focus.previewPath || "/"}`);
  }
  if (focus.terminalCwd && focus.terminalCwd !== "/") {
    parts.push(`cwd ${focus.terminalCwd}`);
  }
  return parts.length > 0 ? parts.join(" · ") : "Online";
}

export function ProjectPresenceAvatars({
  projectId,
}: ProjectPresenceAvatarsProps) {
  const { userId } = useAuth();
  const { user } = useUser();
  const members = useQuery(api.sharing.listMembers, {
    projectId: projectId as Id<"projects">,
  });
  const focusList = useWorkspaceFocusList(projectId);
  const { openTab } = useEditorTabs(projectId);
  const followingUserId = useWorkspaceStore((s) => s.followingUserId);
  const setFollowingUserId = useWorkspaceStore((s) => s.setFollowingUserId);
  const setEditorPanelView = useWorkspaceStore((s) => s.setEditorPanelView);
  const setPreviewUrlPath = useWorkspaceStore((s) => s.setPreviewUrlPath);
  const requestTerminalCwd = useWorkspaceStore((s) => s.requestTerminalCwd);
  const setBottomPanelTab = useWorkspaceStore((s) => s.setBottomPanelTab);

  const presenceUserId = userId ?? "anonymous";
  const presenceState = usePresence(api.presence, projectId, presenceUserId);
  const lastAppliedAtRef = useRef(0);

  const memberById = useMemo(() => {
    const map = new Map<string, MemberInfo>();
    for (const member of members ?? []) {
      map.set(member.userId, member);
    }
    return map;
  }, [members]);

  const focusById = useMemo(() => {
    const map = new Map<string, FocusInfo>();
    for (const row of focusList ?? []) {
      map.set(row.userId, row);
    }
    return map;
  }, [focusList]);

  const applyFocus = (focus: FocusInfo | undefined) => {
    if (!focus) return;
    if (focus.openFile) {
      openTab({ kind: "file", path: focus.openFile }, { mode: "preview" });
    }
    if (focus.view === "code" || focus.view === "preview") {
      setEditorPanelView(focus.view);
    }
    if (focus.previewPath) {
      setPreviewUrlPath(focus.previewPath);
    }
    if (focus.terminalCwd) {
      requestTerminalCwd(focus.terminalCwd);
      setBottomPanelTab("terminal");
    }
  };

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
          focus: focusById.get(entry.userId),
        };
      })
      .sort((a, b) => Number(b.isSelf) - Number(a.isSelf));
  }, [focusById, memberById, presenceState, user, userId]);

  // Sticky follow — re-apply when the followed user's focus changes.
  useEffect(() => {
    if (!followingUserId) return;
    const focus = focusById.get(followingUserId);
    if (!focus?.updatedAt || focus.updatedAt <= lastAppliedAtRef.current) {
      return;
    }
    lastAppliedAtRef.current = focus.updatedAt;
    applyFocus(focus);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- applyFocus is stable enough via store setters
  }, [focusById, followingUserId]);

  const followUser = (targetUserId: string, focus: FocusInfo | undefined) => {
    if (targetUserId === userId) return;
    if (followingUserId === targetUserId) {
      setFollowingUserId(null);
      return;
    }
    setFollowingUserId(targetUserId);
    if (focus?.updatedAt) lastAppliedAtRef.current = focus.updatedAt;
    applyFocus(focus);
  };

  if (online.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center -space-x-1.5 pr-1">
      {online.slice(0, 6).map((person) => (
        <Tooltip key={person.userId}>
          <TooltipTrigger asChild>
            <button
              type="button"
              className="relative inline-flex rounded-full"
              style={{ boxShadow: `0 0 0 2px ${person.color}` }}
              onClick={() => {
                if (person.isSelf) return;
                followUser(person.userId, person.focus);
              }}
              title={
                person.isSelf
                  ? undefined
                  : followingUserId === person.userId
                    ? "Stop following"
                    : "Follow"
              }
            >
              <Avatar
                size="sm"
                className={cn(
                  "size-6 border border-ws-panel",
                  person.isSelf && "ring-1 ring-ws-accent",
                  followingUserId === person.userId &&
                    "ring-2 ring-ws-accent ring-offset-1 ring-offset-ws-bg",
                )}
              >
                {person.imageUrl ? (
                  <AvatarImage src={person.imageUrl} alt="" />
                ) : null}
                <AvatarFallback
                  className="text-[9px] text-white"
                  style={{ backgroundColor: person.color }}
                >
                  {person.name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </button>
          </TooltipTrigger>
          <TooltipContent
            side="bottom"
            className="max-w-56 border border-ws-border-strong bg-ws-hover px-2 py-1.5 text-ws-text"
          >
            <div className="flex flex-col gap-0.5">
              <span className="text-xs font-medium">
                {person.name}
                {person.isSelf ? " (you)" : ""}
                {!person.isSelf && followingUserId === person.userId
                  ? " · Following"
                  : ""}
              </span>
              <span className="text-[10px] text-ws-text-muted">
                {formatFocus(person.focus)}
              </span>
              {!person.isSelf ? (
                <span className="text-[10px] text-ws-text-muted">
                  Click to{" "}
                  {followingUserId === person.userId ? "unfollow" : "follow"}
                </span>
              ) : null}
            </div>
          </TooltipContent>
        </Tooltip>
      ))}
      {online.length > 6 ? (
        <span className="z-10 rounded-full bg-ws-hover px-1.5 py-0.5 text-[10px] text-ws-text-muted">
          +{online.length - 6}
        </span>
      ) : null}
    </div>
  );
}
