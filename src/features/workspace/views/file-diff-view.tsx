"use client";

import {
  FileIcon,
  Loader2Icon,
  MinusIcon,
  PlusIcon,
  Undo2Icon,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { useConfirm } from "@/components/confirm-dialog";
import { Button } from "@/components/ui/button";
import { useProject } from "@/features/projects/hooks/use-projects";
import { WorkspaceDiffEditor } from "@/features/workspace/components/workspace-diff-editor";
import { useEditorTabs } from "@/features/workspace/hooks/use-editor-tabs";
import {
  useDiscardFileChanges,
  useProjectFile,
  useSetFileStaged,
} from "@/features/workspace/hooks/use-project-files";
import {
  clearFileContentDraft,
  loadFileContentDraft,
  resolveSeedContent,
} from "@/features/workspace/lib/file-content-drafts";
import { countLineDiffStats } from "@/features/workspace/lib/line-diff-stats";
import { filePathToBreadcrumb } from "@/features/workspace/lib/sample-files";
import { useWorkspaceStore } from "@/features/workspace/store/workspace-store";
import type { Id } from "@/convex/_generated/dataModel";
import { cn } from "@/lib/utils";

type FileDiffViewProps = {
  projectId: string;
  filePath: string;
  /** When false, skip breadcrumb / current-file chrome updates (split pane). */
  syncWorkspaceChrome?: boolean;
};

function fileNameFromPath(filePath: string) {
  return filePath.split("/").pop() || filePath;
}

export function FileDiffView({
  projectId,
  filePath,
  syncWorkspaceChrome = true,
}: FileDiffViewProps) {
  const project = useProject({ projectId });
  const file = useProjectFile(projectId, filePath);
  const setBreadcrumb = useWorkspaceStore((s) => s.setBreadcrumb);
  const setCurrentFilePath = useWorkspaceStore((s) => s.setCurrentFilePath);
  const { openTab } = useEditorTabs(projectId);
  const setFileStaged = useSetFileStaged();
  const discardFileChanges = useDiscardFileChanges();
  const confirm = useConfirm();
  const [busy, setBusy] = useState(false);
  const [draftTick, setDraftTick] = useState(0);

  // Re-read drafts when the tab becomes visible again.
  useEffect(() => {
    const onFocus = () => setDraftTick((n) => n + 1);
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  useEffect(() => {
    if (!syncWorkspaceChrome || !filePath) return;
    setCurrentFilePath(filePath);
    setBreadcrumb([
      ...filePathToBreadcrumb(projectId, filePath),
      { label: "Diff" },
    ]);
  }, [
    syncWorkspaceChrome,
    projectId,
    filePath,
    setBreadcrumb,
    setCurrentFilePath,
  ]);

  const original = file?.syncedContent ?? "";
  const serverContent = file?.content ?? "";
  const draft = useMemo(
    () => loadFileContentDraft(projectId, filePath),
    // draftTick forces a refresh after focus / discard.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional
    [projectId, filePath, file?.updatedAt, draftTick],
  );
  const modified = resolveSeedContent(
    serverContent,
    file?.updatedAt,
    draft,
  );

  const isNew =
    file != null &&
    file.syncedContent === undefined &&
    project?.syncedAt != null &&
    file._creationTime > project.syncedAt;
  const isStaged = file?.staged === true;
  const { added, removed } = useMemo(
    () =>
      countLineDiffStats(isNew ? "" : original, modified),
    [isNew, original, modified],
  );
  const hasChanges = original !== modified || isNew;

  const runAction = async (action: () => Promise<unknown>) => {
    setBusy(true);
    try {
      await action();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Action failed");
    } finally {
      setBusy(false);
      setDraftTick((n) => n + 1);
    }
  };

  if (file === undefined || project === undefined) {
    return (
      <div className="flex h-full items-center justify-center gap-2 text-[12px] text-ws-text-muted">
        <Loader2Icon className="size-3.5 animate-spin" />
        Loading diff…
      </div>
    );
  }

  if (file === null) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center">
        <p className="text-[13px] font-medium text-ws-text">File not found</p>
        <p className="max-w-sm text-[12px] text-ws-text-muted">
          “{filePath}” is no longer in this project.
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex h-9 shrink-0 items-center gap-2 border-b border-ws-border-subtle bg-ws-panel px-3">
        <span
          className={cn(
            "inline-flex size-5 items-center justify-center rounded-sm text-[11px] font-semibold",
            isNew
              ? "bg-ws-link/15 text-ws-link"
              : "bg-ws-success/15 text-ws-success",
          )}
          title={isNew ? "Added" : "Modified"}
        >
          {isNew ? "A" : "M"}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[12px] font-medium text-ws-text">
            {fileNameFromPath(filePath)}
          </p>
          <p className="truncate text-[10px] text-ws-text-muted">{filePath}</p>
        </div>

        <div className="flex items-center gap-2 text-[11px] tabular-nums">
          {added > 0 ? (
            <span className="text-ws-success">+{added}</span>
          ) : null}
          {removed > 0 ? (
            <span className="text-ws-danger-soft">−{removed}</span>
          ) : null}
          {!hasChanges ? (
            <span className="text-ws-text-muted">No changes</span>
          ) : null}
        </div>

        <div className="flex items-center gap-1">
          <span
            className={cn(
              "mr-1 hidden rounded-sm px-1.5 py-0.5 text-[10px] font-medium sm:inline",
              isStaged
                ? "bg-ws-link/15 text-ws-link"
                : "bg-ws-hover text-ws-text-muted",
            )}
          >
            {isStaged ? "Staged" : "Unstaged"}
          </span>
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

          {isStaged ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={busy}
              className="h-7 gap-1.5 rounded-sm px-2 text-[11px] text-ws-text-muted hover:bg-ws-hover hover:text-ws-text"
              onClick={() =>
                void runAction(() =>
                  setFileStaged({
                    projectId: projectId as Id<"projects">,
                    path: filePath,
                    staged: false,
                  }),
                )
              }
            >
              {busy ? (
                <Loader2Icon className="size-3.5 animate-spin" />
              ) : (
                <MinusIcon className="size-3.5" />
              )}
              Unstage
            </Button>
          ) : (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={busy || !hasChanges}
              className="h-7 gap-1.5 rounded-sm px-2 text-[11px] text-ws-text-muted hover:bg-ws-hover hover:text-ws-text"
              onClick={() =>
                void runAction(() =>
                  setFileStaged({
                    projectId: projectId as Id<"projects">,
                    path: filePath,
                    staged: true,
                  }),
                )
              }
            >
              {busy ? (
                <Loader2Icon className="size-3.5 animate-spin" />
              ) : (
                <PlusIcon className="size-3.5" />
              )}
              Stage
            </Button>
          )}

          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={busy || !hasChanges}
            className="h-7 gap-1.5 rounded-sm px-2 text-[11px] text-ws-text-muted hover:bg-ws-hover hover:text-ws-danger-soft"
            onClick={() =>
              void runAction(async () => {
                const ok = await confirm({
                  title: "Discard changes?",
                  description: `Changes you made to “${filePath}” will not be saved. This cannot be undone.`,
                  confirmLabel: "Discard",
                  cancelLabel: "Keep editing",
                  tone: "danger",
                });
                if (!ok) return;

                await discardFileChanges({
                  projectId: projectId as Id<"projects">,
                  path: filePath,
                });
                clearFileContentDraft(projectId, filePath);
                toast.success(`Discarded changes to ${filePath}`);
                openTab({ kind: "file", path: filePath });
              })
            }
          >
            <Undo2Icon className="size-3.5" />
            Discard
          </Button>
        </div>
      </div>

      <div className="flex h-7 shrink-0 items-center border-b border-ws-border-subtle bg-ws-panel/60 text-[10px] font-medium tracking-wide text-ws-text-muted uppercase">
        <div className="flex h-full min-w-0 flex-1 items-center border-r border-ws-border-subtle px-3">
          {isNew ? "No baseline (new file)" : "Last synced"}
        </div>
        <div className="flex h-full min-w-0 flex-1 items-center px-3">
          Working tree
        </div>
      </div>

      <div className="min-h-0 flex-1">
        <WorkspaceDiffEditor
          filePath={filePath}
          original={isNew ? "" : original}
          modified={modified}
        />
      </div>
    </div>
  );
}
