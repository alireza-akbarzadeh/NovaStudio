"use client";

import { useMutation, useQuery } from "convex/react";
import { useEffect, useRef } from "react";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useWorkspaceStore } from "@/features/workspace/store/workspace-store";

const PUBLISH_DEBOUNCE_MS = 800;

/**
 * Publishes the local user's workspace focus (file / preview / cwd) so
 * teammates can Follow. Also applies follow targets when they change.
 */
export function useWorkspaceFocusSync(projectId: string) {
  const upsert = useMutation(api.workspaceFocus.upsertMyFocus);
  const currentFilePath = useWorkspaceStore((s) => s.currentFilePath);
  const editorPanelView = useWorkspaceStore((s) => s.editorPanelView);
  const previewUrlPath = useWorkspaceStore((s) => s.previewUrlPath);
  const terminalCwd = useWorkspaceStore((s) => s.terminalCwd);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      void upsert({
        projectId: projectId as Id<"projects">,
        openFile: currentFilePath,
        view: editorPanelView,
        previewPath: previewUrlPath || "/",
        terminalCwd,
      });
    }, PUBLISH_DEBOUNCE_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [
    currentFilePath,
    editorPanelView,
    previewUrlPath,
    projectId,
    terminalCwd,
    upsert,
  ]);
}

export function useWorkspaceFocusList(projectId: string) {
  return useQuery(api.workspaceFocus.listByProject, {
    projectId: projectId as Id<"projects">,
  });
}
