"use client";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { playSoundIfEnabled } from "@/features/notifications/lib/play-sound";
import { useMutation } from "convex/react";
import { useEffect, useRef } from "react";

type ChatStatus = "submitted" | "streaming" | "ready" | "error";

type UseAiDoneSoundArgs = {
  status: ChatStatus;
  projectId?: string;
  /** Notify Convex + push when the tab is hidden. */
  pushWhenHidden?: boolean;
};

/**
 * Plays a pleasant chime when an AI response finishes.
 * Optionally creates a Convex notification + push while the tab is backgrounded.
 */
export function useAiDoneSound({
  status,
  projectId,
  pushWhenHidden = true,
}: UseAiDoneSoundArgs) {
  const prev = useRef<ChatStatus>(status);
  const notifyAi = useMutation(api.pushSubscriptions.notifyAiJobDone);

  useEffect(() => {
    const wasBusy = prev.current === "streaming" || prev.current === "submitted";
    const isDone = status === "ready";
    prev.current = status;

    if (!wasBusy || !isDone) return;

    void playSoundIfEnabled("aiDone");

    if (pushWhenHidden && typeof document !== "undefined" && document.hidden) {
      void notifyAi({
        projectId: projectId as Id<"projects"> | undefined,
        title: "AI finished working",
      });
    }
  }, [notifyAi, projectId, pushWhenHidden, status]);
}
