"use client";

import { useMutation, useQuery } from "convex/react";
import { useCallback } from "react";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

export type ProjectAiAgentRun = {
  id: string;
  sessionClientId?: string;
  status: "queued" | "running" | "completed" | "failed" | "cancelled";
  prompt: string;
  title: string;
  mode: "plan" | "task";
  model: string;
  backend: "novastudio" | "cursor-cli" | "openclaw" | "cursor-cloud";
  outputText?: string;
  pendingWrites: Array<{ path: string; content: string }>;
  error?: string;
  createdByUserId: string;
  createdByName?: string;
  createdAt: number;
  updatedAt: number;
  startedAt?: number;
  completedAt?: number;
};

export function useProjectAiAgentRuns(projectId: string) {
  const convexProjectId = projectId as Id<"projects">;
  const rows = useQuery(api.projectAiAgentRuns.listForProject, {
    projectId: convexProjectId,
    limit: 30,
  });
  const cancelRun = useMutation(api.projectAiAgentRuns.cancel);

  const runs = (rows ?? []) as ProjectAiAgentRun[];

  const activeRuns = runs.filter(
    (run) => run.status === "queued" || run.status === "running",
  );
  const reviewRuns = runs.filter(
    (run) =>
      run.status === "completed" &&
      run.pendingWrites.length > 0,
  );

  const cancel = useCallback(
    (runId: string) => cancelRun({ runId: runId as Id<"projectAiAgentRuns"> }),
    [cancelRun],
  );

  return {
    runs,
    activeRuns,
    reviewRuns,
    ready: rows !== undefined,
    cancel,
  };
}
