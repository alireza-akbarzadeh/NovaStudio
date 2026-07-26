"use client";

import { useEffect } from "react";

import { handleWorkspaceKeydown } from "@/features/workspace/commands/registry";
import { useFileDirtyStore } from "@/features/workspace/lib/file-save-controller";

/** Single window-level listener for IDE workspace shortcuts. */
export function useWorkspaceShortcuts(enabled = true) {
  useEffect(() => {
    if (!enabled) return;

    const onKeyDown = (event: KeyboardEvent) => {
      handleWorkspaceKeydown(event);
    };

    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      const dirty = useFileDirtyStore.getState().dirty;
      if (Object.keys(dirty).length === 0) return;
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("beforeunload", onBeforeUnload);
    };
  }, [enabled]);
}
