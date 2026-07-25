"use client";

import {
  CircleAlertIcon,
  CircleXIcon,
  GitBranchIcon,
  Loader2Icon,
  PackageIcon,
  ZapIcon,
} from "lucide-react";

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

function webContainerLabel(status: string | undefined): string {
  switch (status) {
    case "booting":
    case "mounting":
    case "idle":
      return "Node: starting…";
    case "ready":
      return "Node: ready";
    case "error":
      return "Node: offline";
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
    <footer className="flex h-[22px] shrink-0 items-center justify-between border-t border-ws-border-subtle bg-ws-panel px-2 text-[11px] text-ws-text-muted">
      <div className="flex min-w-0 items-center gap-2">
        {isGitHub ? (
          isPushing ? (
            <span className="inline-flex max-w-[220px] items-center gap-1.5 truncate px-1.5 py-0.5">
              <Loader2Icon className="size-3 shrink-0 animate-spin" />
              <span className="truncate">{branch}</span>
            </span>
          ) : (
            <WorkspaceBranchPicker
              projectId={projectId}
              branch={branch}
              changeCount={changeCount}
              open={branchPickerOpen}
              onOpenChange={setBranchPickerOpen}
            />
          )
        ) : (
          <button
            type="button"
            onClick={openGitInitDialog}
            className="inline-flex items-center gap-1.5 rounded-sm px-1.5 py-0.5 text-ws-text-muted transition-colors hover:bg-ws-hover hover:text-ws-text"
            title="Initialize Git repository"
          >
            <GitBranchIcon className="size-3 shrink-0" />
            <span>Initialize Repository</span>
          </button>
        )}

        <button
          type="button"
          onClick={showProblemsPanel}
          title="Problems (⌘⇧M)"
          className={cn(
            "inline-flex items-center gap-2 rounded-sm px-1.5 py-0.5 transition-colors hover:bg-ws-hover hover:text-ws-text",
            problemsActive && "bg-ws-hover text-ws-text",
          )}
        >
          <span
            className={cn(
              "inline-flex items-center gap-1",
              errorCount > 0 ? "text-ws-danger-soft" : "text-ws-text-muted",
            )}
          >
            <CircleXIcon className="size-3" />
            {errorCount}
          </span>
          <span
            className={cn(
              "inline-flex items-center gap-1",
              warningCount > 0 ? "text-amber-500" : "text-ws-text-muted",
            )}
          >
            <CircleAlertIcon className="size-3" />
            {warningCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setBottomPanelTab("terminal")}
          title={
            wcError
              ? (webcontainer?.error ??
                "WebContainer unavailable — open Terminal")
              : "Open Terminal · run npm install / npm install <pkg>"
          }
          className={cn(
            "inline-flex items-center gap-1.5 rounded-sm px-1.5 py-0.5 transition-colors hover:bg-ws-hover hover:text-ws-text",
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
        </button>

        {previewServer?.hot ? (
          <span
            className="inline-flex items-center gap-1 rounded-sm px-1.5 py-0.5 text-emerald-600 dark:text-emerald-400"
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
          </span>
        ) : previewServer?.status === "starting" ? (
          <span className="inline-flex items-center gap-1.5 rounded-sm px-1.5 py-0.5">
            <Loader2Icon className="size-3 shrink-0 animate-spin" />
            <span>Preview…</span>
          </span>
        ) : null}
      </div>

      <div className="flex items-center gap-3">
        {currentFilePath ? (
          <span
            className="hidden truncate sm:inline"
            title={currentFilePath}
          >
            {currentFilePath}
          </span>
        ) : null}
        <span className="shrink-0 px-1.5 text-ws-text-secondary">{language}</span>
        <span className="hidden shrink-0 sm:inline">UTF-8</span>
        <span className="hidden shrink-0 sm:inline">Spaces: 2</span>
      </div>
    </footer>
  );
}
