"use client";

import { useEffect, useRef } from "react";

import { useWorkspaceStore } from "@/features/workspace/store/workspace-store";

/**
 * Collapse heavy sidebar UI when switching panels/tabs or leaving a project
 * so file trees, change lists, and editors do not all stay expanded/mounted.
 */
export function useWorkspacePanelCleanup(projectId: string) {
  const leftPanelView = useWorkspaceStore((s) => s.leftPanelView);
  const explorerTab = useWorkspaceStore((s) => s.explorerTab);
  const collapseFileTree = useWorkspaceStore((s) => s.collapseFileTree);
  const closeUnmodifiedEditorTabs = useWorkspaceStore(
    (s) => s.closeUnmodifiedEditorTabs,
  );

  const prevLeftPanel = useRef(leftPanelView);
  const prevExplorerTab = useRef(explorerTab);

  useEffect(() => {
    if (prevLeftPanel.current === leftPanelView) {
      return;
    }
    prevLeftPanel.current = leftPanelView;

    if (leftPanelView !== "explorer" || explorerTab !== "project") {
      collapseFileTree(projectId);
    }
  }, [collapseFileTree, explorerTab, leftPanelView, projectId]);

  useEffect(() => {
    if (prevExplorerTab.current === explorerTab) {
      return;
    }
    prevExplorerTab.current = explorerTab;

    if (explorerTab !== "project") {
      collapseFileTree(projectId);
    }
  }, [collapseFileTree, explorerTab, projectId]);

  useEffect(() => {
    return () => {
      collapseFileTree(projectId);
      closeUnmodifiedEditorTabs();
    };
  }, [closeUnmodifiedEditorTabs, collapseFileTree, projectId]);
}
