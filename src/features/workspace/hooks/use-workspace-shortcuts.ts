"use client";

import { useEffect, useRef } from "react";

import { handleWorkspaceKeydown } from "@/features/workspace/commands/registry";
import { useFileDirtyStore } from "@/features/workspace/lib/file-save-controller";
import { useWorkspaceStore } from "@/features/workspace/store/workspace-store";

const DOUBLE_SHIFT_MS = 450;

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  if (target.isContentEditable) return true;
  return Boolean(target.closest("[contenteditable='true']"));
}

/** Single window-level listener for IDE workspace shortcuts. */
export function useWorkspaceShortcuts(enabled = true) {
  const lastShiftAtRef = useRef(0);

  useEffect(() => {
    if (!enabled) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (
        event.key === "Shift" &&
        !event.repeat &&
        !event.metaKey &&
        !event.ctrlKey &&
        !event.altKey &&
        !isEditableTarget(event.target)
      ) {
        const now = Date.now();
        if (now - lastShiftAtRef.current < DOUBLE_SHIFT_MS) {
          event.preventDefault();
          lastShiftAtRef.current = 0;
          const store = useWorkspaceStore.getState();
          store.closeCommandPalette();
          store.openGoToFile();
          return;
        }
        lastShiftAtRef.current = now;
      }

      handleWorkspaceKeydown(event);
    };

    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      const dirty = useFileDirtyStore.getState().dirty;
      if (Object.keys(dirty).length === 0) return;
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("keydown", onKeyDown, { capture: true });
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => {
      window.removeEventListener("keydown", onKeyDown, { capture: true });
      window.removeEventListener("beforeunload", onBeforeUnload);
    };
  }, [enabled]);
}
