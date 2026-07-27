/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import {
  CircleDotIcon,
  Loader2Icon,
  MessageSquareIcon,
  PlusIcon,
  RefreshCwIcon,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  GitHubAuthorAvatar,
  GitHubCommentList,
  GitHubDisabledPanel,
  GitHubHubErrorState,
  GitHubHubToolbar,
  GitHubLabelBadges,
  GitHubLoadingRow,
  GitHubReplyBox,
  GitHubStateFilterBar,
  formatGitHubDate,
} from "@/features/github/components/github-hub-ui";
import {
  useGitHubIssues,
  type GitHubIssueDetail,
  type GitHubIssueSummary,
  type IssueStateFilter,
} from "@/features/github/hooks/use-github-issues";
import { cn } from "@/lib/utils";

type WorkspaceGitIssuesProps = {
  projectId: string;
  enabled: boolean;
};

type View =
  | { kind: "list" }
  | { kind: "detail"; issueNumber: number }
  | { kind: "create" };

function IssueStateBadge({ state }: { state: "open" | "closed" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-medium uppercase",
        state === "open"
          ? "bg-emerald-500/15 text-emerald-500"
          : "bg-ws-text-muted/15 text-ws-text-muted",
      )}
    >
      <CircleDotIcon className="size-2.5" />
      {state}
    </span>
  );
}

export function WorkspaceGitIssues({
  projectId,
  enabled,
}: WorkspaceGitIssuesProps) {
  const {
    listIssues,
    getIssue,
    createIssue,
    createComment,
    updateIssueState,
    isListing,
    isLoadingDetail,
    isCreating,
    isCommenting,
    isUpdatingState,
  } = useGitHubIssues(projectId);

  const [view, setView] = useState<View>({ kind: "list" });
  const [stateFilter, setStateFilter] = useState<IssueStateFilter>("open");
  const [issues, setIssues] = useState<GitHubIssueSummary[] | null>(null);
  const [detail, setDetail] = useState<GitHubIssueDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newBody, setNewBody] = useState("");
  const [replyBody, setReplyBody] = useState("");

  const loadList = useCallback(async () => {
    if (!enabled) return;
    setError(null);
    try {
      setIssues(await listIssues(stateFilter));
    } catch (err) {
      setIssues(null);
      setError(err instanceof Error ? err.message : "Failed to load issues");
    }
  }, [enabled, listIssues, stateFilter]);

  const loadDetail = useCallback(
    async (issueNumber: number) => {
      if (!enabled) return;
      setError(null);
      setDetail(null);
      try {
        setDetail(await getIssue(issueNumber));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load issue");
      }
    },
    [enabled, getIssue],
  );

  useEffect(() => {
    if (!enabled || view.kind !== "list") return;
    loadList().catch(console.error);
  }, [enabled, loadList, view.kind]);

  useEffect(() => {
    if (!enabled || view.kind !== "detail") return;
    loadDetail(view.issueNumber).catch(console.error);
  }, [enabled, loadDetail, view]);

  if (!enabled) {
    return (
      <GitHubDisabledPanel message="Connect and publish this project to GitHub to view and manage issues." />
    );
  }

  if (view.kind === "create") {
    return (
      <div className="flex h-full min-h-0 flex-col">
        <GitHubHubToolbar title="New issue" onBack={() => setView({ kind: "list" })} />
        <div className="min-h-0 flex-1 space-y-3 overflow-auto p-3">
          <Input
            value={newTitle}
            onChange={(event) => setNewTitle(event.target.value)}
            placeholder="Issue title"
            className="h-8 border-ws-border bg-ws-bg text-[12px] text-ws-text"
          />
          <Textarea
            value={newBody}
            onChange={(event) => setNewBody(event.target.value)}
            placeholder="Description (optional)"
            rows={8}
            className="min-h-32 resize-none border-ws-border bg-ws-bg text-[12px] text-ws-text"
          />
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              disabled={!newTitle.trim() || isCreating}
              onClick={() =>
                void createIssue({
                  title: newTitle.trim(),
                  body: newBody.trim() || undefined,
                }).then((issue) => {
                  setNewTitle("");
                  setNewBody("");
                  setView({ kind: "detail", issueNumber: issue.number });
                })
              }
              className="h-7 bg-ws-accent text-[11px] text-white hover:bg-ws-accent-hover"
            >
              {isCreating ? (
                <>
                  <Loader2Icon className="size-3.5 animate-spin" />
                  Creating…
                </>
              ) : (
                "Create issue"
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
    const toggleState = async () => {
      if (!detail) return;
      const next = detail.state === "open" ? "closed" : "open";
      try {
        const updated = await updateIssueState(detail.number, next);
        setDetail((current) =>
          current ? { ...current, state: updated.state } : current,
        );
      } catch {
        // toast in hook
      }
    };

    return (
      <div className="flex h-full min-h-0 flex-col">
        <GitHubHubToolbar
          title={detail ? `#${detail.number}` : "Issue"}
          onBack={() => {
            setView({ kind: "list" });
            setDetail(null);
          }}
          onRefresh={() =>
            void loadDetail(detail?.number ?? view.issueNumber)
          }
          isRefreshing={isLoadingDetail}
          externalUrl={detail?.url}
        />
        <div className="min-h-0 flex-1 overflow-auto">
          {isLoadingDetail && !detail ? (
            <GitHubLoadingRow label="Loading issue…" />
          ) : error && !detail ? (
            <GitHubHubErrorState
              message={error}
              onRetry={() => void loadDetail(view.issueNumber)}
            />
          ) : detail ? (
            <div className="space-y-3 p-3">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <IssueStateBadge state={detail.state} />
                  <GitHubLabelBadges labels={detail.labels} />
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
                {detail.body ? (
                  <div className="rounded-md border border-ws-border/70 bg-ws-stage/30 p-2.5 text-[12px] leading-relaxed whitespace-pre-wrap text-ws-text-secondary">
                    {detail.body}
                  </div>
                ) : (
                  <p className="text-[11px] text-ws-text-muted italic">
                    No description provided.
                  </p>
                )}
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={isUpdatingState}
                  onClick={() => void toggleState()}
                  className="h-7 border-ws-border bg-ws-bg text-[11px] text-ws-text hover:bg-ws-hover"
                >
                  {isUpdatingState ? (
                    <Loader2Icon className="size-3.5 animate-spin" />
                  ) : detail.state === "open" ? (
                    "Close issue"
                  ) : (
                    "Reopen issue"
                  )}
                </Button>
              </div>
              <GitHubCommentList comments={detail.comments} />
            </div>
          ) : null}
        </div>
        {detail ? (
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
                          commentCount: current.commentCount + 1,
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
            title="New issue"
            aria-label="New issue"
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
            aria-label="Refresh issues"
            disabled={isListing}
            onClick={() => void loadList()}
            className="size-5 rounded-sm text-ws-text-muted hover:bg-ws-hover hover:text-ws-text"
          >
            <RefreshCwIcon className={cn("size-3", isListing && "animate-spin")} />
          </Button>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-auto">
        {isListing && issues === null ? (
          <GitHubLoadingRow label="Loading issues…" />
        ) : error ? (
          <GitHubHubErrorState message={error} onRetry={() => void loadList()} />
        ) : issues && issues.length === 0 ? (
          <div className="space-y-3 px-3 py-4">
            <p className="text-[11px] text-ws-text-muted">
              No {stateFilter === "all" ? "" : `${stateFilter} `}issues found.
            </p>
            <Button
              type="button"
              size="sm"
              onClick={() => setView({ kind: "create" })}
              className="h-7 bg-ws-accent text-[11px] text-white hover:bg-ws-accent-hover"
            >
              <PlusIcon className="size-3.5" />
              Create issue
            </Button>
          </div>
        ) : (
          <ul className="space-y-0 p-1.5">
            {issues?.map((issue) => (
              <li key={issue.number}>
                <button
                  type="button"
                  onClick={() => {
                    setReplyBody("");
                    setView({ kind: "detail", issueNumber: issue.number });
                  }}
                  className="flex w-full gap-2 rounded-sm px-2 py-1.5 text-left transition-colors hover:bg-ws-hover"
                >
                  <CircleDotIcon
                    className={cn(
                      "mt-0.5 size-3 shrink-0",
                      issue.state === "open"
                        ? "text-emerald-500"
                        : "text-ws-text-muted",
                    )}
                  />
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <div className="flex items-start gap-1.5">
                      <span className="shrink-0 font-mono text-[10px] text-ws-link">
                        #{issue.number}
                      </span>
                      <p className="min-w-0 flex-1 text-[12px] leading-snug text-ws-text">
                        {issue.title}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-ws-text-muted">
                      <GitHubAuthorAvatar
                        login={issue.authorLogin}
                        avatarUrl={issue.authorAvatarUrl}
                        size={14}
                      />
                      <span className="truncate">{issue.authorLogin}</span>
                      {issue.labels.slice(0, 2).map((label) => (
                        <span
                          key={label.name}
                          className="rounded-full px-1 py-0 text-[8px]"
                          style={{
                            backgroundColor: `#${label.color}33`,
                            color: `#${label.color}`,
                          }}
                        >
                          {label.name}
                        </span>
                      ))}
                      {issue.commentCount > 0 ? (
                        <span className="inline-flex items-center gap-0.5">
                          <MessageSquareIcon className="size-2.5" />
                          {issue.commentCount}
                        </span>
                      ) : null}
                      <span className="ml-auto shrink-0">
                        {formatGitHubDate(issue.updatedAt)}
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
