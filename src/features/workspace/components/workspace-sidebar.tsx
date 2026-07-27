"use client";

import type { ReactNode } from "react";

import { WorkspaceActivityPanel } from "@/features/workspace/components/workspace-activity-panel";
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
import { cn } from "@/lib/utils";

type WorkspaceSidebarProps = {
  projectId: string;
};

function KeepAlivePanel({
  active,
  children,
}: {
  active: boolean;
  children: ReactNode;
}) {
  return (
    <div className={cn("h-full min-h-0", !active && "hidden")}>{children}</div>
  );
}

export function WorkspaceSidebar({ projectId }: WorkspaceSidebarProps) {
  const leftPanelView = useWorkspaceStore((s) => s.leftPanelView);

  return (
    <aside className="ws-chrome flex h-full min-w-0 flex-1 flex-col">
      <div className="flex h-9 shrink-0 items-center border-b border-ws-border-subtle px-3">
        <p className="text-[11px] font-semibold tracking-wide text-ws-text">
          {LEFT_PANEL_LABELS[leftPanelView]}
        </p>
      </div>
      <div className="relative min-h-0 flex-1 overflow-hidden">
        <KeepAlivePanel active={leftPanelView === "explorer"}>
          <WorkspaceExplorerPanel projectId={projectId} />
        </KeepAlivePanel>
        <KeepAlivePanel active={leftPanelView === "search"}>
          <WorkspaceSearchPanel projectId={projectId} />
        </KeepAlivePanel>
        {leftPanelView === "git" ? (
          <WorkspaceGitPanel projectId={projectId} />
        ) : null}
        {leftPanelView === "outline" ? <WorkspaceOutlinePanel /> : null}
        {leftPanelView === "dependencies" ? (
          <WorkspaceDependenciesPanel projectId={projectId} />
        ) : null}
        {leftPanelView === "extensions" ? <WorkspaceExtensionsPanel /> : null}
        {leftPanelView === "activity" ? (
          <WorkspaceActivityPanel projectId={projectId} />
        ) : null}
      </div>
    </aside>
  );
}
