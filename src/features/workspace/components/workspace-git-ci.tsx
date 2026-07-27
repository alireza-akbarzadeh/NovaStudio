/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import {
  CheckCircle2Icon,
  CircleDashedIcon,
  ExternalLinkIcon,
  Loader2Icon,
  RefreshCwIcon,
  XCircleIcon,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  GitHubDisabledPanel,
  GitHubHubErrorState,
  GitHubLoadingRow,
  formatGitHubDate,
} from "@/features/github/components/github-hub-ui";
import {
  useGitHubCi,
  type GitHubWorkflowRun,
} from "@/features/github/hooks/use-github-ci";
import { cn } from "@/lib/utils";

type WorkspaceGitCiProps = {
  projectId: string;
  enabled: boolean;
};

function RunStatusIcon({
  status,
  conclusion,
}: {
  status: string;
  conclusion: string | null;
}) {
  if (status === "completed") {
    if (conclusion === "success") {
      return <CheckCircle2Icon className="size-3.5 shrink-0 text-emerald-500" />;
    }
    if (conclusion === "failure" || conclusion === "cancelled") {
      return <XCircleIcon className="size-3.5 shrink-0 text-red-400" />;
    }
  }
  if (status === "in_progress" || status === "queued") {
    return <Loader2Icon className="size-3.5 shrink-0 animate-spin text-ws-link" />;
  }
  return <CircleDashedIcon className="size-3.5 shrink-0 text-ws-text-muted" />;
}

function runStatusLabel(status: string, conclusion: string | null) {
  if (status === "completed" && conclusion) {
    return conclusion.replace(/_/g, " ");
  }
  return status.replace(/_/g, " ");
}

export function WorkspaceGitCi({ projectId, enabled }: WorkspaceGitCiProps) {
  const { listWorkflowRuns, isListing } = useGitHubCi(projectId);
  const [runs, setRuns] = useState<GitHubWorkflowRun[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!enabled) return;
    setError(null);
    try {
      setRuns(await listWorkflowRuns());
    } catch (err) {
      setRuns(null);
      setError(err instanceof Error ? err.message : "Failed to load workflow runs");
    }
  }, [enabled, listWorkflowRuns]);

  useEffect(() => {
    if (!enabled) return;
    load().catch(console.error);
  }, [enabled, load]);

  if (!enabled) {
    return (
      <GitHubDisabledPanel message="Connect this project to GitHub to view Actions workflow runs." />
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex h-7 shrink-0 items-center justify-between border-b border-ws-border-subtle px-2">
        <span className="text-[11px] text-ws-text-muted">GitHub Actions</span>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          title="Refresh"
          aria-label="Refresh workflow runs"
          disabled={isListing}
          onClick={() => void load()}
          className="size-5 rounded-sm text-ws-text-muted hover:bg-ws-hover hover:text-ws-text"
        >
          <RefreshCwIcon className={cn("size-3", isListing && "animate-spin")} />
        </Button>
      </div>
      <div className="min-h-0 flex-1 overflow-auto">
        {isListing && runs === null ? (
          <GitHubLoadingRow label="Loading workflow runs…" />
        ) : error ? (
          <GitHubHubErrorState message={error} onRetry={() => void load()} />
        ) : runs && runs.length === 0 ? (
          <p className="px-3 py-4 text-[11px] text-ws-text-muted">
            No workflow runs found for this repository.
          </p>
        ) : (
          <ul className="space-y-0 p-1.5">
            {runs?.map((run) => (
              <li key={run.id}>
                <a
                  href={run.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex gap-2 rounded-sm px-2 py-1.5 transition-colors hover:bg-ws-hover"
                >
                  <RunStatusIcon status={run.status} conclusion={run.conclusion} />
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <div className="flex items-start gap-1">
                      <p className="min-w-0 flex-1 truncate text-[12px] text-ws-text">
                        {run.name}
                      </p>
                      <ExternalLinkIcon className="mt-0.5 size-3 shrink-0 text-ws-text-muted" />
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-[10px] text-ws-text-muted">
                      <span className="capitalize">
                        {runStatusLabel(run.status, run.conclusion)}
                      </span>
                      <span className="font-mono">#{run.runNumber}</span>
                      {run.headBranch ? (
                        <span className="font-mono">{run.headBranch}</span>
                      ) : null}
                      <span className="font-mono">{run.headSha}</span>
                      <span className="ml-auto shrink-0">
                        {formatGitHubDate(run.updatedAt)}
                      </span>
                    </div>
                  </div>
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
