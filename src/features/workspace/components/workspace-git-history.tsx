"use client";

import { useAction } from "convex/react";
import {
  ExternalLinkIcon,
  GitCommitHorizontalIcon,
  Loader2Icon,
  RefreshCwIcon,
  RotateCcwIcon,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { useConfirm } from "@/components/confirm-dialog";
import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { parseConvexErrorMessage } from "@/features/github/lib/github-errors";
import { WorkspaceDiffEditor } from "@/features/workspace/components/workspace-diff-editor";
import {
  useProjectFile,
  useUpdateProjectFileContent,
} from "@/features/workspace/hooks/use-project-files";
import {
  loadFileContentDraft,
  resolveSeedContent,
  saveFileContentDraft,
} from "@/features/workspace/lib/file-content-drafts";
import { countLineDiffStats } from "@/features/workspace/lib/line-diff-stats";
import { cn } from "@/lib/utils";

type CommitItem = {
  sha: string;
  shortSha: string;
  message: string;
  authorName: string;
  authorDate: string;
  url: string;
};

type WorkspaceGitHistoryProps = {
  projectId: string;
  enabled: boolean;
  filePath?: string | null;
};

function formatCommitDate(iso: string) {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function fileNameFromPath(path: string) {
  return path.split("/").filter(Boolean).pop() ?? path;
}

function resolveCurrentFileContent(
  projectId: string,
  path: string,
  file: ReturnType<typeof useProjectFile>,
) {
  if (file === undefined) return undefined;
  if (file === null) return "";
  const draft = loadFileContentDraft(projectId, path);
  return resolveSeedContent(file.content ?? "", file.updatedAt, draft);
}

function HistoryCommitDiffPreview({
  projectId,
  path,
  commitSha,
  commitContent,
}: {
  projectId: string;
  path: string;
  commitSha: string;
  commitContent: string;
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

  const { added, removed } = countLineDiffStats(current, commitContent);

  return (
    <div className="shrink-0 border-t border-ws-border-subtle bg-ws-panel">
      <div className="flex items-center justify-between gap-2 border-b border-ws-border-subtle px-2.5 py-1.5">
        <div className="min-w-0">
          <p className="truncate text-[10px] font-medium text-ws-text">
            {path}
          </p>
          <p className="text-[10px] text-ws-text-muted">
            Current →{" "}
            <span className="font-mono text-ws-link">{commitSha.slice(0, 7)}</span>
            {added > 0 || removed > 0 ? (
              <span className="ml-2 tabular-nums">
                {added > 0 ? (
                  <span className="text-emerald-500/90">+{added}</span>
                ) : null}
                {removed > 0 ? (
                  <span className="ml-1 text-rose-500/90">−{removed}</span>
                ) : null}
              </span>
            ) : (
              <span className="ml-2 text-ws-text-muted">no changes</span>
            )}
          </p>
        </div>
        <span className="shrink-0 text-[10px] text-ws-text-muted">At commit</span>
      </div>
      <div className="h-48 min-h-0">
        <WorkspaceDiffEditor
          filePath={path}
          original={current}
          modified={commitContent}
        />
      </div>
    </div>
  );
}

export function WorkspaceGitHistory({
  projectId,
  enabled,
  filePath = null,
}: WorkspaceGitHistoryProps) {
  const listCommits = useAction(api.githubHistory.listCommits);
  const listFileCommits = useAction(api.githubHistory.listFileCommits);
  const getFileAtCommit = useAction(api.githubHistory.getFileAtCommit);
  const updateContent = useUpdateProjectFileContent();
  const confirm = useConfirm();

  const [scope, setScope] = useState<"repo" | "file">("repo");
  const [commits, setCommits] = useState<CommitItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSha, setSelectedSha] = useState<string | null>(null);
  const [commitContent, setCommitContent] = useState<string | null>(null);
  const [contentLoading, setContentLoading] = useState(false);
  const [restoring, setRestoring] = useState(false);

  const effectiveScope =
    scope === "file" && filePath ? ("file" as const) : ("repo" as const);
  const canPreviewFile = effectiveScope === "file" && Boolean(filePath);

  useEffect(() => {
    if (!filePath && scope === "file") {
      setScope("repo");
    }
  }, [filePath, scope]);

  useEffect(() => {
    setSelectedSha(null);
    setCommitContent(null);
  }, [filePath, effectiveScope]);

  const load = useCallback(async () => {
    if (!enabled) return;
    setIsLoading(true);
    setError(null);
    try {
      const result =
        effectiveScope === "file" && filePath
          ? await listFileCommits({
              projectId: projectId as Id<"projects">,
              path: filePath,
              limit: 40,
            })
          : await listCommits({
              projectId: projectId as Id<"projects">,
              limit: 40,
            });
      setCommits(result);
    } catch (err) {
      setCommits(null);
      setError(parseConvexErrorMessage(err, "Failed to load commit history"));
    } finally {
      setIsLoading(false);
    }
  }, [
    enabled,
    effectiveScope,
    filePath,
    listCommits,
    listFileCommits,
    projectId,
  ]);

  useEffect(() => {
    if (!enabled) return;
    load().catch(console.error);
  }, [enabled, load]);

  const loadCommitContent = useCallback(
    async (sha: string) => {
      if (!canPreviewFile || !filePath) return;

      if (selectedSha === sha && commitContent !== null) {
        setSelectedSha(null);
        setCommitContent(null);
        return;
      }

      setSelectedSha(sha);
      setCommitContent(null);
      setContentLoading(true);

      try {
        const result = await getFileAtCommit({
          projectId: projectId as Id<"projects">,
          path: filePath,
          sha,
        });

        if (!result.exists) {
          setCommitContent("");
          toast.message("File did not exist at this commit", {
            description: `${fileNameFromPath(filePath)} · ${result.shortSha}`,
          });
          return;
        }

        setCommitContent(result.content);
      } catch (err) {
        setSelectedSha(null);
        toast.error("Could not load file at commit", {
          description: parseConvexErrorMessage(err, "GitHub request failed"),
        });
      } finally {
        setContentLoading(false);
      }
    },
    [
      canPreviewFile,
      commitContent,
      filePath,
      getFileAtCommit,
      projectId,
      selectedSha,
    ],
  );

  const restoreAtCommit = async () => {
    if (!filePath || !selectedSha || commitContent === null) return;

    const ok = await confirm({
      title: "Restore file at commit?",
      description: `Replace your working copy of ${fileNameFromPath(filePath)} with the version from ${selectedSha.slice(0, 7)}. Unsaved local edits will be overwritten.`,
      confirmLabel: "Restore",
      tone: "danger",
    });
    if (!ok) return;

    setRestoring(true);
    try {
      saveFileContentDraft(projectId, filePath, commitContent);
      await updateContent({
        projectId: projectId as Id<"projects">,
        path: filePath,
        content: commitContent,
      });
      toast.success("File restored", {
        description: `${filePath} · ${selectedSha.slice(0, 7)}`,
      });
    } catch (err) {
      toast.error("Restore failed", {
        description: parseConvexErrorMessage(err, "Could not update file"),
      });
    } finally {
      setRestoring(false);
    }
  };

  if (!enabled) {
    return (
      <p className="px-3 py-4 text-[11px] text-ws-text-muted">
        Connect and publish this project to GitHub to view commit history.
      </p>
    );
  }

  const selectedCommit = commits?.find((commit) => commit.sha === selectedSha);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex h-7 shrink-0 items-center justify-between gap-2 border-b border-ws-border-subtle px-2">
        <div className="flex min-w-0 items-center gap-1">
          <button
            type="button"
            onClick={() => setScope("repo")}
            className={cn(
              "rounded-sm px-1.5 py-0.5 text-[10px] font-medium transition-colors",
              effectiveScope === "repo"
                ? "bg-ws-accent/15 text-ws-text"
                : "text-ws-text-muted hover:text-ws-text",
            )}
          >
            All commits
          </button>
          {filePath ? (
            <button
              type="button"
              onClick={() => setScope("file")}
              title={filePath}
              className={cn(
                "max-w-[120px] truncate rounded-sm px-1.5 py-0.5 text-[10px] font-medium transition-colors",
                effectiveScope === "file"
                  ? "bg-ws-accent/15 text-ws-text"
                  : "text-ws-text-muted hover:text-ws-text",
              )}
            >
              {fileNameFromPath(filePath)}
            </button>
          ) : null}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          title="Refresh"
          aria-label="Refresh commit history"
          disabled={isLoading}
          onClick={() => void load()}
          className="size-5 shrink-0 rounded-sm text-ws-text-muted hover:bg-ws-hover hover:text-ws-text"
        >
          <RefreshCwIcon
            className={cn("size-3", isLoading && "animate-spin")}
          />
        </Button>
      </div>

      {canPreviewFile ? (
        <p className="shrink-0 border-b border-ws-border-subtle px-2.5 py-1.5 text-[10px] leading-relaxed text-ws-text-muted">
          Click a commit to preview this file at that point · Restore writes it
          into your working tree.
        </p>
      ) : null}

      <div className="min-h-0 flex-1 overflow-auto">
        {isLoading && commits === null ? (
          <div className="flex items-center gap-2 px-3 py-4 text-[11px] text-ws-text-muted">
            <Loader2Icon className="size-3.5 animate-spin" />
            Loading commits…
          </div>
        ) : error ? (
          <div className="space-y-2 px-3 py-4">
            <p className="text-[11px] text-ws-danger-soft">{error}</p>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => void load()}
              className="h-7 text-[11px] text-ws-text-secondary hover:bg-ws-hover hover:text-ws-text"
            >
              Try again
            </Button>
          </div>
        ) : commits && commits.length === 0 ? (
          <p className="px-3 py-4 text-[11px] text-ws-text-muted">
            {effectiveScope === "file"
              ? "No commits found for this file on the current branch."
              : "No commits found on this branch."}
          </p>
        ) : (
          <ul className="space-y-0 p-1.5">
            {commits?.map((commit, index) => {
              const selected = selectedSha === commit.sha;
              return (
                <li key={commit.sha}>
                  <div
                    className={cn(
                      "flex gap-2 rounded-sm px-2 py-1.5 transition-colors",
                      canPreviewFile && "cursor-pointer hover:bg-ws-hover",
                      selected && "bg-ws-accent/10",
                    )}
                    onClick={
                      canPreviewFile
                        ? () => void loadCommitContent(commit.sha)
                        : undefined
                    }
                    onKeyDown={
                      canPreviewFile
                        ? (event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              void loadCommitContent(commit.sha);
                            }
                          }
                        : undefined
                    }
                    role={canPreviewFile ? "button" : undefined}
                    tabIndex={canPreviewFile ? 0 : undefined}
                  >
                    <div className="flex w-3 shrink-0 flex-col items-center pt-1">
                      <span
                        className={cn(
                          "size-2 rounded-full border border-ws-accent",
                          selected || index === 0
                            ? "bg-transparent"
                            : "bg-ws-accent",
                        )}
                      />
                      {index < (commits?.length ?? 0) - 1 ? (
                        <span className="mt-1 w-px flex-1 bg-ws-accent/40" />
                      ) : null}
                    </div>
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="flex items-start gap-1">
                        <GitCommitHorizontalIcon className="mt-0.5 size-3 shrink-0 text-ws-text-muted" />
                        <p className="min-w-0 flex-1 text-[12px] leading-snug text-ws-text">
                          {commit.message}
                        </p>
                        <a
                          href={commit.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Open commit on GitHub"
                          aria-label="Open commit on GitHub"
                          onClick={(event) => event.stopPropagation()}
                          className="mt-0.5 shrink-0 text-ws-text-muted hover:text-ws-text"
                        >
                          <ExternalLinkIcon className="size-3" />
                        </a>
                      </div>
                      <div className="flex items-center gap-2 pl-4 text-[10px] text-ws-text-muted">
                        <span className="font-mono text-ws-link">
                          {commit.shortSha}
                        </span>
                        <span className="truncate">{commit.authorName}</span>
                        <span className="ml-auto shrink-0">
                          {formatCommitDate(commit.authorDate)}
                        </span>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {canPreviewFile && selectedSha && filePath ? (
        contentLoading ? (
          <div className="flex shrink-0 items-center gap-2 border-t border-ws-border-subtle px-3 py-4 text-[11px] text-ws-text-muted">
            <Loader2Icon className="size-3.5 animate-spin" />
            Loading file at {selectedSha.slice(0, 7)}…
          </div>
        ) : commitContent !== null && commitContent !== "" ? (
          <>
            <HistoryCommitDiffPreview
              projectId={projectId}
              path={filePath}
              commitSha={selectedSha}
              commitContent={commitContent}
            />
            <div className="flex shrink-0 items-center gap-2 border-t border-ws-border-subtle px-2.5 py-2">
              <p className="min-w-0 flex-1 truncate text-[10px] text-ws-text-muted">
                {selectedCommit?.message ?? selectedSha.slice(0, 7)}
              </p>
              <Button
                type="button"
                size="sm"
                disabled={restoring}
                onClick={() => void restoreAtCommit()}
                className="h-7 gap-1 px-2 text-[11px]"
              >
                {restoring ? (
                  <Loader2Icon className="size-3.5 animate-spin" />
                ) : (
                  <RotateCcwIcon className="size-3.5" />
                )}
                Restore
              </Button>
            </div>
          </>
        ) : null
      ) : null}
    </div>
  );
}
