"use client";

import { useMutation } from "convex/react";
import { useEffect, useMemo } from "react";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useWorkspaceNotifications } from "@/features/projects/hooks/use-workspace";
import { useWorkspaceStore } from "@/features/workspace/store/workspace-store";

export type NotificationKind = "chat" | "comment" | "deploy" | "general";

/**
 * Unread notification counts for activity-bar badges (same source as the bell).
 * Opening chat / comments marks that kind as read for the current project.
 */
export function useNotificationKindBadges(projectId?: string | null) {
  const notifications = useWorkspaceNotifications(50);
  const chatPanelOpen = useWorkspaceStore((s) => s.chatPanelOpen);
  const commentsPanelOpen = useWorkspaceStore((s) => s.commentsPanelOpen);
  const markByKind = useMutation(api.workspaceActions.markNotificationsReadByKind);

  const counts = useMemo(() => {
    const unread = (notifications ?? []).filter((item) => !item.read);
    const forProject = (kind: NotificationKind) =>
      unread.filter((item) => {
        if (item.kind !== kind) return false;
        if (!projectId) return true;
        return !item.projectId || item.projectId === projectId;
      }).length;

    return {
      chat: forProject("chat"),
      comment: forProject("comment"),
      deploy: forProject("deploy"),
      all: unread.length,
    };
  }, [notifications, projectId]);

  useEffect(() => {
    if (!chatPanelOpen || !projectId) return;
    void markByKind({
      kind: "chat",
      projectId: projectId as Id<"projects">,
    });
  }, [chatPanelOpen, markByKind, projectId]);

  useEffect(() => {
    if (!commentsPanelOpen || !projectId) return;
    void markByKind({
      kind: "comment",
      projectId: projectId as Id<"projects">,
    });
  }, [commentsPanelOpen, markByKind, projectId]);

  return counts;
}
