"use client";

import { useState } from "react";

import { WorkspaceChangeList } from "@/features/workspace/components/workspace-change-list";
import { WorkspaceFileTree } from "@/features/workspace/components/workspace-file-tree";
import { cn } from "@/lib/utils";

type ExplorerTab = "project" | "changes";

type WorkspaceExplorerPanelProps = {
  projectId: string;
};

const EXPLORER_TABS: { id: ExplorerTab; label: string }[] = [
  { id: "project", label: "Project" },
  { id: "changes", label: "Changes" },
];

export function WorkspaceExplorerPanel({ projectId }: WorkspaceExplorerPanelProps) {
  const [activeTab, setActiveTab] = useState<ExplorerTab>("project");

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-9 shrink-0 items-center gap-1 border-b border-ws-border-subtle px-2">
        {EXPLORER_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "inline-flex h-7 items-center rounded-lg px-2.5 text-[11px] font-medium transition-colors",
              activeTab === tab.id
                ? "bg-ws-accent/15 text-ws-text shadow-[inset_0_0_0_1px] shadow-ws-accent/35"
                : "text-ws-text-muted hover:bg-ws-hover hover:text-ws-text",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="min-h-0 flex-1 overflow-hidden">
        {activeTab === "project" ? (
          <WorkspaceFileTree projectId={projectId} />
        ) : (
          <div className="h-full overflow-auto">
            <WorkspaceChangeList
              projectId={projectId}
              emptyMessage="No local changes since last GitHub sync"
            />
          </div>
        )}
      </div>
    </div>
  );
}
