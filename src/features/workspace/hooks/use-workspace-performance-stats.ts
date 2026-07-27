"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useOptionalWebContainer } from "@/features/workspace/components/webcontainer-provider";
import type { ProjectFileRow } from "@/features/workspace/hooks/use-project-files";
import {
  useProjectFileMetadata,
  useProjectFiles,
  useProjectFilesContentsLoading,
} from "@/features/workspace/hooks/use-project-files";
import { getMemoryDraftStats } from "@/features/workspace/lib/file-content-drafts";
import { useWorkspaceStore } from "@/features/workspace/store/workspace-store";

export type PerformanceHistoryPoint = {
  label: string;
  timestamp: number;
  heapMb: number;
  contentMb: number;
  draftsMb: number;
  tabs: number;
};

const MAX_HISTORY_POINTS = 60;

type JsHeapSnapshot = {
  usedBytes: number;
  totalBytes: number;
  limitBytes: number;
};

function readJsHeapSnapshot(): JsHeapSnapshot | null {
  const memory = (
    performance as Performance & {
      memory?: {
        usedJSHeapSize: number;
        totalJSHeapSize: number;
        jsHeapSizeLimit: number;
      };
    }
  ).memory;

  if (!memory) return null;

  return {
    usedBytes: memory.usedJSHeapSize,
    totalBytes: memory.totalJSHeapSize,
    limitBytes: memory.jsHeapSizeLimit,
  };
}

function formatSampleTime(date: Date) {
  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function sumContentBytes(files: ProjectFileRow[] | undefined) {
  if (!files) return 0;

  let bytes = 0;
  for (const row of files) {
    if (row.kind === "file" && row.content != null) {
      bytes += row.content.length * 2;
    }
  }
  return bytes;
}

export function useWorkspacePerformanceStats(
  projectId: string,
  options?: { pollMs?: number; enabled?: boolean; refreshNonce?: number },
) {
  const pollMs = options?.pollMs ?? 2000;
  const enabled = options?.enabled ?? true;
  const refreshNonce = options?.refreshNonce ?? 0;

  const metadata = useProjectFileMetadata(projectId);
  const files = useProjectFiles(projectId);
  const contentsLoading = useProjectFilesContentsLoading(projectId);
  const webcontainer = useOptionalWebContainer();

  const editorTabs = useWorkspaceStore((s) =>
    s.editorTabsProjectId === projectId ? s.editorTabs : [],
  );
  const activeEditorTabId = useWorkspaceStore((s) => s.activeEditorTabId);
  const terminalOpen = useWorkspaceStore((s) => s.terminalOpen);
  const leftPanelView = useWorkspaceStore((s) => s.leftPanelView);
  const editorPanelView = useWorkspaceStore((s) => s.editorPanelView);

  const [jsHeap, setJsHeap] = useState<JsHeapSnapshot | null>(() =>
    readJsHeapSnapshot(),
  );
  const [draftStats, setDraftStats] = useState(() =>
    getMemoryDraftStats(projectId),
  );
  const [history, setHistory] = useState<PerformanceHistoryPoint[]>([]);

  const filesRef = useRef(files);
  const editorTabsRef = useRef(editorTabs);
  filesRef.current = files;
  editorTabsRef.current = editorTabs;

  useEffect(() => {
    setHistory([]);
  }, [projectId]);

  const pushHistorySample = useCallback(() => {
    const heap = readJsHeapSnapshot();
    const drafts = getMemoryDraftStats(projectId);
    const contentBytes = sumContentBytes(filesRef.current);
    const now = new Date();

    const point: PerformanceHistoryPoint = {
      label: formatSampleTime(now),
      timestamp: now.getTime(),
      heapMb: (heap?.usedBytes ?? 0) / (1024 * 1024),
      contentMb: contentBytes / (1024 * 1024),
      draftsMb: drafts.bytes / (1024 * 1024),
      tabs: editorTabsRef.current.length,
    };

    setHistory((prev) => [...prev, point].slice(-MAX_HISTORY_POINTS));
  }, [projectId]);

  useEffect(() => {
    if (!enabled) return;

    const refreshVolatile = () => {
      setJsHeap(readJsHeapSnapshot());
      setDraftStats(getMemoryDraftStats(projectId));
      pushHistorySample();
    };

    refreshVolatile();
    const id = window.setInterval(refreshVolatile, pollMs);
    return () => window.clearInterval(id);
  }, [enabled, pollMs, projectId, pushHistorySample, refreshNonce]);

  const treeStats = useMemo(() => {
    if (!metadata) return null;

    let fileCount = 0;
    let folderCount = 0;
    for (const row of metadata) {
      if (row.kind === "file") fileCount++;
      else folderCount++;
    }

    return {
      total: metadata.length,
      fileCount,
      folderCount,
    };
  }, [metadata]);

  const contentStats = useMemo(() => {
    if (!files) return null;

    let bytes = 0;
    let loadedFiles = 0;
    let fileCount = 0;

    for (const row of files) {
      if (row.kind !== "file") continue;
      fileCount++;
      if (row.content == null) continue;
      loadedFiles++;
      bytes += row.content.length * 2;
    }

    return { bytes, loadedFiles, fileCount };
  }, [files]);

  const editorStats = useMemo(() => {
    const fileTabs = editorTabs.filter((tab) => tab.kind === "file");
    const previewTabs = editorTabs.filter((tab) => tab.preview);
    const pinnedTabs = editorTabs.filter((tab) => tab.pinned);
    const activeTab = editorTabs.find((tab) => tab.id === activeEditorTabId);

    return {
      openTabs: editorTabs.length,
      fileTabs: fileTabs.length,
      previewTabs: previewTabs.length,
      pinnedTabs: pinnedTabs.length,
      activeTabTitle: activeTab?.title ?? null,
      activeTabKind: activeTab?.kind ?? null,
    };
  }, [activeEditorTabId, editorTabs]);

  return {
    treeStats,
    contentStats,
    contentsLoading,
    filesLoaded: files !== undefined,
    editorStats,
    terminalOpen,
    leftPanelView,
    editorPanelView,
    webcontainer: {
      status: webcontainer?.status ?? "idle",
      ready: webcontainer?.ready ?? false,
      needsInstall: webcontainer?.needsInstall ?? false,
      installAttempted: webcontainer?.installAttempted ?? false,
      error: webcontainer?.error ?? null,
    },
    draftStats,
    jsHeap,
    history,
    updatedAt: Date.now(),
  };
}
