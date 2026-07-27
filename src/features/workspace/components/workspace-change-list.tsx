"use client";

import { FileIcon } from "@react-symbols/icons/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CheckCircle2Icon,
  ChevronDownIcon,
  ChevronRightIcon,
  FileTextIcon,
  GitBranchIcon,
  Loader2Icon,
  MinusIcon,
  PlusIcon,
  Undo2Icon,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";

import { useConfirm } from "@/components/confirm-dialog";
import { Button } from "@/components/ui/button";
import { usePullFromGitHub } from "@/features/github/hooks/use-git-sync";
import { useProject } from "@/features/projects/hooks/use-projects";
import { useEditorTabs } from "@/features/workspace/hooks/use-editor-tabs";
import {
  useChangedFiles,
  useDiscardFileChanges,
  useProjectFiles,
  useSetAllChangedStaged,
  useSetFileStaged,
} from "@/features/workspace/hooks/use-project-files";
import {
  clearFileContentDraft,
  loadFileContentDraft,
  resolveSeedContent,
} from "@/features/workspace/lib/file-content-drafts";
import {
  countLineDiffStats,
  type LineDiffStats,
} from "@/features/workspace/lib/line-diff-stats";
import { useWorkspaceStore } from "@/features/workspace/store/workspace-store";
import { cn } from "@/lib/utils";
import type { Id } from "@/convex/_generated/dataModel";

type ChangedFile = {
  _id: Id<"projectFiles">;
  path: string;
  name: string;
  updatedAt: number;
  staged: boolean;
  isNew: boolean;
};

type WorkspaceChangeListProps = {
  projectId: string;
  emptyMessage?: string;
};

function computePathSelection(
  clickedPath: string,
  paths: string[],
  current: Set<string>,
  anchor: string | null,
  modifiers: { shiftKey?: boolean; modKey?: boolean },
): { selected: Set<string>; anchor: string } {
  if (modifiers.shiftKey && anchor) {
    const from = paths.indexOf(anchor);
    const to = paths.indexOf(clickedPath);
    if (from >= 0 && to >= 0) {
      const start = Math.min(from, to);
      const end = Math.max(from, to);
      return {
        selected: new Set(paths.slice(start, end + 1)),
        anchor,
      };
    }
  }

  if (modifiers.modKey) {
    const next = new Set(current);
    if (next.has(clickedPath)) next.delete(clickedPath);
    else next.add(clickedPath);
    if (next.size === 0) next.add(clickedPath);
    return { selected: next, anchor: clickedPath };
  }

  return { selected: new Set([clickedPath]), anchor: clickedPath };
}

export function WorkspaceChangeList({
  projectId,
  emptyMessage = "No modified files",
}: WorkspaceChangeListProps) {
  const project = useProject({ projectId });
  const changedFiles = useChangedFiles(projectId);
  const projectFiles = useProjectFiles(projectId);
  const pathname = usePathname();
  const { openTab } = useEditorTabs(projectId);
  const openGitInitDialog = useWorkspaceStore((s) => s.openGitInitDialog);
  const setFileStaged = useSetFileStaged();
  const setAllChangedStaged = useSetAllChangedStaged();
  const discardFileChanges = useDiscardFileChanges();
  const confirm = useConfirm();
  const [stagedOpen, setStagedOpen] = useState(true);
  const [unstagedOpen, setUnstagedOpen] = useState(true);
  const [busyPath, setBusyPath] = useState<string | null>(null);
  const [selectedPaths, setSelectedPaths] = useState<Set<string>>(new Set());
  const [selectionAnchor, setSelectionAnchor] = useState<string | null>(null);

  const statsByPath = useMemo(() => {
    const map = new Map<string, LineDiffStats>();
    if (!changedFiles || !projectFiles) return map;

    const byPath = new Map(
      projectFiles
        .filter((file) => file.kind === "file")
        .map((file) => [file.path, file] as const),
    );

    for (const changed of changedFiles) {
      const file = byPath.get(changed.path);
      const original = file?.syncedContent ?? "";
      const serverContent = file?.content ?? "";
      const draft = loadFileContentDraft(projectId, changed.path);
      const modified = resolveSeedContent(
        serverContent,
        file?.updatedAt,
        draft,
      );

      if (changed.isNew) {
        map.set(
          changed.path,
          countLineDiffStats("", modified),
        );
      } else {
        map.set(changed.path, countLineDiffStats(original, modified));
      }
    }

    return map;
  }, [changedFiles, projectFiles, projectId]);

  const staged = useMemo(
    () => (changedFiles ?? []).filter((file) => file.staged),
    [changedFiles],
  );
  const unstaged = useMemo(
    () => (changedFiles ?? []).filter((file) => !file.staged),
    [changedFiles],
  );
  const stagedPaths = useMemo(
    () => staged.map((file) => file.path),
    [staged],
  );
  const unstagedPaths = useMemo(
    () => unstaged.map((file) => file.path),
    [unstaged],
  );

  const selectChange = useCallback(
    (
      path: string,
      sectionPaths: string[],
      modifiers: { shiftKey?: boolean; modKey?: boolean },
    ) => {
      const next = computePathSelection(
        path,
        sectionPaths,
        selectedPaths,
        selectionAnchor,
        modifiers,
      );
      setSelectedPaths(next.selected);
      setSelectionAnchor(next.anchor);
    },
    [selectedPaths, selectionAnchor],
  );

  const stagePaths = useCallback(
    async (paths: string[], stagedValue: boolean) => {
      setBusyPath(paths[0] ?? "__batch__");
      try {
        for (const path of paths) {
          await setFileStaged({
            projectId: projectId as Id<"projects">,
            path,
            staged: stagedValue,
          });
        }
        setSelectedPaths(new Set());
        setSelectionAnchor(null);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Action failed");
      } finally {
        setBusyPath(null);
      }
    },
    [projectId, setFileStaged],
  );

  const runAction = useCallback(
    async (path: string, action: () => Promise<unknown>) => {
      setBusyPath(path);
      try {
        await action();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Action failed");
      } finally {
        setBusyPath(null);
      }
    },
    [],
  );

  if (project === undefined || changedFiles === undefined) {
    return (
      <div className="flex items-center gap-2 px-3 py-4 text-[11px] text-ws-text-muted">
        <Loader2Icon className="size-3.5 animate-spin" />
        Loading changes…
      </div>
    );
  }

  if (project === null) {
    return (
      <p className="px-3 py-4 text-[11px] leading-relaxed text-ws-text-muted">
        Project unavailable.
      </p>
    );
  }

  if (!project.syncedAt) {
    const isGitHub = project.source === "github" && project.githubRepoUrl;
    const isSyncing = project.importStatus === "importing";
    const total = project.importTotalFiles;
    const done = project.importDoneFiles ?? 0;
    const hasProgress = typeof total === "number" && total > 0;
    const percent = hasProgress
      ? Math.min(100, Math.round((done / total) * 100))
      : null;
    const startedAt = project.importStartedAt;
    const canRetryStuck =
      isSyncing &&
      typeof startedAt === "number" &&
      Date.now() - startedAt > 45_000;

    return (
      <div className="flex flex-col gap-3 px-3 py-5">
        <div className="flex size-9 items-center justify-center rounded-md bg-ws-hover text-ws-text-muted">
          {isSyncing ? (
            <Loader2Icon className="size-4 animate-spin" />
          ) : (
            <GitBranchIcon className="size-4" />
          )}
        </div>
        <div className="space-y-1">
          <p className="text-[12px] font-medium text-ws-text">
            {isSyncing ? "Syncing repository…" : "Change tracking not ready"}
          </p>
          <p className="text-[11px] leading-relaxed text-ws-text-muted">
            {isSyncing
              ? hasProgress
                ? `Writing files ${done.toLocaleString()} / ${total.toLocaleString()} (${percent}%). Usually finishes within about a minute.`
                : "Downloading repository from GitHub… usually under a minute."
              : isGitHub
                ? "Pull from GitHub once to create a sync baseline, then edits will show up here with diffs."
                : "Initialize a GitHub repository for this project to stage, diff, and push local changes."}
          </p>
        </div>
        {isSyncing ? (
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-ws-hover">
            <div
              className="h-full rounded-full bg-ws-accent transition-[width] duration-300"
              style={{
                width: percent == null ? "30%" : `${percent}%`,
                ...(percent == null
                  ? { animation: "pulse 1.4s ease-in-out infinite" }
                  : {}),
              }}
            />
          </div>
        ) : null}
        {isGitHub && (canRetryStuck || !isSyncing) ? (
          <RetryPullButton
            projectId={projectId}
            label={canRetryStuck ? "Retry fast sync" : undefined}
          />
        ) : null}
        {!isGitHub && !isSyncing ? (
          <Button
            type="button"
            size="sm"
            onClick={openGitInitDialog}
            className="h-7 w-fit bg-ws-accent text-[11px] text-white hover:bg-ws-accent-hover"
          >
            Initialize Repository
          </Button>
        ) : null}
      </div>
    );
  }

  if (changedFiles.length === 0) {
    return (
      <div className="flex flex-col items-start gap-2 px-3 py-5">
        <div className="flex size-9 items-center justify-center rounded-md bg-ws-success/15 text-ws-success">
          <CheckCircle2Icon className="size-4" />
        </div>
        <div className="space-y-1">
          <p className="text-[12px] font-medium text-ws-text">
            Working tree clean
          </p>
          <p className="text-[11px] leading-relaxed text-ws-text-muted">
            {emptyMessage}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1 p-1.5">
      <ChangeSection
        title="Staged Changes"
        count={staged.length}
        open={stagedOpen}
        onToggle={() => setStagedOpen((value) => !value)}
        actionLabel="Unstage All"
        onAction={
          staged.length > 0
            ? () =>
                void runAction("__all__", () =>
                  setAllChangedStaged({
                    projectId: projectId as Id<"projects">,
                    staged: false,
                  }),
                )
            : undefined
        }
      >
        {staged.length === 0 ? (
          <p className="px-2 py-1.5 text-[11px] text-ws-text-muted">
            No staged changes
          </p>
        ) : (
          staged.map((file) => (
            <ChangeRow
              key={file._id}
              projectId={projectId}
              file={file}
              stats={statsByPath.get(file.path)}
              activeMode={activeChangeMode(pathname, projectId, file.path)}
              selected={selectedPaths.has(file.path)}
              busy={busyPath === file.path}
              onSelect={(event) =>
                selectChange(file.path, stagedPaths, {
                  shiftKey: event.shiftKey,
                  modKey: event.metaKey || event.ctrlKey,
                })
              }
              onOpenDiff={() => openTab({ kind: "diff", path: file.path })}
              onOpenFile={() => openTab({ kind: "file", path: file.path })}
              onUnstage={() => {
                const paths =
                  selectedPaths.has(file.path) && selectedPaths.size > 1
                    ? stagedPaths.filter((path) => selectedPaths.has(path))
                    : [file.path];
                void stagePaths(paths, false);
              }}
            />
          ))
        )}
      </ChangeSection>

      <ChangeSection
        title="Changes"
        count={unstaged.length}
        open={unstagedOpen}
        onToggle={() => setUnstagedOpen((value) => !value)}
        actionLabel="Stage All"
        onAction={
          unstaged.length > 0
            ? () =>
                void runAction("__all__", () =>
                  setAllChangedStaged({
                    projectId: projectId as Id<"projects">,
                    staged: true,
                  }),
                )
            : undefined
        }
      >
        {unstaged.length === 0 ? (
          <p className="px-2 py-1.5 text-[11px] text-ws-text-muted">
            No unstaged changes
          </p>
        ) : (
          unstaged.map((file) => (
            <ChangeRow
              key={file._id}
              projectId={projectId}
              file={file}
              stats={statsByPath.get(file.path)}
              activeMode={activeChangeMode(pathname, projectId, file.path)}
              selected={selectedPaths.has(file.path)}
              busy={busyPath === file.path}
              onSelect={(event) =>
                selectChange(file.path, unstagedPaths, {
                  shiftKey: event.shiftKey,
                  modKey: event.metaKey || event.ctrlKey,
                })
              }
              onOpenDiff={() => openTab({ kind: "diff", path: file.path })}
              onOpenFile={() => openTab({ kind: "file", path: file.path })}
              onStage={() => {
                const paths =
                  selectedPaths.has(file.path) && selectedPaths.size > 1
                    ? unstagedPaths.filter((path) => selectedPaths.has(path))
                    : [file.path];
                void stagePaths(paths, true);
              }}
              onDiscard={() =>
                void runAction(file.path, async () => {
                  const targets =
                    selectedPaths.has(file.path) && selectedPaths.size > 1
                      ? unstagedPaths.filter((path) => selectedPaths.has(path))
                      : [file.path];
                  const label =
                    targets.length === 1
                      ? `“${targets[0]}”`
                      : `${targets.length} files`;
                  const ok = await confirm({
                    title: "Discard changes?",
                    description: `Changes you made to ${label} will not be saved. This cannot be undone.`,
                    confirmLabel: "Discard",
                    cancelLabel: "Keep editing",
                    tone: "danger",
                  });
                  if (!ok) return;

                  for (const path of targets) {
                    await discardFileChanges({
                      projectId: projectId as Id<"projects">,
                      path,
                    });
                    clearFileContentDraft(projectId, path);
                  }
                  setSelectedPaths(new Set());
                  setSelectionAnchor(null);
                  toast.success(
                    targets.length === 1
                      ? `Discarded changes to ${targets[0]}`
                      : `Discarded changes to ${targets.length} files`,
                  );
                })
              }
            />
          ))
        )}
      </ChangeSection>
    </div>
  );
}

function activeChangeMode(
  pathname: string,
  projectId: string,
  path: string,
): "diff" | "file" | null {
  if (pathname === `/projects/${projectId}/diff/${path}`) return "diff";
  if (pathname === `/projects/${projectId}/files/${path}`) return "file";
  return null;
}

function parentDir(path: string): string {
  const parts = path.split("/").filter(Boolean);
  if (parts.length <= 1) return "";
  return parts.slice(0, -1).join("/");
}

function RetryPullButton({
  projectId,
  label = "Pull from GitHub",
}: {
  projectId: string;
  label?: string;
}) {
  const { pull, isPulling } = usePullFromGitHub(projectId);
  return (
    <Button
      type="button"
      size="sm"
      disabled={isPulling}
      onClick={() => void pull({ force: true })}
      className="h-7 w-fit bg-ws-accent text-[11px] text-white hover:bg-ws-accent-hover"
    >
      {isPulling ? (
        <>
          <Loader2Icon className="size-3 animate-spin" />
          Starting…
        </>
      ) : (
        label
      )}
    </Button>
  );
}

function ChangeSection({
  title,
  count,
  open,
  onToggle,
  actionLabel,
  onAction,
  children,
}: {
  title: string;
  count: number;
  open: boolean;
  onToggle: () => void;
  actionLabel?: string;
  onAction?: () => void;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex h-6 items-center gap-0.5 px-1">
        <button
          type="button"
          onClick={onToggle}
          className="inline-flex min-w-0 flex-1 items-center gap-1 rounded-sm px-1 text-left text-[11px] font-medium text-ws-text-muted hover:bg-ws-hover hover:text-ws-text"
        >
          {open ? (
            <ChevronDownIcon className="size-3 shrink-0" />
          ) : (
            <ChevronRightIcon className="size-3 shrink-0" />
          )}
          <span className="truncate">{title}</span>
          <span className="ml-auto tabular-nums text-ws-text-muted">{count}</span>
        </button>
        {onAction && actionLabel ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            title={actionLabel}
            aria-label={actionLabel}
            onClick={onAction}
            className="size-5 rounded-sm text-ws-text-muted hover:bg-ws-hover hover:text-ws-text"
          >
            {actionLabel.startsWith("Stage") ? (
              <PlusIcon className="size-3" />
            ) : (
              <MinusIcon className="size-3" />
            )}
          </Button>
        ) : null}
      </div>
      {open ? <ul className="space-y-0.5">{children}</ul> : null}
    </div>
  );
}

function DiffStatBadges({ stats }: { stats?: LineDiffStats }) {
  if (!stats) return null;
  const { added, removed } = stats;
  if (added === 0 && removed === 0) return null;

  return (
    <span className="flex shrink-0 items-center gap-1 text-[10px] tabular-nums">
      {added > 0 ? (
        <span className="text-ws-success">+{added}</span>
      ) : null}
      {removed > 0 ? (
        <span className="text-ws-danger-soft">−{removed}</span>
      ) : null}
    </span>
  );
}

function ChangeRow({
  projectId,
  file,
  stats,
  activeMode,
  selected = false,
  busy = false,
  onSelect,
  onOpenDiff,
  onOpenFile,
  onStage,
  onUnstage,
  onDiscard,
}: {
  projectId: string;
  file: ChangedFile;
  stats?: LineDiffStats;
  activeMode: "diff" | "file" | null;
  selected?: boolean;
  busy?: boolean;
  onSelect?: (event: React.MouseEvent) => void;
  onOpenDiff?: () => void;
  onOpenFile?: () => void;
  onStage?: () => void;
  onUnstage?: () => void;
  onDiscard?: () => void;
}) {
  const href = `/projects/${projectId}/diff/${file.path}`;
  const marker = file.isNew ? "A" : "M";
  const markerColor = file.isNew ? "text-ws-link" : "text-ws-success";
  const dir = parentDir(file.path);
  const active = activeMode != null;
  const hasHoverActions = Boolean(onOpenFile || onStage || onUnstage || onDiscard);

  return (
    <li
      className={cn(
        "group flex items-center gap-0.5 rounded-sm pr-1 pl-1.5 text-[12px]",
        selected || active
          ? "bg-ws-hover text-ws-text"
          : "text-ws-text-muted hover:bg-ws-hover hover:text-ws-text",
      )}
    >
      <Link
        href={href}
        onClick={(event) => {
          onSelect?.(event);
          if (event.shiftKey || event.metaKey || event.ctrlKey) {
            event.preventDefault();
            return;
          }
          if (!onOpenDiff) return;
          event.preventDefault();
          onOpenDiff();
        }}
        className="flex min-w-0 flex-1 items-center gap-1.5 py-0.5"
        title={`Open diff · ${file.path}`}
      >
        <span
          className={cn(
            "size-3.5 shrink-0 text-center text-[11px] font-medium",
            markerColor,
          )}
        >
          {marker}
        </span>
        <span className="size-3.5 shrink-0 [&_svg]:size-full">
          <FileIcon fileName={file.name} autoAssign />
        </span>
        <span className="flex min-w-0 flex-1 items-baseline gap-1.5 overflow-hidden">
          <span
            className={cn(
              "shrink-0 font-medium",
              activeMode === "diff" && "text-ws-text",
            )}
          >
            {file.name}
          </span>
          {dir ? (
            <span className="min-w-0 truncate text-[10px] text-ws-text-muted">
              {dir}
            </span>
          ) : null}
        </span>
      </Link>

      <div
        className={cn(
          "relative flex h-5 shrink-0 items-center justify-end",
          hasHoverActions && "min-w-[60px]",
        )}
      >
        {/* Idle: mini +/- line stats */}
        <div
          className={cn(
            "flex items-center px-0.5 transition-opacity",
            hasHoverActions &&
              "group-hover:pointer-events-none group-hover:opacity-0 group-focus-within:pointer-events-none group-focus-within:opacity-0",
          )}
        >
          <DiffStatBadges stats={stats} />
        </div>

        {/* Hover: go to file · stage(+) / unstage(−) · discard */}
        {hasHoverActions ? (
          <div className="absolute inset-y-0 right-0 flex items-center opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
            {busy ? (
              <Loader2Icon className="size-3.5 animate-spin text-ws-text-muted" />
            ) : (
              <>
                {onOpenFile ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    title="Open file"
                    aria-label={`Open ${file.path}`}
                    onClick={onOpenFile}
                    className={cn(
                      "size-5 rounded-sm text-ws-text-muted hover:bg-ws-panel hover:text-ws-text",
                      activeMode === "file" && "text-ws-text",
                    )}
                  >
                    <FileTextIcon className="size-3" />
                  </Button>
                ) : null}
                {onStage ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    title="Stage"
                    aria-label={`Stage ${file.path}`}
                    onClick={onStage}
                    className="size-5 rounded-sm text-ws-text-muted hover:bg-ws-panel hover:text-ws-text"
                  >
                    <PlusIcon className="size-3" />
                  </Button>
                ) : null}
                {onUnstage ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    title="Unstage"
                    aria-label={`Unstage ${file.path}`}
                    onClick={onUnstage}
                    className="size-5 rounded-sm text-ws-text-muted hover:bg-ws-panel hover:text-ws-text"
                  >
                    <MinusIcon className="size-3" />
                  </Button>
                ) : null}
                {onDiscard ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    title="Discard Changes"
                    aria-label={`Discard changes to ${file.path}`}
                    onClick={onDiscard}
                    className="size-5 rounded-sm text-ws-text-muted hover:bg-ws-panel hover:text-ws-danger-soft"
                  >
                    <Undo2Icon className="size-3" />
                  </Button>
                ) : null}
              </>
            )}
          </div>
        ) : null}
      </div>
    </li>
  );
}
