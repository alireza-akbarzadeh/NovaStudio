"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";

import { playSoundIfEnabled } from "@/features/notifications/lib/play-sound";
import type { NotificationSoundKind } from "@/features/notifications/lib/sound-pack";
import { useWorkspaceNotifications } from "@/features/projects/hooks/use-workspace";

function isExternalHref(href: string) {
  return /^https?:\/\//i.test(href);
}

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

      const action =
        item.href && isExternalHref(item.href)
          ? {
              label: "Open",
              onClick: () =>
                window.open(item.href, "_blank", "noopener,noreferrer"),
            }
          : item.href
            ? {
                label: "Open",
                onClick: () => {
                  window.location.assign(item.href!);
                },
              }
            : undefined;

      if (kind === "success") {
        toast.success(item.title, {
          description: item.body,
          action,
        });
      } else if (kind === "error") {
        toast.error(item.title, {
          description: item.body,
          action,
        });
      } else if (kind === "warning") {
        toast.warning(item.title, {
          description: item.body,
          action,
        });
      } else {
        toast(item.title, {
          description: item.body,
          action,
        });
      }
    }
  }, [notifications]);
}
