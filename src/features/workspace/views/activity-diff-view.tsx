"use client";

import { useQuery } from "convex/react";
import { FileIcon, HistoryIcon, Loader2Icon } from "lucide-react";
import { useEffect, useMemo } from "react";

import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { WorkspaceDiffEditor } from "@/features/workspace/components/workspace-diff-editor";
import { useEditorTabs } from "@/features/workspace/hooks/use-editor-tabs";
import { countLineDiffStats } from "@/features/workspace/lib/line-diff-stats";
import { filePathToBreadcrumb } from "@/features/workspace/lib/sample-files";
import { useWorkspaceStore } from "@/features/workspace/store/workspace-store";

type ActivityDiffViewProps = {
  projectId: string;
  activityId: string;
  /** When false, skip breadcrumb / current-file chrome updates (split pane). */
  syncWorkspaceChrome?: boolean;
};

function fileNameFromPath(filePath: string) {
  return filePath.split("/").pop() || filePath;
}

export function ActivityDiffView({
  projectId,
  activityId,
  syncWorkspaceChrome = true,
}: ActivityDiffViewProps) {
  const setBreadcrumb = useWorkspaceStore((s) => s.setBreadcrumb);
  const setCurrentFilePath = useWorkspaceStore((s) => s.setCurrentFilePath);
  const { openTab } = useEditorTabs(projectId);

  const snapshot = useQuery(api.workspace.getActivityDiff, {
    activityId: activityId as Id<"projectActivity">,
  });

  // Fill in path/title when the tab was opened from a URL (path unknown yet).
  useEffect(() => {
    if (!snapshot?.path) return;
    const tabId = `activity-diff:${activityId}`;
    useWorkspaceStore.setState((s) => {
      const tab = s.editorTabs.find((t) => t.id === tabId);
      if (!tab || tab.path === snapshot.path) return s;
      return {
        editorTabs: s.editorTabs.map((t) =>
          t.id === tabId
            ? {
                ...t,
                path: snapshot.path,
                title: `${fileNameFromPath(snapshot.path)} (Timeline)`,
              }
            : t,
        ),
      };
    });
  }, [activityId, snapshot?.path]);

  useEffect(() => {
    if (!syncWorkspaceChrome || !snapshot?.path) return;
    setCurrentFilePath(snapshot.path);
    setBreadcrumb([
      ...filePathToBreadcrumb(projectId, snapshot.path),
      { label: "Timeline" },
    ]);
  }, [
    syncWorkspaceChrome,
    projectId,
    snapshot?.path,
    setBreadcrumb,
    setCurrentFilePath,
  ]);

  const { added, removed } = useMemo(() => {
    if (!snapshot) return { added: 0, removed: 0 };
    return countLineDiffStats(snapshot.beforeContent, snapshot.afterContent);
  }, [snapshot]);

  if (snapshot === undefined) {
    return (
      <div className="flex h-full items-center justify-center gap-2 text-[12px] text-ws-text-muted">
        <Loader2Icon className="size-3.5 animate-spin" />
        Loading timeline diff…
      </div>
    );
  }

  if (snapshot === null) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center">
        <HistoryIcon className="size-5 text-ws-text-muted" strokeWidth={1.75} />
        <p className="text-[13px] font-medium text-ws-text">
          Timeline snapshot unavailable
        </p>
        <p className="max-w-sm text-[12px] text-ws-text-muted">
          This activity has no saved before/after content. Newer edits will
          include a diff you can reopen anytime.
        </p>
      </div>
    );
  }

  const filePath = snapshot.path;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex h-9 shrink-0 items-center gap-2 border-b border-ws-border-subtle bg-ws-panel px-3">
        <span className="inline-flex size-5 items-center justify-center rounded-sm bg-violet-500/15 text-[11px] font-semibold text-violet-400">
          T
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[12px] font-medium text-ws-text">
            {fileNameFromPath(filePath)}
          </p>
          <p className="truncate text-[10px] text-ws-text-muted">
            {snapshot.title} · {snapshot.time}
          </p>
        </div>

        <div className="flex items-center gap-2 text-[11px] tabular-nums">
          {added > 0 ? (
            <span className="text-ws-success">+{added}</span>
          ) : null}
          {removed > 0 ? (
            <span className="text-ws-danger-soft">−{removed}</span>
          ) : null}
        </div>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 gap-1.5 rounded-sm px-2 text-[11px] text-ws-text-muted hover:bg-ws-hover hover:text-ws-text"
          onClick={() => openTab({ kind: "file", path: filePath })}
        >
          <FileIcon className="size-3.5" />
          Open file
        </Button>
      </div>

      <div className="flex h-7 shrink-0 items-center border-b border-ws-border-subtle bg-ws-panel/60 text-[10px] font-medium tracking-wide text-ws-text-muted uppercase">
        <div className="flex h-full min-w-0 flex-1 items-center border-r border-ws-border-subtle px-3">
          Before · {snapshot.actorName}
        </div>
        <div className="flex h-full min-w-0 flex-1 items-center px-3">
          After · {snapshot.time}
        </div>
      </div>

      <div className="min-h-0 flex-1">
        <WorkspaceDiffEditor
          filePath={filePath}
          original={snapshot.beforeContent}
          modified={snapshot.afterContent}
        />
      </div>
    </div>
  );
}
