"use client";

import {
  CheckCircle2Icon,
  Loader2Icon,
  SparklesIcon,
  XCircleIcon,
} from "lucide-react";
import { useConvex, useQuery } from "convex/react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import {
  LocalCliConnectButton,
  LocalCliConnectWizard,
} from "@/features/workspace/components/local-cli-connect-wizard";
import { useProjectAiAgentRuns } from "@/features/workspace/hooks/use-project-ai-agent-runs";
import { useAiPendingAppliesStore } from "@/features/workspace/store/ai-pending-applies-store";
import { AGENT_BACKEND_LABELS } from "@/lib/ai/agent-backends";
import type { LocalCliBridgeConfig } from "@/lib/ai/agent-bridge/local-cli-config";
import { cn } from "@/lib/utils";

type WorkspaceAiBackgroundRunsProps = {
  projectId: string;
  projectName?: string;
  onOpenSession?: (sessionClientId: string) => void;
  className?: string;
};

export function WorkspaceAiBackgroundRuns({
  projectId,
  projectName,
  onOpenSession,
  className,
}: WorkspaceAiBackgroundRunsProps) {
  const { activeRuns, reviewRuns, ready, cancel } = useProjectAiAgentRuns(
    projectId,
  );
  const bridgeRuns = useQuery(api.projectAiAgentRuns.listActiveBridgeRuns, {
    projectId: projectId as Id<"projects">,
  });
  const queuePendingApply = useAiPendingAppliesStore((s) => s.queue);
  const convex = useConvex();
  const [wizardOpen, setWizardOpen] = useState(false);
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);

  const origin =
    typeof window !== "undefined" ? window.location.origin : "";

  const wizardConfig = useMemo((): LocalCliBridgeConfig | null => {
    if (!bridgeRuns?.length) return null;
    const run =
      bridgeRuns.find((row) => row.runId === selectedRunId) ?? bridgeRuns[0];
    if (!run) return null;
    return {
      origin,
      runId: run.runId,
      jobToken: run.jobToken,
      projectName: projectName ?? run.title,
    };
  }, [bridgeRuns, origin, projectName, selectedRunId]);

  const openWizard = (runId: string) => {
    setSelectedRunId(runId);
    setWizardOpen(true);
  };

  if (!ready || (activeRuns.length === 0 && reviewRuns.length === 0)) {
    return (
      <>
        <LocalCliConnectWizard
          open={wizardOpen}
          onOpenChange={setWizardOpen}
          config={wizardConfig}
        />
      </>
    );
  }

  const applyPendingWrites = async (
    runId: string,
    writes: Array<{ path: string; content: string }>,
  ) => {
    for (const write of writes) {
      const existing = await convex.query(api.projectFiles.getByPath, {
        projectId: projectId as Id<"projects">,
        path: write.path,
      });
      const previousContent =
        existing?.kind === "file" ? (existing.content ?? "") : "";
      const isNew = !existing || existing.kind !== "file";
      queuePendingApply({
        projectId,
        path: write.path,
        previousContent,
        nextContent: write.content,
        isNew,
        toolCallId: `bg-run-${runId}-${write.path}`,
      });
    }
    toast.success(
      writes.length === 1
        ? "Queued 1 change for review"
        : `Queued ${writes.length} changes for review`,
    );
  };

  return (
    <>
      <div className={cn("space-y-2 border-b border-ws-border-subtle px-3 py-2", className)}>
        {activeRuns.map((run) => (
          <div
            key={run.id}
            className="flex items-start gap-2 rounded-lg border border-ws-border-subtle bg-ws-panel/60 px-2.5 py-2"
          >
            <Loader2Icon className="mt-0.5 size-3.5 shrink-0 animate-spin text-ws-accent-soft" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[11px] font-medium text-ws-text">
                {run.title}
              </p>
              <p className="text-[10px] text-ws-text-muted">
                {run.status === "queued" ? "Queued" : "Running in background"} ·{" "}
                {AGENT_BACKEND_LABELS[run.backend]?.label ?? run.backend}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-0.5">
              {bridgeRuns?.some((row) => row.runId === run.id) ? (
                <LocalCliConnectButton onClick={() => openWizard(run.id)} />
              ) : null}
              {run.status === "queued" ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="size-6 shrink-0 text-ws-text-muted"
                  aria-label="Cancel background run"
                  onClick={() => void cancel(run.id)}
                >
                  <XCircleIcon className="size-3.5" />
                </Button>
              ) : null}
            </div>
          </div>
        ))}

        {reviewRuns.map((run) => (
          <div
            key={run.id}
            className="flex items-start gap-2 rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-2"
          >
            <CheckCircle2Icon className="mt-0.5 size-3.5 shrink-0 text-emerald-400" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[11px] font-medium text-ws-text">
                {run.title}
              </p>
              <p className="text-[10px] text-ws-text-muted">
                {run.pendingWrites.length} file change
                {run.pendingWrites.length === 1 ? "" : "s"} ready
              </p>
            </div>
            <div className="flex shrink-0 gap-1">
              {run.sessionClientId && onOpenSession ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-[10px]"
                  onClick={() => onOpenSession(run.sessionClientId!)}
                >
                  Open
                </Button>
              ) : null}
              <Button
                type="button"
                size="sm"
                className="h-6 bg-ws-accent px-2 text-[10px] text-white hover:bg-ws-accent-hover"
                onClick={() =>
                  void applyPendingWrites(run.id, run.pendingWrites)
                }
              >
                Review
              </Button>
            </div>
          </div>
        ))}

        {activeRuns.length > 0 ? (
          <p className="flex items-center gap-1 text-[10px] text-ws-text-muted">
            <SparklesIcon className="size-3" />
            Keep editing — use Connect CLI to wire a local agent to this run.
          </p>
        ) : null}
      </div>

      <LocalCliConnectWizard
        open={wizardOpen}
        onOpenChange={setWizardOpen}
        config={wizardConfig}
      />
    </>
  );
}
