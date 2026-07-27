"use client";

import {
  ArchiveIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  Loader2Icon,
  RotateCcwIcon,
  Trash2Icon,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { useConfirm } from "@/components/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import { WorkspaceDiffEditor } from "@/features/workspace/components/workspace-diff-editor";
import {
  useApplyProjectStash,
  useChangedFiles,
  useCreateProjectStash,
  useProjectFile,
  useProjectStashes,
  useRemoveProjectStash,
} from "@/features/workspace/hooks/use-project-files";
import {
  clearFileContentDraft,
  loadFileContentDraft,
  resolveSeedContent,
} from "@/features/workspace/lib/file-content-drafts";
import { countLineDiffStats } from "@/features/workspace/lib/line-diff-stats";
import { cn } from "@/lib/utils";

type WorkspaceStashPanelProps = {
  projectId: string;
};

type StashDoc = Doc<"projectStashes">;
type StashFile = StashDoc["files"][number];

type SelectedStashFile = {
  stashId: string;
  path: string;
  stashContent: string;
};

function formatCreatedAt(value: number) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function fileBaseName(path: string) {
  return path.split("/").filter(Boolean).pop() || path;
}

function resolveCurrentFileContent(
  projectId: string,
  path: string,
  file: Doc<"projectFiles"> | null | undefined,
) {
  if (file === undefined) return undefined;
  if (file === null) return "";
  const draft = loadFileContentDraft(projectId, path);
  return resolveSeedContent(file.content ?? "", file.updatedAt, draft);
}

function StashFileDiffStats({
  projectId,
  path,
  stashContent,
}: {
  projectId: string;
  path: string;
  stashContent: string;
}) {
  const file = useProjectFile(projectId, path);
  const current = resolveCurrentFileContent(projectId, path, file);

  if (current === undefined) {
    return <Loader2Icon className="size-3 animate-spin text-ws-text-muted" />;
  }

  const { added, removed } = countLineDiffStats(current, stashContent);
  if (added === 0 && removed === 0) {
    return <span className="text-[10px] text-ws-text-muted">no diff</span>;
  }

  return (
    <span className="inline-flex items-center gap-1.5 text-[10px] tabular-nums">
      {added > 0 ? (
        <span className="text-emerald-500/90">+{added}</span>
      ) : null}
      {removed > 0 ? (
        <span className="text-rose-500/90">−{removed}</span>
      ) : null}
    </span>
  );
}

function StashFileDiffPreview({
  projectId,
  path,
  stashContent,
}: {
  projectId: string;
  path: string;
  stashContent: string;
}) {
  const file = useProjectFile(projectId, path);
  const current = resolveCurrentFileContent(projectId, path, file);

  if (current === undefined) {
    return (
      <div className="flex items-center gap-2 px-3 py-4 text-[11px] text-ws-text-muted">
        <Loader2Icon className="size-3.5 animate-spin" />
        Loading diff…
      </div>
    );
  }

  return (
    <div className="mt-2 overflow-hidden rounded-md border border-ws-border-subtle">
      <div className="flex items-center justify-between border-b border-ws-border-subtle bg-ws-panel px-2.5 py-1.5 text-[10px] text-ws-text-muted">
        <span className="truncate font-medium text-ws-text">{path}</span>
        <span>Current → Stash</span>
      </div>
      <div className="h-56 min-h-0">
        <WorkspaceDiffEditor
          filePath={path}
          original={current}
          modified={stashContent}
        />
      </div>
    </div>
  );
}

export function WorkspaceStashPanel({ projectId }: WorkspaceStashPanelProps) {
  const stashes = useProjectStashes(projectId);
  const changedFiles = useChangedFiles(projectId);
  const createStash = useCreateProjectStash();
  const applyStash = useApplyProjectStash();
  const removeStash = useRemoveProjectStash();
  const confirm = useConfirm();

  const [name, setName] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [expandedStashId, setExpandedStashId] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<SelectedStashFile | null>(
    null,
  );

  const { totalChanges, stagedChanges } = useMemo(() => {
    const total = changedFiles?.length ?? 0;
    const staged = changedFiles?.filter((file) => file.staged).length ?? 0;
    return { totalChanges: total, stagedChanges: staged };
  }, [changedFiles]);

  const create = async (onlyStaged: boolean) => {
    const pathsToStash =
      changedFiles
        ?.filter((file) => (onlyStaged ? file.staged : true))
        .map((file) => file.path) ?? [];

    if (pathsToStash.length === 0) return;

    setCreating(true);
    try {
      await createStash({
        projectId: projectId as Id<"projects">,
        name: name.trim() || undefined,
        onlyStaged,
      });
      for (const path of pathsToStash) {
        clearFileContentDraft(projectId, path);
      }
      setName("");
      toast.success(
        onlyStaged ? "Stashed staged changes" : "Stashed working changes",
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to stash");
    } finally {
      setCreating(false);
    }
  };

  const onApply = async (stashId: string, deleteAfterApply: boolean) => {
    setBusyId(stashId);
    try {
      await applyStash({
        projectId: projectId as Id<"projects">,
        stashId: stashId as Id<"projectStashes">,
        deleteAfterApply,
      });
      if (expandedStashId === stashId) {
        setExpandedStashId(null);
        setSelectedFile(null);
      }
      toast.success(deleteAfterApply ? "Stash restored" : "Stash applied (kept)");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Apply failed");
    } finally {
      setBusyId(null);
    }
  };

  const onDelete = async (stashId: string, stashName: string) => {
    const ok = await confirm({
      title: "Delete stash?",
      description: `This removes “${stashName}” permanently.`,
      confirmLabel: "Delete",
      cancelLabel: "Cancel",
      tone: "danger",
    });
    if (!ok) return;

    setBusyId(stashId);
    try {
      await removeStash({
        projectId: projectId as Id<"projects">,
        stashId: stashId as Id<"projectStashes">,
      });
      if (expandedStashId === stashId) {
        setExpandedStashId(null);
        setSelectedFile(null);
      }
      toast.success("Stash deleted");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Delete failed");
    } finally {
      setBusyId(null);
    }
  };

  const toggleExpanded = (stash: StashDoc) => {
    if (expandedStashId === stash._id) {
      setExpandedStashId(null);
      setSelectedFile(null);
      return;
    }
    setExpandedStashId(stash._id);
    const first = stash.files[0];
    if (first) {
      setSelectedFile({
        stashId: stash._id,
        path: first.path,
        stashContent: first.content,
      });
    } else {
      setSelectedFile(null);
    }
  };

  const selectFile = (stashId: string, file: StashFile) => {
    setSelectedFile({
      stashId,
      path: file.path,
      stashContent: file.content,
    });
  };

  if (stashes === undefined || changedFiles === undefined) {
    return (
      <div className="flex items-center gap-2 px-3 py-4 text-[11px] text-ws-text-muted">
        <Loader2Icon className="size-3.5 animate-spin" />
        Loading stashes…
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="space-y-2 border-b border-ws-border-subtle bg-ws-panel p-2.5">
        <div className="rounded-md border border-ws-border-subtle bg-ws-bg/80 p-2.5">
          <p className="text-[11px] font-medium text-ws-text">Stash changes</p>
          <p className="mt-1 text-[10px] text-ws-text-muted">
            {totalChanges} changed · {stagedChanges} staged
          </p>
          <Input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Optional stash name"
            className="mt-2 h-7 border-ws-border bg-ws-bg text-[11px]"
          />
          <div className="mt-2 flex gap-1.5">
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={creating || totalChanges === 0}
              onClick={() => void create(false)}
              className="h-7 border-ws-border bg-ws-bg px-2 text-[11px] hover:bg-ws-hover"
            >
              {creating ? (
                <Loader2Icon className="size-3 animate-spin" />
              ) : (
                <ArchiveIcon className="size-3" />
              )}
              Stash all
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={creating || stagedChanges === 0}
              onClick={() => void create(true)}
              className="h-7 bg-ws-accent px-2 text-[11px] text-white hover:bg-ws-accent-hover"
            >
              Stash staged
            </Button>
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto p-2.5">
        {stashes.length === 0 ? (
          <div className="rounded-md border border-dashed border-ws-border-subtle bg-ws-bg/50 p-4 text-center">
            <p className="text-[12px] font-medium text-ws-text">No stashes yet</p>
            <p className="mt-1 text-[11px] text-ws-text-muted">
              Save your in-progress edits here, preview diffs, then restore when
              ready.
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {stashes.map((stash) => {
              const busy = busyId === stash._id;
              const expanded = expandedStashId === stash._id;
              return (
                <li
                  key={stash._id}
                  className="rounded-md border border-ws-border-subtle bg-ws-bg/70 p-2.5"
                >
                  <div className="flex items-start gap-2">
                    <button
                      type="button"
                      onClick={() => toggleExpanded(stash)}
                      className="mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-sm text-ws-text-muted hover:bg-ws-hover hover:text-ws-text"
                      aria-label={expanded ? "Collapse stash" : "Expand stash"}
                    >
                      {expanded ? (
                        <ChevronDownIcon className="size-3.5" />
                      ) : (
                        <ChevronRightIcon className="size-3.5" />
                      )}
                    </button>
                    <div className="min-w-0 flex-1">
                      <button
                        type="button"
                        onClick={() => toggleExpanded(stash)}
                        className="w-full text-left"
                      >
                        <p className="truncate text-[12px] font-medium text-ws-text">
                          {stash.name}
                        </p>
                        <p className="mt-0.5 text-[10px] text-ws-text-muted">
                          {stash.fileCount} files ·{" "}
                          {formatCreatedAt(stash.createdAt)}
                        </p>
                      </button>
                    </div>
                    {busy ? (
                      <Loader2Icon className="mt-0.5 size-3.5 animate-spin text-ws-text-muted" />
                    ) : (
                      <div className="flex flex-wrap items-center justify-end gap-1">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          title="Apply and keep stash"
                          className="h-6 rounded-sm border-ws-border px-2 text-[10px] hover:bg-ws-hover"
                          onClick={() => void onApply(stash._id, false)}
                        >
                          Apply & keep
                        </Button>
                        <Button
                          type="button"
                          size="icon-sm"
                          variant="ghost"
                          title="Apply stash"
                          className="size-6 rounded-sm text-ws-text-muted hover:bg-ws-hover hover:text-ws-text"
                          onClick={() => void onApply(stash._id, true)}
                        >
                          <RotateCcwIcon className="size-3.5" />
                        </Button>
                        <Button
                          type="button"
                          size="icon-sm"
                          variant="ghost"
                          title="Delete stash"
                          className="size-6 rounded-sm text-ws-text-muted hover:bg-ws-hover hover:text-ws-danger-soft"
                          onClick={() => void onDelete(stash._id, stash.name)}
                        >
                          <Trash2Icon className="size-3.5" />
                        </Button>
                      </div>
                    )}
                  </div>

                  {expanded ? (
                    <div className="mt-2 space-y-1 border-t border-ws-border-subtle pt-2 pl-7">
                      {stash.files.map((file) => {
                        const isSelected =
                          selectedFile?.stashId === stash._id &&
                          selectedFile.path === file.path;
                        return (
                          <button
                            key={file.path}
                            type="button"
                            onClick={() => selectFile(stash._id, file)}
                            className={cn(
                              "flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left transition-colors",
                              isSelected
                                ? "bg-ws-accent/15 text-ws-text"
                                : "text-ws-text-secondary hover:bg-ws-hover hover:text-ws-text",
                            )}
                          >
                            <span className="min-w-0 flex-1 truncate text-[11px]">
                              {fileBaseName(file.path)}
                            </span>
                            <span className="hidden shrink-0 text-[10px] text-ws-text-muted sm:inline">
                              {file.path.includes("/")
                                ? file.path.slice(0, file.path.lastIndexOf("/"))
                                : "root"}
                            </span>
                            <StashFileDiffStats
                              projectId={projectId}
                              path={file.path}
                              stashContent={file.content}
                            />
                          </button>
                        );
                      })}

                      {selectedFile?.stashId === stash._id ? (
                        <StashFileDiffPreview
                          projectId={projectId}
                          path={selectedFile.path}
                          stashContent={selectedFile.stashContent}
                        />
                      ) : null}
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
