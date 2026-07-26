/**
 * Registry of open collaborative editors for manual Save / Save All,
 * plus reactive dirty-path tracking for tab badges.
 */
"use client";

import { create } from "zustand";
import { toast } from "sonner";

import { useEditorSettingsStore } from "@/features/settings/store/editor-settings-store";
import { useWorkspaceStore } from "@/features/workspace/store/workspace-store";

export type FileSaveHandler = {
  projectId: string;
  path: string;
  /** Persist current buffer to Convex immediately (awaits mutation). */
  flush: () => Promise<boolean>;
  /** Format via Monaco/Prettier when supported; returns true if content changed. */
  format?: () => Promise<boolean>;
};

function handlerKey(projectId: string, path: string) {
  return `${projectId}:${path}`;
}

const handlers = new Map<string, FileSaveHandler>();

type DirtyState = {
  /** Keys are `projectId:path`. */
  dirty: Record<string, true>;
  setDirty: (projectId: string, path: string, dirty: boolean) => void;
  isDirty: (projectId: string, path: string) => boolean;
  clearProject: (projectId: string) => void;
};

export const useFileDirtyStore = create<DirtyState>((set, get) => ({
  dirty: {},
  setDirty: (projectId, path, dirty) => {
    const key = handlerKey(projectId, path);
    set((s) => {
      if (dirty) {
        if (s.dirty[key]) return s;
        return { dirty: { ...s.dirty, [key]: true } };
      }
      if (!s.dirty[key]) return s;
      const next = { ...s.dirty };
      delete next[key];
      return { dirty: next };
    });
  },
  isDirty: (projectId, path) =>
    Boolean(get().dirty[handlerKey(projectId, path)]),
  clearProject: (projectId) =>
    set((s) => {
      const prefix = `${projectId}:`;
      const next: Record<string, true> = {};
      for (const [key, value] of Object.entries(s.dirty)) {
        if (!key.startsWith(prefix)) next[key] = value;
      }
      return { dirty: next };
    }),
}));

export function registerFileSaveHandler(handler: FileSaveHandler) {
  handlers.set(handlerKey(handler.projectId, handler.path), handler);
  return () => {
    const key = handlerKey(handler.projectId, handler.path);
    const current = handlers.get(key);
    if (current === handler) handlers.delete(key);
  };
}

export function markFileDirty(
  projectId: string,
  path: string,
  dirty: boolean,
) {
  useFileDirtyStore.getState().setDirty(projectId, path, dirty);
}

async function saveHandler(
  handler: FileSaveHandler,
  options: { format: boolean },
): Promise<boolean> {
  if (options.format && handler.format) {
    try {
      await handler.format();
      // Let Monaco/Yjs apply format edits before we read the buffer.
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => resolve());
      });
    } catch (error) {
      console.warn("[save] format failed", error);
    }
  }
  return handler.flush();
}

/** Save the active editor tab file (⌘S / Ctrl+S). */
export async function saveActiveFile(): Promise<boolean> {
  const { currentFilePath, editorTabsProjectId } = useWorkspaceStore.getState();
  if (!editorTabsProjectId || !currentFilePath) {
    toast.message("Open a file to save");
    return false;
  }

  const handler = handlers.get(
    handlerKey(editorTabsProjectId, currentFilePath),
  );
  if (!handler) {
    toast.message("Editor is not ready");
    return false;
  }

  const { formatOnSave } = useEditorSettingsStore.getState();
  const ok = await saveHandler(handler, { format: formatOnSave });
  if (ok) {
    toast.success("Saved", { duration: 1400 });
  } else {
    toast.error("Could not save file");
  }
  return ok;
}

/** Save every open file that has a registered handler (⌘⇧S / Ctrl+⇧S). */
export async function saveAllFiles(): Promise<number> {
  const { editorTabsProjectId } = useWorkspaceStore.getState();
  if (!editorTabsProjectId) {
    toast.message("No project open");
    return 0;
  }

  const { formatOnSaveAll } = useEditorSettingsStore.getState();
  const queue = [...handlers.values()].filter(
    (h) => h.projectId === editorTabsProjectId,
  );

  if (queue.length === 0) {
    toast.message("Nothing to save");
    return 0;
  }

  let saved = 0;
  let failed = 0;
  const seen = new Set<string>();

  for (const handler of queue) {
    const key = handlerKey(handler.projectId, handler.path);
    if (seen.has(key)) continue;
    seen.add(key);
    try {
      const ok = await saveHandler(handler, { format: formatOnSaveAll });
      if (ok) saved += 1;
      else failed += 1;
    } catch {
      failed += 1;
    }
  }

  if (saved === 0 && failed === 0) {
    toast.message("Nothing to save");
    return 0;
  }
  if (failed > 0) {
    toast.error(`Saved ${saved}, failed ${failed}`);
  } else {
    toast.success(`Saved ${saved} file${saved === 1 ? "" : "s"}`, {
      duration: 1600,
    });
  }
  return saved;
}
