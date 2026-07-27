/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import {
  CheckIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  GitPullRequestIcon,
  Loader2Icon,
  PlusIcon,
  RefreshCwIcon,
  XIcon,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useGitBranches } from "@/features/github/hooks/use-git-sync";
import {
  useGitHubPullRequests,
  type GitHubPullRequestDetail,
  type GitHubPullRequestSummary,
  type PullRequestMergeMethod,
  type PullRequestStateFilter,
} from "@/features/github/hooks/use-github-pull-requests";
import {
  GitHubAuthorAvatar,
  GitHubCommentList,
  GitHubDisabledPanel,
  GitHubHubErrorState,
  GitHubHubToolbar,
  GitHubLoadingRow,
  GitHubReplyBox,
  GitHubStateFilterBar,
  formatGitHubDate,
} from "@/features/github/components/github-hub-ui";
import { useProject } from "@/features/projects/hooks/use-projects";
import { cn } from "@/lib/utils";

type WorkspaceGitPullRequestsProps = {
  projectId: string;
  enabled: boolean;
};

type View =
  | { kind: "list" }
  | { kind: "detail"; pullNumber: number }
  | { kind: "create" };

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

function ReviewStateBadge({ state }: { state: string }) {
  const normalized = state.toUpperCase();
  const className =
    normalized === "APPROVED"
      ? "bg-emerald-500/15 text-emerald-500"
      : normalized === "CHANGES_REQUESTED"
        ? "bg-orange-500/15 text-orange-400"
        : "bg-ws-text-muted/15 text-ws-text-muted";

  return (
    <span
      className={cn(
        "rounded-full px-1.5 py-0.5 text-[9px] font-medium uppercase",
        className,
      )}
    >
      {state.replace(/_/g, " ").toLowerCase()}
    </span>
  );
}

function FileStatusBadge({ status }: { status: string }) {
  const className =
    status === "added"
      ? "text-emerald-500"
      : status === "removed"
        ? "text-red-400"
        : status === "renamed"
          ? "text-violet-400"
          : "text-ws-text-muted";

  return (
    <span className={cn("text-[9px] font-medium uppercase", className)}>
      {status}
    </span>
  );
}

function PullRequestFileRow({
  file,
}: {
  file: GitHubPullRequestDetail["files"][number];
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <li className="rounded-md border border-ws-border/70 bg-ws-panel/40">
      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        className="flex w-full items-center gap-2 px-2.5 py-2 text-left"
      >
        {expanded ? (
          <ChevronDownIcon className="size-3 shrink-0 text-ws-text-muted" />
        ) : (
          <ChevronRightIcon className="size-3 shrink-0 text-ws-text-muted" />
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate font-mono text-[11px] text-ws-text">
            {file.filename}
          </p>
          {file.previousFilename ? (
            <p className="truncate font-mono text-[10px] text-ws-text-muted">
              renamed from {file.previousFilename}
            </p>
          ) : null}
        </div>
        <FileStatusBadge status={file.status} />
        <span className="text-[10px] text-emerald-500">+{file.additions}</span>
        <span className="text-[10px] text-red-400">−{file.deletions}</span>
      </button>
      {expanded && file.patch ? (
        <pre className="max-h-64 overflow-auto border-t border-ws-border/70 bg-ws-bg/80 p-2 font-mono text-[10px] leading-relaxed whitespace-pre-wrap text-ws-text-secondary">
          {file.patch}
        </pre>
      ) : expanded ? (
        <p className="border-t border-ws-border/70 px-2.5 py-2 text-[10px] text-ws-text-muted italic">
          No patch available (binary or too large).
        </p>
      ) : null}
    </li>
  );
}

export function WorkspaceGitPullRequests({
  projectId,
  enabled,
}: WorkspaceGitPullRequestsProps) {
  const project = useProject({ projectId });
  const { loadBranches } = useGitBranches(projectId);
  const {
    listPullRequests,
    getPullRequest,
    createPullRequest,
    createComment,
    submitReview,
    mergePullRequest,
    isListing,
    isLoadingDetail,
    isCreating,
    isCommenting,
    isReviewing,
    isMerging,
  } = useGitHubPullRequests(projectId);

  const [view, setView] = useState<View>({ kind: "list" });
  const [stateFilter, setStateFilter] = useState<PullRequestStateFilter>("open");
  const [pulls, setPulls] = useState<GitHubPullRequestSummary[] | null>(null);
  const [detail, setDetail] = useState<GitHubPullRequestDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [replyBody, setReplyBody] = useState("");
  const [reviewBody, setReviewBody] = useState("");
  const [mergeMethod, setMergeMethod] =
    useState<PullRequestMergeMethod>("merge");

  const [branches, setBranches] = useState<string[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [newBody, setNewBody] = useState("");
  const [headBranch, setHeadBranch] = useState("");
  const [baseBranch, setBaseBranch] = useState("main");

  const currentBranch = project?.githubBranch ?? "main";

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

  const loadDetail = useCallback(
    async (pullNumber: number) => {
      if (!enabled) return;
      setError(null);
      setDetail(null);
      try {
        setDetail(await getPullRequest(pullNumber));
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load pull request",
        );
      }
    },
    [enabled, getPullRequest],
  );

  useEffect(() => {
    if (!enabled || view.kind !== "list") return;
    loadList().catch(console.error);
  }, [enabled, loadList, view.kind]);

  useEffect(() => {
    if (!enabled || view.kind !== "detail") return;
    loadDetail(view.pullNumber).catch(console.error);
  }, [enabled, loadDetail, view]);

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
      setView({ kind: "detail", pullNumber: pr.number });
    } catch {
      // toast in hook
    }
  };

  const onReview = async (event: "APPROVE" | "REQUEST_CHANGES") => {
    if (!detail) return;
    try {
      const review = await submitReview(
        detail.number,
        event,
        reviewBody.trim() || undefined,
      );
      setReviewBody("");
      setDetail((current) =>
        current
          ? { ...current, reviews: [...current.reviews, review] }
          : current,
      );
    } catch {
      // toast in hook
    }
  };

  const onMerge = async () => {
    if (!detail) return;
    try {
      await mergePullRequest(detail.number, mergeMethod);
      await loadDetail(detail.number);
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
              <select
                value={headBranch}
                onChange={(event) => setHeadBranch(event.target.value)}
                className="h-8 w-full rounded-md border border-ws-border bg-ws-bg px-2 text-[11px] text-ws-text"
              >
                {(branches.length > 0 ? branches : [currentBranch]).map(
                  (name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ),
                )}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-ws-text-muted uppercase">
                Base
              </label>
              <select
                value={baseBranch}
                onChange={(event) => setBaseBranch(event.target.value)}
                className="h-8 w-full rounded-md border border-ws-border bg-ws-bg px-2 text-[11px] text-ws-text"
              >
                {(branches.length > 0 ? branches : ["main", currentBranch])
                  .filter((name, index, array) => array.indexOf(name) === index)
                  .map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
              </select>
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

  if (view.kind === "detail") {
    const canMerge =
      detail &&
      detail.state === "open" &&
      !detail.merged &&
      detail.mergeable !== false &&
      detail.mergeableState !== "dirty";

    const canReview = detail && detail.state === "open" && !detail.merged;

    return (
      <div className="flex h-full min-h-0 flex-col">
        <GitHubHubToolbar
          title={detail ? `PR #${detail.number}` : "Pull request"}
          onBack={() => {
            setView({ kind: "list" });
            setDetail(null);
          }}
          onRefresh={() =>
            void loadDetail(detail?.number ?? view.pullNumber)
          }
          isRefreshing={isLoadingDetail}
          externalUrl={detail?.url}
        />
        <div className="min-h-0 flex-1 overflow-auto">
          {isLoadingDetail && !detail ? (
            <GitHubLoadingRow label="Loading pull request…" />
          ) : error && !detail ? (
            <GitHubHubErrorState
              message={error}
              onRetry={() => void loadDetail(view.pullNumber)}
            />
          ) : detail ? (
            <div className="space-y-3 p-3">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <PullRequestBadge
                    state={detail.state}
                    draft={detail.draft}
                    merged={detail.merged}
                  />
                  <span className="font-mono text-[10px] text-ws-text-muted">
                    {detail.headBranch} → {detail.baseBranch}
                  </span>
                </div>
                <h3 className="text-[13px] font-medium leading-snug text-ws-text">
                  {detail.title}
                </h3>
                <div className="flex items-center gap-2 text-[10px] text-ws-text-muted">
                  <GitHubAuthorAvatar
                    login={detail.authorLogin}
                    avatarUrl={detail.authorAvatarUrl}
                  />
                  <span>{detail.authorLogin}</span>
                  <span>· {formatGitHubDate(detail.createdAt)}</span>
                </div>
                <div className="flex gap-3 text-[10px] text-ws-text-muted">
                  <span className="text-emerald-500">+{detail.additions}</span>
                  <span className="text-red-400">−{detail.deletions}</span>
                  <span>{detail.changedFiles} files</span>
                  {detail.mergeable === false ? (
                    <span className="text-orange-400">Conflicts</span>
                  ) : null}
                  {detail.mergeableState &&
                  detail.mergeableState !== "clean" &&
                  detail.mergeableState !== "unknown" ? (
                    <span className="capitalize">{detail.mergeableState}</span>
                  ) : null}
                </div>
                {detail.body ? (
                  <div className="rounded-md border border-ws-border/70 bg-ws-stage/30 p-2.5 text-[12px] leading-relaxed whitespace-pre-wrap text-ws-text-secondary">
                    {detail.body}
                  </div>
                ) : null}
              </div>

              {canReview ? (
                <div className="space-y-2 rounded-lg border border-ws-border/70 bg-ws-stage/30 p-2.5">
                  <p className="text-[10px] font-medium tracking-wide text-ws-text-muted uppercase">
                    Review
                  </p>
                  <Textarea
                    value={reviewBody}
                    onChange={(event) => setReviewBody(event.target.value)}
                    placeholder="Review comment (required for Request changes)"
                    rows={3}
                    disabled={isReviewing}
                    className="min-h-16 resize-none border-ws-border bg-ws-bg text-[12px] text-ws-text"
                  />
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      disabled={isReviewing || isMerging}
                      onClick={() => void onReview("APPROVE")}
                      className="h-7 gap-1 bg-emerald-600 text-[11px] text-white hover:bg-emerald-700"
                    >
                      {isReviewing ? (
                        <Loader2Icon className="size-3.5 animate-spin" />
                      ) : (
                        <CheckIcon className="size-3.5" />
                      )}
                      Approve
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={isReviewing || isMerging}
                      onClick={() => void onReview("REQUEST_CHANGES")}
                      className="h-7 gap-1 border-ws-border bg-ws-bg text-[11px] text-ws-text hover:bg-ws-hover"
                    >
                      <XIcon className="size-3.5" />
                      Request changes
                    </Button>
                  </div>
                </div>
              ) : null}

              {canMerge ? (
                <div className="space-y-2 rounded-lg border border-ws-border/70 bg-ws-stage/30 p-2.5">
                  <p className="text-[10px] font-medium tracking-wide text-ws-text-muted uppercase">
                    Merge
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      value={mergeMethod}
                      onChange={(event) =>
                        setMergeMethod(
                          event.target.value as PullRequestMergeMethod,
                        )
                      }
                      className="h-7 rounded-md border border-ws-border bg-ws-bg px-2 text-[11px] text-ws-text"
                    >
                      <option value="merge">Merge commit</option>
                      <option value="squash">Squash and merge</option>
                      <option value="rebase">Rebase and merge</option>
                    </select>
                    <Button
                      type="button"
                      size="sm"
                      disabled={isMerging || isReviewing}
                      onClick={() => void onMerge()}
                      className="h-7 bg-violet-600 text-[11px] text-white hover:bg-violet-700"
                    >
                      {isMerging ? (
                        <>
                          <Loader2Icon className="size-3.5 animate-spin" />
                          Merging…
                        </>
                      ) : (
                        "Merge pull request"
                      )}
                    </Button>
                  </div>
                </div>
              ) : null}

              {detail.reviews.length > 0 ? (
                <div className="space-y-2 border-t border-ws-border-subtle pt-3">
                  <p className="text-[10px] font-medium tracking-wide text-ws-text-muted uppercase">
                    Reviews ({detail.reviews.length})
                  </p>
                  <ul className="space-y-2">
                    {detail.reviews.map((review) => (
                      <li
                        key={review.id}
                        className="rounded-md border border-ws-border/70 bg-ws-panel/50 p-2.5"
                      >
                        <div className="mb-1.5 flex flex-wrap items-center gap-2 text-[10px] text-ws-text-muted">
                          <GitHubAuthorAvatar
                            login={review.authorLogin}
                            avatarUrl={review.authorAvatarUrl}
                            size={16}
                          />
                          <span className="font-medium text-ws-text-secondary">
                            {review.authorLogin}
                          </span>
                          <ReviewStateBadge state={review.state} />
                          <span>{formatGitHubDate(review.submittedAt)}</span>
                        </div>
                        {review.body ? (
                          <p className="text-[12px] leading-relaxed whitespace-pre-wrap text-ws-text-secondary">
                            {review.body}
                          </p>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <div className="space-y-2 border-t border-ws-border-subtle pt-3">
                <p className="text-[10px] font-medium tracking-wide text-ws-text-muted uppercase">
                  Files changed ({detail.files.length})
                </p>
                {detail.files.length === 0 ? (
                  <p className="text-[11px] text-ws-text-muted">No files.</p>
                ) : (
                  <ul className="space-y-1.5">
                    {detail.files.map((file) => (
                      <PullRequestFileRow key={file.filename} file={file} />
                    ))}
                  </ul>
                )}
              </div>

              <GitHubCommentList comments={detail.comments} />
            </div>
          ) : null}
        </div>
        {detail && detail.state === "open" && !detail.merged ? (
          <GitHubReplyBox
            value={replyBody}
            onChange={setReplyBody}
            isSubmitting={isCommenting}
            onSubmit={() => {
              if (!replyBody.trim()) return;
              void createComment(detail.number, replyBody.trim()).then(
                (comment) => {
                  setReplyBody("");
                  setDetail((current) =>
                    current
                      ? {
                          ...current,
                          comments: [...current.comments, comment],
                        }
                      : current,
                  );
                },
              );
            }}
          />
        ) : null}
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
                  onClick={() => {
                    setReplyBody("");
                    setReviewBody("");
                    setView({ kind: "detail", pullNumber: pr.number });
                  }}
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
    </div>
  );
}
