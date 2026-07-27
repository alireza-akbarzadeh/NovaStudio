/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import {
  GitPullRequestIcon,
  Loader2Icon,
  PlusIcon,
  RefreshCwIcon,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useGitBranches } from "@/features/github/hooks/use-git-sync";
import {
  useGitHubPullRequests,
  type GitHubPullRequestSummary,
  type PullRequestStateFilter,
} from "@/features/github/hooks/use-github-pull-requests";
import {
  GitHubDisabledPanel,
  GitHubHubErrorState,
  GitHubHubToolbar,
  GitHubLoadingRow,
  GitHubStateFilterBar,
  formatGitHubDate,
} from "@/features/github/components/github-hub-ui";
import { useProject } from "@/features/projects/hooks/use-projects";
import { useEditorTabs } from "@/features/workspace/hooks/use-editor-tabs";
import { cn } from "@/lib/utils";

type WorkspaceGitPullRequestsProps = {
  projectId: string;
  enabled: boolean;
};

type View = { kind: "list" } | { kind: "create" };

function PullRequestBadge({
  state,
  draft,
  merged,
}: {
  state: "open" | "closed";
  draft: boolean;
  merged: boolean;
}) {
  if (merged) {
    return (
      <span className="rounded-full bg-violet-500/15 px-1.5 py-0.5 text-[9px] font-medium text-violet-500 uppercase">
        Merged
      </span>
    );
  }
  if (draft) {
    return (
      <span className="rounded-full bg-ws-text-muted/15 px-1.5 py-0.5 text-[9px] font-medium text-ws-text-muted uppercase">
        Draft
      </span>
    );
  }
  return (
    <span
      className={cn(
        "rounded-full px-1.5 py-0.5 text-[9px] font-medium uppercase",
        state === "open"
          ? "bg-emerald-500/15 text-emerald-500"
          : "bg-ws-text-muted/15 text-ws-text-muted",
      )}
    >
      {state}
    </span>
  );
}

export function WorkspaceGitPullRequests({
  projectId,
  enabled,
}: WorkspaceGitPullRequestsProps) {
  const project = useProject({ projectId });
  const { openTab } = useEditorTabs(projectId);
  const { loadBranches } = useGitBranches(projectId);
  const { listPullRequests, createPullRequest, isListing, isCreating } =
    useGitHubPullRequests(projectId);

  const [view, setView] = useState<View>({ kind: "list" });
  const [stateFilter, setStateFilter] = useState<PullRequestStateFilter>("open");
  const [pulls, setPulls] = useState<GitHubPullRequestSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [branches, setBranches] = useState<string[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [newBody, setNewBody] = useState("");
  const [headBranch, setHeadBranch] = useState("");
  const [baseBranch, setBaseBranch] = useState("main");

  const currentBranch = project?.githubBranch ?? "main";

  const openPullRequest = useCallback(
    (pullNumber: number) => {
      openTab({ kind: "pull-request", pullNumber });
    },
    [openTab],
  );

  const loadList = useCallback(async () => {
    if (!enabled) return;
    setError(null);
    try {
      setPulls(await listPullRequests(stateFilter));
    } catch (err) {
      setPulls(null);
      setError(
        err instanceof Error ? err.message : "Failed to load pull requests",
      );
    }
  }, [enabled, listPullRequests, stateFilter]);

  useEffect(() => {
    if (!enabled || view.kind !== "list") return;
    loadList().catch(console.error);
  }, [enabled, loadList, view.kind]);

  useEffect(() => {
    if (!enabled || view.kind !== "create") return;
    setHeadBranch(currentBranch);
    void loadBranches()
      .then((rows) => setBranches(rows.map((row) => row.name)))
      .catch(() => setBranches([]));
  }, [currentBranch, enabled, loadBranches, view.kind]);

  const onCreate = async () => {
    if (!newTitle.trim() || !headBranch || !baseBranch) return;
    try {
      const pr = await createPullRequest({
        title: newTitle.trim(),
        head: headBranch,
        base: baseBranch,
        body: newBody.trim() || undefined,
      });
      setNewTitle("");
      setNewBody("");
      setView({ kind: "list" });
      openPullRequest(pr.number);
    } catch {
      // toast in hook
    }
  };

  if (!enabled) {
    return (
      <GitHubDisabledPanel message="Connect this project to GitHub to view pull requests." />
    );
  }

  if (view.kind === "create") {
    const headOptions =
      branches.length > 0 ? branches : [currentBranch];
    const baseOptions = (
      branches.length > 0 ? branches : ["main", currentBranch]
    ).filter((name, index, array) => array.indexOf(name) === index);

    return (
      <div className="flex h-full min-h-0 flex-col">
        <GitHubHubToolbar
          title="New pull request"
          onBack={() => setView({ kind: "list" })}
        />
        <div className="min-h-0 flex-1 space-y-3 overflow-auto p-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-[10px] text-ws-text-muted uppercase">
                Head
              </label>
              <WorkspaceGitSelect
                value={headBranch}
                onValueChange={setHeadBranch}
                options={headOptions}
                placeholder="Select head branch"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-ws-text-muted uppercase">
                Base
              </label>
              <WorkspaceGitSelect
                value={baseBranch}
                onValueChange={setBaseBranch}
                options={baseOptions}
                placeholder="Select base branch"
              />
            </div>
          </div>
          <Input
            value={newTitle}
            onChange={(event) => setNewTitle(event.target.value)}
            placeholder="Pull request title"
            className="h-8 border-ws-border bg-ws-bg text-[12px] text-ws-text"
          />
          <Textarea
            value={newBody}
            onChange={(event) => setNewBody(event.target.value)}
            placeholder="Description (optional)"
            rows={6}
            className="min-h-24 resize-none border-ws-border bg-ws-bg text-[12px] text-ws-text"
          />
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              disabled={
                !newTitle.trim() ||
                !headBranch ||
                !baseBranch ||
                headBranch === baseBranch ||
                isCreating
              }
              onClick={() => void onCreate()}
              className="h-7 bg-ws-accent text-[11px] text-white hover:bg-ws-accent-hover"
            >
              {isCreating ? (
                <>
                  <Loader2Icon className="size-3.5 animate-spin" />
                  Creating…
                </>
              ) : (
                "Create pull request"
              )}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setView({ kind: "list" })}
              className="h-7 border-ws-border bg-ws-bg text-[11px] text-ws-text hover:bg-ws-hover"
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex h-7 shrink-0 items-center justify-between border-b border-ws-border-subtle px-2">
        <GitHubStateFilterBar value={stateFilter} onChange={setStateFilter} />
        <div className="flex items-center gap-0.5">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            title="New pull request"
            aria-label="New pull request"
            onClick={() => setView({ kind: "create" })}
            className="size-5 rounded-sm text-ws-text-muted hover:bg-ws-hover hover:text-ws-text"
          >
            <PlusIcon className="size-3" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            title="Refresh"
            aria-label="Refresh pull requests"
            disabled={isListing}
            onClick={() => void loadList()}
            className="size-5 rounded-sm text-ws-text-muted hover:bg-ws-hover hover:text-ws-text"
          >
            <RefreshCwIcon
              className={cn("size-3", isListing && "animate-spin")}
            />
          </Button>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-auto">
        {isListing && pulls === null ? (
          <GitHubLoadingRow label="Loading pull requests…" />
        ) : error ? (
          <GitHubHubErrorState message={error} onRetry={() => void loadList()} />
        ) : pulls && pulls.length === 0 ? (
          <div className="space-y-3 px-3 py-4">
            <p className="text-[11px] text-ws-text-muted">
              No {stateFilter === "all" ? "" : `${stateFilter} `}pull requests
              found.
            </p>
            <Button
              type="button"
              size="sm"
              onClick={() => setView({ kind: "create" })}
              className="h-7 bg-ws-accent text-[11px] text-white hover:bg-ws-accent-hover"
            >
              <PlusIcon className="size-3.5" />
              Create pull request
            </Button>
          </div>
        ) : (
          <ul className="space-y-0 p-1.5">
            {pulls?.map((pr) => (
              <li key={pr.number}>
                <button
                  type="button"
                  onClick={() => openPullRequest(pr.number)}
                  className="flex w-full gap-2 rounded-sm px-2 py-1.5 text-left transition-colors hover:bg-ws-hover"
                >
                  <GitPullRequestIcon
                    className={cn(
                      "mt-0.5 size-3 shrink-0",
                      pr.merged
                        ? "text-violet-500"
                        : pr.state === "open"
                          ? "text-emerald-500"
                          : "text-ws-text-muted",
                    )}
                  />
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <div className="flex items-start gap-1.5">
                      <span className="shrink-0 font-mono text-[10px] text-ws-link">
                        #{pr.number}
                      </span>
                      <p className="min-w-0 flex-1 text-[12px] leading-snug text-ws-text">
                        {pr.title}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-ws-text-muted">
                      <PullRequestBadge
                        state={pr.state}
                        draft={pr.draft}
                        merged={pr.merged}
                      />
                      <span className="font-mono">
                        {pr.headBranch} → {pr.baseBranch}
                      </span>
                      <span className="ml-auto shrink-0">
                        {formatGitHubDate(pr.updatedAt)}
                      </span>
                    </div>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <p className="shrink-0 border-t border-ws-border-subtle px-3 py-2 text-[10px] text-ws-text-muted">
        Opens in the editor for side-by-side diffs and line comments.
      </p>
    </div>
  );
}

function WorkspaceGitSelect({
  value,
  onValueChange,
  options,
  placeholder,
}: {
  value: string;
  onValueChange: (value: string) => void;
  options: string[];
  placeholder?: string;
}) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger
        size="sm"
        className="h-8 w-full border-ws-border bg-ws-bg text-[11px] text-ws-text shadow-none"
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent position="popper" className="z-[100]">
        {options.map((option) => (
          <SelectItem key={option} value={option} className="font-mono text-[11px]">
            {option}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
