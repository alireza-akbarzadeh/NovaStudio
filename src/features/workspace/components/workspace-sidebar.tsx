"use client";

import {
  WorkspaceSidebarUtilities,
  WorkspaceViewSwitcher,
} from "@/features/workspace/components/workspace-activity-bar";
import { WorkspaceDependenciesPanel } from "@/features/workspace/components/workspace-dependencies-panel";
import { WorkspaceExplorerPanel } from "@/features/workspace/components/workspace-explorer-panel";
import { WorkspaceExtensionsPanel } from "@/features/workspace/components/workspace-extensions-panel";
import { WorkspaceGitPanel } from "@/features/workspace/components/workspace-git-panel";
import { WorkspaceOutlinePanel } from "@/features/workspace/components/workspace-outline-panel";
import { WorkspaceSearchPanel } from "@/features/workspace/components/workspace-search-panel";
import {
  LEFT_PANEL_LABELS,
  useWorkspaceStore,
} from "@/features/workspace/store/workspace-store";

type WorkspaceSidebarProps = {
  projectId: string;
};

export function WorkspaceSidebar({ projectId }: WorkspaceSidebarProps) {
  const leftPanelView = useWorkspaceStore((s) => s.leftPanelView);

  return (
    <aside className="ws-chrome flex h-full min-w-0 flex-1 flex-col">
      <div className="shrink-0 border-b border-ws-border-subtle">
        <WorkspaceViewSwitcher />
        <div className="flex h-7 items-center px-3">
          <p className="text-[11px] font-semibold tracking-wide text-ws-text">
            {LEFT_PANEL_LABELS[leftPanelView]}
          </p>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-hidden">
        {leftPanelView === "explorer" ? (
          <WorkspaceExplorerPanel projectId={projectId} />
        ) : null}
        {leftPanelView === "search" ? (
          <WorkspaceSearchPanel projectId={projectId} />
        ) : null}
        {leftPanelView === "git" ? (
          <WorkspaceGitPanel projectId={projectId} />
        ) : null}
        {leftPanelView === "outline" ? <WorkspaceOutlinePanel /> : null}
        {leftPanelView === "dependencies" ? (
          <WorkspaceDependenciesPanel projectId={projectId} />
        ) : null}
        {leftPanelView === "extensions" ? <WorkspaceExtensionsPanel /> : null}
      </div>
      <WorkspaceSidebarUtilities />
    </aside>
  );
}
