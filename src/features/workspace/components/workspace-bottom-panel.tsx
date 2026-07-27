"use client";

import {
  BugIcon,
  CircleAlertIcon,
  CircleXIcon,
  GaugeIcon,
  SquareTerminalIcon,
} from "lucide-react";

import { WorkspaceDebugPanel } from "@/features/workspace/components/workspace-debug-panel";
import { WorkspacePerformancePanel } from "@/features/workspace/components/workspace-performance-panel";
import { WorkspaceProblemsPanel } from "@/features/workspace/components/workspace-problems-panel";
import { WorkspaceTerminalPanel } from "@/features/workspace/components/workspace-terminal-panel";
import { useMonacoProblems } from "@/features/workspace/hooks/use-monaco-problems";
import { IS_DEV } from "@/features/workspace/lib/is-dev";
import { useDebugStore } from "@/features/workspace/store/debug-store";
import {
  useWorkspaceStore,
  type BottomPanelTab,
} from "@/features/workspace/store/workspace-store";
import { cn } from "@/lib/utils";

type WorkspaceBottomPanelProps = {
  projectId: string;
};

const TABS: { id: BottomPanelTab; label: string }[] = [
  { id: "problems", label: "Problems" },
  { id: "debug", label: "Debug" },
  ...(IS_DEV ? [{ id: "performance" as const, label: "Performance" }] : []),
  { id: "terminal", label: "Terminal" },
];

export function WorkspaceBottomPanel({ projectId }: WorkspaceBottomPanelProps) {
  const activeTab = useWorkspaceStore((s) => s.bottomPanelTab);
  const setBottomPanelTab = useWorkspaceStore((s) => s.setBottomPanelTab);
  const { errorCount, warningCount } = useMonacoProblems();
  const problemBadge = errorCount + warningCount;
  const bpCount = useDebugStore((s) =>
    Object.values(s.breakpointsByPath).reduce((n, lines) => n + lines.length, 0),
  );

  return (
    <div className="flex h-full min-h-0 flex-col bg-ws-panel">
      <div className="flex h-9 shrink-0 items-center gap-1 border-b border-ws-border-subtle px-2">
        {TABS.map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setBottomPanelTab(tab.id)}
              className={cn(
                "inline-flex h-7 items-center gap-1.5 rounded-lg px-2.5 text-[11px] font-medium transition-colors",
                active
                  ? "bg-ws-accent/15 text-ws-text shadow-[inset_0_0_0_1px] shadow-ws-accent/35"
                  : "text-ws-text-muted hover:bg-ws-hover hover:text-ws-text",
              )}
            >
              {tab.id === "terminal" ? (
                <SquareTerminalIcon className="size-3 opacity-70" />
              ) : tab.id === "debug" ? (
                <BugIcon className="size-3 opacity-70" />
              ) : tab.id === "performance" ? (
                <GaugeIcon className="size-3 opacity-70" />
              ) : errorCount > 0 ? (
                <CircleXIcon className="size-3 text-ws-danger-soft" />
              ) : warningCount > 0 ? (
                <CircleAlertIcon className="size-3 text-amber-500" />
              ) : null}
              {tab.label}
              {tab.id === "problems" && problemBadge > 0 ? (
                <span
                  className={cn(
                    "rounded-full px-1.5 text-[9px] text-white",
                    errorCount > 0 ? "bg-ws-danger-bg" : "bg-amber-500",
                  )}
                >
                  {problemBadge}
                </span>
              ) : null}
              {tab.id === "debug" && bpCount > 0 ? (
                <span className="rounded-full bg-ws-danger-bg px-1.5 text-[9px] text-white">
                  {bpCount}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      <div className="relative min-h-0 flex-1">
        {/* Keep the terminal mounted so switching tabs does not reset the shell. */}
        <div
          className={cn(
            "absolute inset-0",
            activeTab !== "terminal" && "pointer-events-none invisible",
          )}
          aria-hidden={activeTab !== "terminal"}
        >
          <WorkspaceTerminalPanel projectId={projectId} />
        </div>
        {activeTab === "problems" ? (
          <div className="absolute inset-0">
            <WorkspaceProblemsPanel projectId={projectId} />
          </div>
        ) : null}
        {activeTab === "debug" ? (
          <div className="absolute inset-0">
            <WorkspaceDebugPanel projectId={projectId} />
          </div>
        ) : null}
        {IS_DEV && activeTab === "performance" ? (
          <div className="absolute inset-0">
            <WorkspacePerformancePanel projectId={projectId} />
          </div>
        ) : null}
      </div>
    </div>
  );
}
