"use client";

import { Loader2Icon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { CodeEditor } from "@/features/workspace/components/code-editor";
import {
  MergeConflictResolveButtons,
} from "@/features/workspace/components/workspace-merge-conflicts-panel";
import { useEditorTabs } from "@/features/workspace/hooks/use-editor-tabs";
import {
  useMergeConflicts,
  useResolveMergeConflict,
} from "@/features/workspace/hooks/use-merge-conflicts";
import { filePathToBreadcrumb } from "@/features/workspace/lib/sample-files";
import { useWorkspaceStore } from "@/features/workspace/store/workspace-store";
import type { Id } from "@/convex/_generated/dataModel";
import { cn } from "@/lib/utils";

type MergeConflictViewProps = {
  projectId: string;
  filePath: string;
  conflictId: string;
  syncWorkspaceChrome?: boolean;
};

function fileNameFromPath(filePath: string) {
  return filePath.split("/").filter(Boolean).pop() || filePath;
}

export function MergeConflictView({
  projectId,
  filePath,
  conflictId,
  syncWorkspaceChrome = true,
}: MergeConflictViewProps) {
  const conflicts = useMergeConflicts(projectId);
  const resolveConflict = useResolveMergeConflict(projectId);
  const { closeTab } = useEditorTabs(projectId);
  const setBreadcrumb = useWorkspaceStore((s) => s.setBreadcrumb);
  const setCurrentFilePath = useWorkspaceStore((s) => s.setCurrentFilePath);
  const [busy, setBusy] = useState(false);

  const conflict = useMemo(
    () => conflicts?.find((row) => row.id === conflictId),
    [conflicts, conflictId],
  );

  useEffect(() => {
    if (!syncWorkspaceChrome || !filePath) return;
    setCurrentFilePath(filePath);
    setBreadcrumb([
      ...filePathToBreadcrumb(projectId, filePath),
      { label: "Merge conflict" },
    ]);
  }, [
    filePath,
    projectId,
    setBreadcrumb,
    setCurrentFilePath,
    syncWorkspaceChrome,
  ]);

  useEffect(() => {
    if (conflicts && !conflict) {
      closeTab(`merge-conflict:${conflictId}`);
    }
  }, [closeTab, conflict, conflictId, conflicts]);

  const onResolve = async (resolution: "local" | "remote" | "both") => {
    setBusy(true);
    try {
      await resolveConflict(
        conflictId as Id<"projectMergeConflicts">,
        resolution,
      );
      closeTab(`merge-conflict:${conflictId}`);
    } finally {
      setBusy(false);
    }
  };

  if (conflicts === undefined) {
    return (
      <div className="flex h-full items-center justify-center text-[13px] text-ws-text-muted">
        <Loader2Icon className="mr-2 size-4 animate-spin" />
        Loading conflict…
      </div>
    );
  }

  if (!conflict) {
    return (
      <div className="flex h-full items-center justify-center p-6 text-[13px] text-ws-text-muted">
        This conflict was already resolved.
      </div>
    );
  }

  const resolvedPath = conflict.path || filePath;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-ws-border-subtle px-4 py-3">
        <div className="min-w-0">
          <p className="truncate text-[13px] font-medium text-ws-text">
            {fileNameFromPath(resolvedPath)}
          </p>
          <p className="truncate font-mono text-[10px] text-ws-text-muted">
            {resolvedPath}
          </p>
        </div>
        <MergeConflictResolveButtons busy={busy} onResolve={onResolve} />
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-3">
        <MergePane label="Base (last sync)" content={conflict.base} filePath={resolvedPath} />
        <MergePane
          label="Yours (local)"
          content={conflict.local}
          filePath={resolvedPath}
          highlight
        />
        <MergePane
          label="Theirs (GitHub)"
          content={conflict.remote}
          filePath={resolvedPath}
          highlight
        />
      </div>
    </div>
  );
}

function MergePane({
  label,
  content,
  filePath,
  highlight = false,
}: {
  label: string;
  content: string;
  filePath: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex min-h-0 min-w-0 flex-col border-b border-ws-border-subtle lg:border-b-0 lg:border-r",
        highlight && "bg-ws-stage/30",
      )}
    >
      <div className="shrink-0 border-b border-ws-border-subtle px-3 py-2 text-[10px] font-medium tracking-wide text-ws-text-muted uppercase">
        {label}
      </div>
      <div className="polaris-monaco min-h-0 flex-1">
        <CodeEditor filePath={filePath} value={content} readOnly />
      </div>
    </div>
  );
}
