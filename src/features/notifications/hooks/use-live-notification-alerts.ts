"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";

import { playSoundIfEnabled } from "@/features/notifications/lib/play-sound";
import type { NotificationSoundKind } from "@/features/notifications/lib/sound-pack";
import { useWorkspaceNotifications } from "@/features/projects/hooks/use-workspace";

/**
 * Plays a sound and shows a toast when a new Convex notification arrives.
 */
export function useLiveNotificationAlerts() {
  const notifications = useWorkspaceNotifications(20);
  const seenIds = useRef<Set<string> | null>(null);

  useEffect(() => {
    if (!notifications) return;

    if (seenIds.current === null) {
      seenIds.current = new Set(notifications.map((item) => item.id));
      return;
    }

    for (const item of notifications) {
      if (seenIds.current.has(item.id)) continue;
      seenIds.current.add(item.id);

      const kind = (item.soundKind ?? "notify") as NotificationSoundKind;
      void playSoundIfEnabled(kind);

      if (kind === "success") {
        toast.success(item.title);
      } else if (kind === "error") {
        toast.error(item.title);
      } else if (kind === "warning") {
        toast.warning(item.title);
      }
    }
  }, [notifications]);
}
