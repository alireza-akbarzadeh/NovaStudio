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
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { useConfirm } from "@/components/confirm-dialog";
import { Button } from "@/components/ui/button";
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
  interactive?: boolean;
};

export function WorkspaceChangeList({
  projectId,
  emptyMessage = "No modified files",
  interactive = false,
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
    return (
      <div className="flex flex-col gap-3 px-3 py-5">
        <div className="flex size-9 items-center justify-center rounded-md bg-ws-hover text-ws-text-muted">
          <GitBranchIcon className="size-4" />
        </div>
        <div className="space-y-1">
          <p className="text-[12px] font-medium text-ws-text">
            Change tracking not ready
          </p>
          <p className="text-[11px] leading-relaxed text-ws-text-muted">
            {isGitHub
              ? "Pull from GitHub once to create a sync baseline, then edits will show up here with diffs."
              : "Initialize a GitHub repository for this project to stage, diff, and push local changes."}
          </p>
        </div>
        {!isGitHub ? (
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

  if (!interactive) {
    return (
      <ul className="space-y-0.5 p-1.5">
        {changedFiles.map((file) => (
          <ChangeRow
            key={file._id}
            projectId={projectId}
            file={file}
            stats={statsByPath.get(file.path)}
            activeMode={activeChangeMode(pathname, projectId, file.path)}
            onOpenDiff={() => openTab({ kind: "diff", path: file.path })}
          />
        ))}
      </ul>
    );
  }

  const staged = changedFiles.filter((file) => file.staged);
  const unstaged = changedFiles.filter((file) => !file.staged);

  const runAction = async (path: string, action: () => Promise<unknown>) => {
    setBusyPath(path);
    try {
      await action();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Action failed");
    } finally {
      setBusyPath(null);
    }
  };

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
              interactive
              busy={busyPath === file.path}
              onOpenDiff={() => openTab({ kind: "diff", path: file.path })}
              onOpenFile={() => openTab({ kind: "file", path: file.path })}
              onUnstage={() =>
                void runAction(file.path, () =>
                  setFileStaged({
                    projectId: projectId as Id<"projects">,
                    path: file.path,
                    staged: false,
                  }),
                )
              }
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
              interactive
              busy={busyPath === file.path}
              onOpenDiff={() => openTab({ kind: "diff", path: file.path })}
              onOpenFile={() => openTab({ kind: "file", path: file.path })}
              onStage={() =>
                void runAction(file.path, () =>
                  setFileStaged({
                    projectId: projectId as Id<"projects">,
                    path: file.path,
                    staged: true,
                  }),
                )
              }
              onDiscard={() =>
                void runAction(file.path, async () => {
                  const ok = await confirm({
                    title: "Discard changes?",
                    description: `Changes you made to “${file.path}” will not be saved. This cannot be undone.`,
                    confirmLabel: "Discard",
                    cancelLabel: "Keep editing",
                    tone: "danger",
                  });
                  if (!ok) return;

                  await discardFileChanges({
                    projectId: projectId as Id<"projects">,
                    path: file.path,
                  });
                  clearFileContentDraft(projectId, file.path);
                  toast.success(`Discarded changes to ${file.path}`);
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
  interactive = false,
  busy = false,
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
  interactive?: boolean;
  busy?: boolean;
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

  return (
    <li
      className={cn(
        "group flex items-center gap-0.5 rounded-sm pr-1 pl-1.5 text-[12px]",
        active
          ? "bg-ws-hover text-ws-text"
          : "text-ws-text-muted hover:bg-ws-hover hover:text-ws-text",
      )}
    >
      <Link
        href={href}
        onClick={(event) => {
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
        <DiffStatBadges stats={stats} />
      </Link>

      {interactive ? (
        <div className="flex shrink-0 items-center opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
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
                    activeMode === "file" && "opacity-100 text-ws-text",
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
    </li>
  );
}
