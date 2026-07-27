"use client";

import {
  DiffIcon,
  FilesIcon,
  SparklesIcon,
} from "lucide-react";
import type { ReactNode } from "react";

import { WorkspaceChangeList } from "@/features/workspace/components/workspace-change-list";
import { ProjectFileNavigatorTree } from "@/features/workspace/components/file-navigator";
import { WorkspaceGitReviews } from "@/features/workspace/components/workspace-git-reviews";
import {
  useWorkspaceStore,
  type ExplorerTab,
} from "@/features/workspace/store/workspace-store";
import { cn } from "@/lib/utils";

type WorkspaceExplorerPanelProps = {
  projectId: string;
};

const EXPLORER_TABS: {
  id: ExplorerTab;
  label: string;
  icon: ReactNode;
}[] = [
  {
    id: "project",
    label: "Project",
    icon: <FilesIcon className="size-3.5" strokeWidth={1.75} />,
  },
  {
    id: "changes",
    label: "Changes",
    icon: <DiffIcon className="size-3.5" strokeWidth={1.75} />,
  },
  {
    id: "quality",
    label: "Quality",
    icon: <SparklesIcon className="size-3.5" strokeWidth={1.75} />,
  },
];

export function WorkspaceExplorerPanel({ projectId }: WorkspaceExplorerPanelProps) {
  const activeTab = useWorkspaceStore((s) => s.explorerTab);
  const setExplorerTab = useWorkspaceStore((s) => s.setExplorerTab);

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-9 shrink-0 items-center gap-1 border-b border-ws-border-subtle px-2">
        {EXPLORER_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setExplorerTab(tab.id)}
            className={cn(
              "inline-flex h-7 items-center gap-1.5 rounded-lg px-2.5 text-[11px] font-medium transition-colors",
              activeTab === tab.id
                ? "bg-ws-accent/15 text-ws-text shadow-[inset_0_0_0_1px] shadow-ws-accent/35"
                : "text-ws-text-muted hover:bg-ws-hover hover:text-ws-text",
            )}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="relative min-h-0 flex-1 overflow-hidden">
        {activeTab === "project" ? (
          <ProjectFileNavigatorTree projectId={projectId} />
        ) : null}
        {activeTab === "changes" ? (
          <div className="h-full overflow-auto">
            <WorkspaceChangeList
              projectId={projectId}
              emptyMessage="No local changes since last GitHub sync"
            />
          </div>
        ) : null}
        {activeTab === "quality" ? (
          <WorkspaceGitReviews projectId={projectId} enabled />
        ) : null}
      </div>
    </div>
  );
}
