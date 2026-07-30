"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef } from "react";

import {
  createEditorTab,
  editorTabFromPathname,
  editorTabHref,
  type EditorTabInput,
} from "@/features/workspace/lib/editor-tabs";
import {
  useWorkspaceStore,
  type EditorTab,
  type EditorTabOpenMode,
} from "@/features/workspace/store/workspace-store";

export type OpenTabOptions = {
  /** Default: permanent. Only `file` tabs can open as preview. */
  mode?: Exclude<EditorTabOpenMode, "preserve">;
};

/** Keeps open editor tabs in sync with the current workspace URL. */
export function useEditorTabsSync(projectId: string) {
  const pathname = usePathname();
  const syncEditorTabFromRoute = useWorkspaceStore(
    (s) => s.syncEditorTabFromRoute,
  );

  useEffect(() => {
    const tab = editorTabFromPathname(projectId, pathname);
    if (!tab) return;

    // Welcome is optional — don't force it back open after the user closes it.
    if (tab.kind === "welcome") {
      const { editorTabs, editorTabsProjectId } =
        useWorkspaceStore.getState();
      const switchedProject = editorTabsProjectId !== projectId;
      const welcomeStillOpen = editorTabs.some((t) => t.kind === "welcome");

      // New project context → open Welcome once.
      // Same project with Welcome closed → leave tab bar alone (empty is OK).
      if (!switchedProject && !welcomeStillOpen) return;
    }

    syncEditorTabFromRoute(projectId, tab, { mode: "preserve" });
  }, [projectId, pathname, syncEditorTabFromRoute]);
}

/** Open / select / close VS Code-style editor tabs inside a project. */
export function useEditorTabs(projectId: string) {
  const router = useRouter();
  const editorTabs = useWorkspaceStore((s) => s.editorTabs);
  const activeEditorTabId = useWorkspaceStore((s) => s.activeEditorTabId);
  const editorSplitTabId = useWorkspaceStore((s) => s.editorSplitTabId);
  const activateEditorTab = useWorkspaceStore((s) => s.activateEditorTab);
  const closeEditorTab = useWorkspaceStore((s) => s.closeEditorTab);
  const closeAllEditorTabs = useWorkspaceStore((s) => s.closeAllEditorTabs);
  const closeUnmodifiedEditorTabs = useWorkspaceStore(
    (s) => s.closeUnmodifiedEditorTabs,
  );
  const bookmarkOpenEditorTabs = useWorkspaceStore(
    (s) => s.bookmarkOpenEditorTabs,
  );
  const reorderEditorTabs = useWorkspaceStore((s) => s.reorderEditorTabs);
  const pinEditorTab = useWorkspaceStore((s) => s.pinEditorTab);
  const unpinEditorTab = useWorkspaceStore((s) => s.unpinEditorTab);
  const promotePreviewTab = useWorkspaceStore((s) => s.promotePreviewTab);
  const openEditorSplit = useWorkspaceStore((s) => s.openEditorSplit);
  const closeEditorSplit = useWorkspaceStore((s) => s.closeEditorSplit);
  const syncEditorTabFromRoute = useWorkspaceStore(
    (s) => s.syncEditorTabFromRoute,
  );

  const openTab = useCallback(
    (input: EditorTabInput, options?: OpenTabOptions) => {
      const tab = createEditorTab(input);
      const mode =
        input.kind === "file" ? (options?.mode ?? "permanent") : "permanent";
      syncEditorTabFromRoute(projectId, tab, { mode });
      router.push(editorTabHref(projectId, tab));
    },
    [projectId, router, syncEditorTabFromRoute],
  );

  const selectTab = useCallback(
    (id: string) => {
      const tab = editorTabs.find((t) => t.id === id);
      if (!tab) return;
      activateEditorTab(id);
      router.push(editorTabHref(projectId, tab));
    },
    [activateEditorTab, editorTabs, projectId, router],
  );

  const closeTab = useCallback(
    (id: string) => {
      const wasActive = activeEditorTabId === id;
      const nextActive = closeEditorTab(id);

      if (!wasActive) return;

      if (nextActive) {
        router.push(editorTabHref(projectId, nextActive));
        return;
      }

      // Last tab closed — leave an empty editor. Do not force Welcome back open.
    },
    [activeEditorTabId, closeEditorTab, projectId, router],
  );

  const navigateAfterBulkClose = useCallback(
    (nextActive: EditorTab | null) => {
      if (nextActive) {
        router.push(editorTabHref(projectId, nextActive));
      }
    },
    [projectId, router],
  );

  const closeAllTabs = useCallback(() => {
    closeAllEditorTabs();
  }, [closeAllEditorTabs]);

  const closeUnmodifiedTabs = useCallback(() => {
    const nextActive = closeUnmodifiedEditorTabs();
    navigateAfterBulkClose(nextActive);
  }, [closeUnmodifiedEditorTabs, navigateAfterBulkClose]);

  const bookmarkOpenTabs = useCallback(() => {
    bookmarkOpenEditorTabs();
  }, [bookmarkOpenEditorTabs]);

  const reorderTab = useCallback(
    (fromId: string, toId: string) => {
      reorderEditorTabs(fromId, toId);
    },
    [reorderEditorTabs],
  );

  const splitTab = useCallback(
    (id: string) => {
      openEditorSplit(id);
    },
    [openEditorSplit],
  );

  const pinTab = useCallback(
    (id: string) => {
      pinEditorTab(id);
    },
    [pinEditorTab],
  );

  const unpinTab = useCallback(
    (id: string) => {
      unpinEditorTab(id);
    },
    [unpinEditorTab],
  );

  const keepOpen = useCallback(
    (id: string) => {
      promotePreviewTab(id);
    },
    [promotePreviewTab],
  );

  return {
    tabs: editorTabs,
    activeTabId: activeEditorTabId,
    splitTabId: editorSplitTabId,
    openTab,
    selectTab,
    closeTab,
    closeAllTabs,
    closeUnmodifiedTabs,
    bookmarkOpenTabs,
    reorderTab,
    splitTab,
    pinTab,
    unpinTab,
    keepOpen,
    closeSplit: closeEditorSplit,
  };
}

/** Handles ⌘N / Ctrl+N → open New Project editor tab. */
export function useNewProjectTabShortcut(projectId: string) {
  const request = useWorkspaceStore((s) => s.newProjectRequest);
  const { openTab } = useEditorTabs(projectId);
  const lastHandled = useRef(0);

  useEffect(() => {
    if (request === 0 || request === lastHandled.current) return;
    lastHandled.current = request;
    openTab({ kind: "new-project" });
  }, [request, openTab]);
}

/** Handles ⌘⇧J → open User JSON settings editor tab. */
export function useUserJsonTabShortcut(projectId: string) {
  const request = useWorkspaceStore((s) => s.userJsonRequest);
  const { openTab } = useEditorTabs(projectId);
  const lastHandled = useRef(0);

  useEffect(() => {
    if (request === 0 || request === lastHandled.current) return;
    lastHandled.current = request;
    openTab({ kind: "user-json" });
  }, [request, openTab]);
}

/** Handles ⌘⇧C → open Customize editor tab. */
export function useCustomizeTabShortcut(projectId: string) {
  const request = useWorkspaceStore((s) => s.customizeRequest);
  const { openTab } = useEditorTabs(projectId);
  const lastHandled = useRef(0);

  useEffect(() => {
    if (request === 0 || request === lastHandled.current) return;
    lastHandled.current = request;
    openTab({ kind: "customize" });
  }, [request, openTab]);
}
