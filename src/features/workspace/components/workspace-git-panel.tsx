"use client";

import Image from "next/image";
import {
  DownloadIcon,
  ExternalLinkIcon,
  GitBranchIcon,
  GitCommitIcon,
  Loader2Icon,
  RefreshCwIcon,
  SparklesIcon,
  UploadIcon,
} from "lucide-react";
import { useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useProject } from "@/features/projects/hooks/use-projects";
import { GitHubConnectionStatus } from "@/features/github/components/github-connection-status";
import { useCommitAndPush } from "@/features/github/hooks/use-commit-and-push";
import { useGenerateCommitMessage } from "@/features/github/hooks/use-generate-commit-message";
import { usePullFromGitHub } from "@/features/github/hooks/use-git-sync";
import { WorkspaceChangeList } from "@/features/workspace/components/workspace-change-list";
import { WorkspaceMergeConflictsPanel } from "@/features/workspace/components/workspace-merge-conflicts-panel";
import { WorkspaceGitHistory } from "@/features/workspace/components/workspace-git-history";
import { WorkspaceGitHubHub } from "@/features/workspace/components/workspace-git-hub";
import { WorkspaceLinearLink } from "@/features/workspace/components/workspace-linear-link";
import { WorkspaceStashPanel } from "@/features/workspace/components/workspace-stash-panel";
import { useChangedFiles } from "@/features/workspace/hooks/use-project-files";
import {
  useWorkspaceStore,
  type GitPanelTab,
} from "@/features/workspace/store/workspace-store";
import { cn } from "@/lib/utils";

type WorkspaceGitPanelProps = {
  projectId: string;
};

const GIT_TABS: { id: GitPanelTab; label: string }[] = [
  { id: "changes", label: "Changes" },
  { id: "stashes", label: "Stashes" },
  { id: "history", label: "History" },
  { id: "github", label: "GitHub" },
  { id: "info", label: "Info" },
];

export function WorkspaceGitPanel({ projectId }: WorkspaceGitPanelProps) {
  const activeTab = useWorkspaceStore((s) => s.gitPanelTab);
  const setGitPanelTab = useWorkspaceStore((s) => s.setGitPanelTab);
  const currentFilePath = useWorkspaceStore((s) => s.currentFilePath);
  const [commitMessage, setCommitMessage] = useState("");
  const project = useProject({ projectId });
  const changedFiles = useChangedFiles(projectId);
  const { push, isPushing } = useCommitAndPush(projectId);
  const { pull, isPulling } = usePullFromGitHub(projectId);
  const { generate, isGenerating, canGenerate } =
    useGenerateCommitMessage(projectId);

  if (project === undefined) {
    return (
      <div className="flex items-center gap-2 px-3 py-4 text-[11px] text-ws-text-muted">
        <Loader2Icon className="size-3.5 animate-spin" />
        Loading…
      </div>
    );
  }

  if (project === null) {
    return (
      <p className="px-3 py-4 text-[11px] text-ws-text-muted">
        Project unavailable.
      </p>
    );
  }

  const isGitHub = project.source === "github" && project.githubRepoUrl;
  const isSyncing = project.importStatus === "importing";
  const syncTotal = project.importTotalFiles;
  const syncDone = project.importDoneFiles ?? 0;
  const syncLabel =
    isSyncing && typeof syncTotal === "number" && syncTotal > 0
      ? ` · syncing ${syncDone}/${syncTotal}`
      : isSyncing
        ? " · syncing…"
        : "";
  const changeCount = changedFiles?.length ?? 0;
  const stagedCount = changedFiles?.filter((file) => file.staged).length ?? 0;
  const unstagedCount = changeCount - stagedCount;
  const canPush =
    isGitHub &&
    stagedCount > 0 &&
    commitMessage.trim().length > 0 &&
    !isPushing;

  const onCommitAndPush = async () => {
    if (!canPush) return;
    try {
      await push(commitMessage.trim());
      setCommitMessage("");
    } catch {
      // toast handled in hook
    }
  };

  const onGenerateCommitMessage = async () => {
    if (!canGenerate) return;
    const message = await generate();
    if (message) {
      setCommitMessage(message);
    }
  };

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex h-7 shrink-0 items-end gap-px border-b border-ws-border-subtle bg-ws-panel px-1">
        {GIT_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setGitPanelTab(tab.id)}
            className={cn(
              "inline-flex h-6 items-center gap-1.5 rounded-t-sm px-2.5 text-[11px] font-medium transition-colors",
              activeTab === tab.id
                ? "bg-ws-bg text-ws-text"
                : "text-ws-text-muted hover:text-ws-text",
            )}
          >
            {tab.label}
            {tab.id === "changes" && changeCount > 0 ? (
              <span className="rounded-full bg-ws-accent px-1.5 text-[9px] text-white">
                {changeCount}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      {activeTab === "changes" ? (
        <div className="flex min-h-0 flex-1 flex-col">
          {/* JetBrains-style: toolbar + changes list fill the panel */}
          {isGitHub ? (
            <div className="flex shrink-0 items-center gap-0.5 border-b border-ws-border-subtle px-1.5 py-1">
              <Button
                type="button"
                size="icon-sm"
                variant="ghost"
                disabled={isPulling || isPushing}
                onClick={() => void pull({ force: isSyncing })}
                title={isSyncing ? "Restart sync" : "Pull from GitHub"}
                aria-label={isSyncing ? "Restart sync" : "Pull from GitHub"}
                className="size-6 rounded-sm text-ws-text-muted hover:bg-ws-hover hover:text-ws-text"
              >
                {isPulling || isSyncing ? (
                  <Loader2Icon className="size-3.5 animate-spin" />
                ) : (
                  <DownloadIcon className="size-3.5" />
                )}
              </Button>
              <Button
                type="button"
                size="icon-sm"
                variant="ghost"
                disabled={!canPush || isGenerating || isSyncing}
                onClick={() => void onCommitAndPush()}
                title={
                  canPush
                    ? "Commit and Push"
                    : stagedCount === 0
                      ? "Stage files and enter a commit message to push"
                      : commitMessage.trim().length === 0
                        ? "Enter a commit message to push"
                        : "Commit and Push"
                }
                aria-label="Commit and Push"
                className="size-6 rounded-sm text-ws-text-muted hover:bg-ws-hover hover:text-ws-text disabled:opacity-40"
              >
                {isPushing ? (
                  <Loader2Icon className="size-3.5 animate-spin" />
                ) : (
                  <UploadIcon className="size-3.5" />
                )}
              </Button>
              <Button
                type="button"
                size="icon-sm"
                variant="ghost"
                disabled={isPulling || isPushing}
                onClick={() => void pull({ force: isSyncing })}
                title="Refresh"
                aria-label="Refresh"
                className="size-6 rounded-sm text-ws-text-muted hover:bg-ws-hover hover:text-ws-text"
              >
                <RefreshCwIcon
                  className={cn(
                    "size-3.5",
                    (isPulling || isSyncing) && "animate-spin",
                  )}
                />
              </Button>
              <div className="mx-1 h-3.5 w-px shrink-0 bg-ws-border-subtle" />
              <span className="truncate px-1 text-[10px] text-ws-text-muted">
                {project.githubBranch ?? "main"}
                {syncLabel}
                {changeCount > 0
                  ? ` · ${changeCount} change${changeCount === 1 ? "" : "s"}`
                  : ""}
              </span>
            </div>
          ) : (
            <div className="shrink-0 border-b border-ws-border-subtle px-3 py-2">
              <InitializeRepositoryPrompt />
            </div>
          )}

          {isGitHub ? (
            <GitHubConnectionStatus
              hideWhenHealthy
              className="border-b border-ws-border-subtle px-2.5 py-1.5 text-[11px]"
            />
          ) : null}

          <WorkspaceMergeConflictsPanel projectId={projectId} />

          <div className="flex h-6 shrink-0 items-center gap-2 border-b border-ws-border-subtle bg-ws-panel/80 px-2.5 text-[11px] font-medium text-ws-text-muted">
            <span>Changes</span>
            {changeCount > 0 ? (
              <span className="font-normal tabular-nums">
                {stagedCount} staged
                {unstagedCount > 0 ? ` · ${unstagedCount} unstaged` : ""}
              </span>
            ) : null}
          </div>

          <div className="min-h-0 flex-1 overflow-auto">
            <WorkspaceChangeList
              projectId={projectId}
              emptyMessage={
                isGitHub
                  ? "No local changes since last GitHub sync."
                  : "Connect GitHub to track and push changes."
              }
            />
          </div>

          {/* Commit dock — message + actions at the bottom (JetBrains Commit tool window) */}
          {isGitHub ? (
            <div className="shrink-0 space-y-2 border-t border-ws-border-subtle bg-ws-panel p-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-medium text-ws-text-muted">
                  Commit Message
                </span>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  disabled={!canGenerate || isPushing}
                  onClick={() => void onGenerateCommitMessage()}
                  className="h-6 gap-1 px-1.5 text-[11px] text-ws-text-muted hover:bg-ws-hover hover:text-ws-text disabled:opacity-50"
                >
                  {isGenerating ? (
                    <>
                      <Loader2Icon className="size-3 animate-spin" />
                      Generating…
                    </>
                  ) : (
                    <>
                      <SparklesIcon className="size-3" />
                      Generate
                    </>
                  )}
                </Button>
              </div>
              <Textarea
                value={commitMessage}
                onChange={(e) => setCommitMessage(e.target.value)}
                onKeyDown={(e) => {
                  if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                    e.preventDefault();
                    void onCommitAndPush();
                  }
                }}
                placeholder="Commit Message"
                rows={4}
                disabled={isGenerating}
                className="min-h-22 resize-none rounded-sm border-ws-border bg-ws-bg font-mono text-[12px] text-ws-text placeholder:text-ws-text-muted focus-visible:ring-ws-accent disabled:opacity-60"
              />
              <div className="flex flex-wrap items-center gap-1.5">
                <Button
                  type="button"
                  size="sm"
                  disabled={!canPush || isGenerating}
                  onClick={() => void onCommitAndPush()}
                  title="Commit and Push (Ctrl+Enter)"
                  className="h-7 gap-1.5 bg-ws-accent px-2.5 text-[11px] text-white hover:bg-ws-accent-hover disabled:opacity-50"
                >
                  {isPushing ? (
                    <>
                      <Loader2Icon className="size-3.5 animate-spin" />
                      Pushing…
                    </>
                  ) : (
                    <>
                      <UploadIcon className="size-3.5" />
                      Commit and Push
                      {stagedCount > 0 ? ` (${stagedCount})` : ""}
                    </>
                  )}
                </Button>
                {changeCount > 0 && stagedCount === 0 ? (
                  <p className="min-w-0 flex-1 text-[10px] text-ws-text-muted">
                    Stage files above before committing
                  </p>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
      ) : activeTab === "stashes" ? (
        <WorkspaceStashPanel projectId={projectId} />
      ) : activeTab === "history" ? (
        <WorkspaceGitHistory
          projectId={projectId}
          enabled={Boolean(isGitHub)}
          filePath={currentFilePath}
        />
      ) : activeTab === "github" ? (
        <WorkspaceGitHubHub
          projectId={projectId}
          enabled={Boolean(isGitHub)}
        />
      ) : (
        <GitInfoTab
          project={project}
          isGitHub={Boolean(isGitHub)}
          onPull={() => void pull()}
          isPulling={isPulling}
        />
      )}
    </div>
  );
}

function GitInfoTab({
  project,
  isGitHub,
  onPull,
  isPulling,
}: {
  project: NonNullable<ReturnType<typeof useProject>>;
  isGitHub: boolean;
  onPull: () => void;
  isPulling: boolean;
}) {
  return (
    <div className="flex-1 overflow-auto">
      <div className="space-y-3 border-b border-ws-border-subtle p-3">
        <div className="flex items-center gap-2">
          <Image
            src="/images/github.png"
            alt=""
            width={14}
            height={14}
            className="size-3.5 opacity-80 dark:invert"
          />
          <span className="text-[12px] font-medium text-ws-text">Git</span>
        </div>
        <GitHubConnectionStatus className="text-[11px]" />
      </div>

      {isGitHub ? (
        <div className="space-y-3 p-3">
          <GitInfoRow
            icon={<GitBranchIcon className="size-3.5" />}
            label="Branch"
            value={project.githubBranch ?? "main"}
          />
          {project.lastCommitSha ? (
            <GitInfoRow
              icon={<GitCommitIcon className="size-3.5" />}
              label="Last sync"
              value={project.lastCommitSha.slice(0, 7)}
            />
          ) : null}
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={isPulling}
            onClick={onPull}
            className="h-7 w-full border-ws-border bg-ws-bg text-[11px] text-ws-text hover:bg-ws-hover"
          >
            {isPulling ? (
              <>
                <Loader2Icon className="size-3.5 animate-spin" />
                Pulling from GitHub…
              </>
            ) : (
              <>
                <DownloadIcon className="size-3.5" />
                Pull / Sync Explorer
              </>
            )}
          </Button>
          <div className="space-y-1">
            <p className="text-[10px] tracking-wide text-ws-text-muted uppercase">
              Repository
            </p>
            <a
              href={
                project.githubRepoUrl?.startsWith("http")
                  ? project.githubRepoUrl
                  : `https://github.com/${project.githubRepoUrl}`
              }
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 truncate text-[11px] text-ws-link hover:underline"
            >
              <span className="truncate">{project.githubRepoUrl}</span>
              <ExternalLinkIcon className="size-3 shrink-0" />
            </a>
          </div>
          <WorkspaceLinearLink projectId={project._id} />
        </div>
      ) : (
        <div className="space-y-3 p-3">
          <InitializeRepositoryPrompt variant="info" />
          <WorkspaceLinearLink projectId={project._id} />
        </div>
      )}
    </div>
  );
}

function InitializeRepositoryPrompt({
  variant = "changes",
}: {
  variant?: "changes" | "info";
}) {
  const openGitInitDialog = useWorkspaceStore((s) => s.openGitInitDialog);

  const content = (
    <div className="space-y-2">
      <p className="text-[11px] text-ws-text-muted">
        Create a GitHub repository for this project to track and push changes.
      </p>
      <Button
        type="button"
        size="sm"
        onClick={openGitInitDialog}
        className="h-7 w-full bg-ws-accent text-[11px] text-white hover:bg-ws-accent-hover"
      >
        Initialize Repository
      </Button>
    </div>
  );

  if (variant === "info") {
    return <div className="space-y-2 p-3">{content}</div>;
  }

  return content;
}

function GitInfoRow({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2 text-[11px]">
      <span className="text-ws-text-muted">{icon}</span>
      <span className="text-ws-text-muted">{label}</span>
      <span className="ml-auto font-mono text-ws-text-secondary">{value}</span>
    </div>
  );
}
