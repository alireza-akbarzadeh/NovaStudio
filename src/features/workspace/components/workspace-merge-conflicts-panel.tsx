"use client";

import {
  AlertTriangleIcon,
  ArrowRightIcon,
  CheckIcon,
  FileIcon,
  GitMergeIcon,
  Loader2Icon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { useEditorTabs } from "@/features/workspace/hooks/use-editor-tabs";
import { useMergeConflicts } from "@/features/workspace/hooks/use-merge-conflicts";
import { cn } from "@/lib/utils";

type WorkspaceMergeConflictsPanelProps = {
  projectId: string;
};

function fileNameFromPath(path: string) {
  return path.split("/").filter(Boolean).pop() || path;
}

export function WorkspaceMergeConflictsPanel({
  projectId,
}: WorkspaceMergeConflictsPanelProps) {
  const conflicts = useMergeConflicts(projectId);
  const { openTab } = useEditorTabs(projectId);

  if (conflicts === undefined) {
    return (
      <div className="flex items-center gap-2 px-3 py-3 text-[11px] text-ws-text-muted">
        <Loader2Icon className="size-3.5 animate-spin" />
        Loading conflicts…
      </div>
    );
  }

  if (conflicts.length === 0) {
    return null;
  }

  return (
    <div className="border-b border-ws-border-subtle bg-amber-500/5">
      <div className="flex items-center gap-2 border-b border-amber-500/20 px-3 py-2">
        <AlertTriangleIcon className="size-3.5 shrink-0 text-amber-500" />
        <span className="text-[11px] font-medium text-amber-600 dark:text-amber-400">
          {conflicts.length} merge conflict{conflicts.length === 1 ? "" : "s"}
        </span>
      </div>
      <ul className="max-h-48 overflow-auto py-1">
        {conflicts.map((conflict) => (
          <li key={conflict.id}>
            <button
              type="button"
              onClick={() =>
                openTab({
                  kind: "merge-conflict",
                  path: conflict.path,
                  conflictId: conflict.id,
                })
              }
              className={cn(
                "flex w-full items-center gap-2 px-3 py-2 text-left text-[11px]",
                "transition-colors hover:bg-ws-hover/60",
              )}
            >
              <FileIcon className="size-3.5 shrink-0 text-ws-text-muted" />
              <span className="min-w-0 flex-1 truncate font-mono text-ws-text">
                {fileNameFromPath(conflict.path)}
              </span>
              <span className="hidden truncate text-ws-text-muted sm:inline">
                {conflict.path.includes("/")
                  ? conflict.path.slice(0, conflict.path.lastIndexOf("/"))
                  : ""}
              </span>
              <ArrowRightIcon className="size-3 shrink-0 text-ws-text-muted" />
            </button>
          </li>
        ))}
      </ul>
      <p className="border-t border-amber-500/15 px-3 py-2 text-[10px] leading-relaxed text-ws-text-muted">
        Open a file to compare Base · Yours · Theirs and choose how to resolve.
      </p>
    </div>
  );
}

export function MergeConflictsBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-medium text-amber-600 dark:text-amber-400">
      <GitMergeIcon className="size-3" />
      {count}
    </span>
  );
}

export function MergeConflictResolveButtons({
  busy,
  onResolve,
}: {
  busy?: boolean;
  onResolve: (resolution: "local" | "remote" | "both") => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        type="button"
        size="sm"
        disabled={busy}
        onClick={() => onResolve("local")}
        className="h-7 bg-ws-accent text-[11px] text-white hover:bg-ws-accent-hover"
      >
        {busy ? (
          <Loader2Icon className="size-3 animate-spin" />
        ) : (
          <CheckIcon className="size-3" />
        )}
        Accept yours
      </Button>
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={busy}
        onClick={() => onResolve("remote")}
        className="h-7 border-ws-border bg-ws-panel text-[11px] text-ws-text hover:bg-ws-hover"
      >
        Accept theirs
      </Button>
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={busy}
        onClick={() => onResolve("both")}
        className="h-7 border-ws-border bg-ws-panel text-[11px] text-ws-text hover:bg-ws-hover"
      >
        Accept both
      </Button>
    </div>
  );
}
