"use client";

import {
  CircleAlertIcon,
  CircleXIcon,
  GitBranchIcon,
  Loader2Icon,
  PackageIcon,
  ZapIcon,
} from "lucide-react";
import type { ReactNode } from "react";

import { useProject } from "@/features/projects/hooks/use-projects";
import { useOptionalPreviewServer } from "@/features/workspace/components/preview-server-provider";
import { useOptionalWebContainer } from "@/features/workspace/components/webcontainer-provider";
import { WorkspaceBranchPicker } from "@/features/workspace/components/workspace-branch-picker";
import { useChangedFiles } from "@/features/workspace/hooks/use-project-files";
import { useMonacoProblems } from "@/features/workspace/hooks/use-monaco-problems";
import { getLanguageLabel } from "@/features/workspace/lib/editor-languages";
import { useWorkspaceStore } from "@/features/workspace/store/workspace-store";
import { cn } from "@/lib/utils";

type WorkspaceStatusBarProps = {
  projectId: string;
};

function StatusChip({
  children,
  className,
  active,
  onClick,
  title,
}: {
  children: ReactNode;
  className?: string;
  active?: boolean;
  onClick?: () => void;
  title?: string;
}) {
  const classes = cn(
    "inline-flex h-6 max-w-55 items-center gap-1.5 truncate rounded-full bg-ws-chip px-2.5 text-[11px] transition-colors",
    active
      ? "bg-ws-accent/15 text-ws-text shadow-[inset_0_0_0_1px] shadow-ws-accent/30"
      : "text-ws-text-muted",
    onClick && !active && "hover:bg-ws-hover hover:text-ws-text",
    className,
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} title={title} className={classes}>
        {children}
      </button>
    );
  }

  return (
    <span title={title} className={classes}>
      {children}
    </span>
  );
}

function webContainerLabel(status: string | undefined): string {
  switch (status) {
    case "booting":
    case "mounting":
    case "idle":
      return "Node starting…";
    case "ready":
      return "Node ready";
    case "error":
      return "Node offline";
    default:
      return "Node";
  }
}

export function WorkspaceStatusBar({ projectId }: WorkspaceStatusBarProps) {
  const project = useProject({ projectId });
  const changedFiles = useChangedFiles(projectId);
  const webcontainer = useOptionalWebContainer();
  const previewServer = useOptionalPreviewServer();
  const currentFilePath = useWorkspaceStore((s) => s.currentFilePath);
  const openGitInitDialog = useWorkspaceStore((s) => s.openGitInitDialog);
  const branchPickerOpen = useWorkspaceStore((s) => s.branchPickerOpen);
  const setBranchPickerOpen = useWorkspaceStore((s) => s.setBranchPickerOpen);
  const showProblemsPanel = useWorkspaceStore((s) => s.showProblemsPanel);
  const bottomPanelTab = useWorkspaceStore((s) => s.bottomPanelTab);
  const terminalOpen = useWorkspaceStore((s) => s.terminalOpen);
  const setBottomPanelTab = useWorkspaceStore((s) => s.setBottomPanelTab);
  const { errorCount, warningCount } = useMonacoProblems();

  const changeCount = changedFiles?.length ?? 0;
  const branch = project?.githubBranch ?? "main";
  const isGitHub = project?.source === "github" && project.githubRepoUrl;
  const isPushing = project?.exportStatus === "exporting";
  const language = getLanguageLabel(currentFilePath);
  const problemsActive = terminalOpen && bottomPanelTab === "problems";
  const wcStatus = webcontainer?.status;
  const wcBusy =
    wcStatus === "booting" || wcStatus === "mounting" || wcStatus === "idle";
  const wcError = wcStatus === "error";

  return (
    <footer className="ws-chrome flex h-8 shrink-0 items-center justify-between gap-2 bg-ws-bg px-3 pb-1">
      <div className="flex min-w-0 items-center gap-1.5">
        {isGitHub ? (
          isPushing ? (
            <StatusChip>
              <Loader2Icon className="size-3 shrink-0 animate-spin" />
              <span className="truncate">{branch}</span>
            </StatusChip>
          ) : (
            <div className="[&_button]:h-6 [&_button]:rounded-full [&_button]:bg-ws-chip [&_button]:px-2.5 [&_button]:text-[11px]">
              <WorkspaceBranchPicker
                projectId={projectId}
                branch={branch}
                changeCount={changeCount}
                open={branchPickerOpen}
                onOpenChange={setBranchPickerOpen}
              />
            </div>
          )
        ) : (
          <StatusChip onClick={openGitInitDialog} title="Initialize Git repository">
            <GitBranchIcon className="size-3 shrink-0" />
            <span>Initialize Git</span>
          </StatusChip>
        )}

        <StatusChip
          onClick={showProblemsPanel}
          title="Problems (⌘⇧M)"
          active={problemsActive}
        >
          <span
            className={cn(
              "inline-flex items-center gap-1",
              errorCount > 0 ? "text-ws-danger-soft" : undefined,
            )}
          >
            <CircleXIcon className="size-3" />
            {errorCount}
          </span>
          <span
            className={cn(
              "inline-flex items-center gap-1",
              warningCount > 0 ? "text-amber-500" : undefined,
            )}
          >
            <CircleAlertIcon className="size-3" />
            {warningCount}
          </span>
        </StatusChip>

        <StatusChip
          onClick={() => setBottomPanelTab("terminal")}
          title={
            wcError
              ? (webcontainer?.error ??
                "WebContainer unavailable — open Terminal")
              : "Open Terminal · run npm install / npm install <pkg>"
          }
          className={cn(
            wcError && "text-ws-danger-soft",
            wcStatus === "ready" && "text-emerald-600 dark:text-emerald-400",
          )}
        >
          {wcBusy ? (
            <Loader2Icon className="size-3 shrink-0 animate-spin" />
          ) : (
            <PackageIcon className="size-3 shrink-0" />
          )}
          <span>{webContainerLabel(wcStatus)}</span>
        </StatusChip>

        {previewServer?.hot ? (
          <StatusChip
            className="text-emerald-600 dark:text-emerald-400"
            title={
              previewServer.commandLine
                ? `Hot reload · ${previewServer.commandLine}`
                : "Hot reload preview"
            }
          >
            <ZapIcon className="size-3 shrink-0" />
            <span>
              HMR
              {previewServer.port != null ? ` :${previewServer.port}` : ""}
            </span>
          </StatusChip>
        ) : previewServer?.status === "starting" ? (
          <StatusChip>
            <Loader2Icon className="size-3 shrink-0 animate-spin" />
            <span>Preview…</span>
          </StatusChip>
        ) : null}
      </div>

      <div className="flex items-center gap-1.5">
        {currentFilePath ? (
          <StatusChip className="hidden sm:inline-flex" title={currentFilePath}>
            <span className="truncate font-mono text-[10px]">
              {currentFilePath}
            </span>
          </StatusChip>
        ) : null}
        <StatusChip className="text-ws-text-secondary">{language}</StatusChip>
      </div>
    </footer>
  );
}
