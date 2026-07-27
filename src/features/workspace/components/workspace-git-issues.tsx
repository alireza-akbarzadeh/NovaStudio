/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import {
  ArrowLeftIcon,
  CircleDotIcon,
  ExternalLinkIcon,
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

function formatIssueDate(iso: string) {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

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

function AuthorAvatar({
  login,
  avatarUrl,
  size = 20,
}: {
  login: string;
  avatarUrl: string;
  size?: number;
}) {
  if (!avatarUrl) {
    return (
      <span
        className="inline-flex shrink-0 items-center justify-center rounded-full bg-ws-hover text-[9px] font-medium text-ws-text-muted"
        style={{ width: size, height: size }}
      >
        {login.slice(0, 1).toUpperCase()}
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={avatarUrl}
      alt=""
      width={size}
      height={size}
      className="shrink-0 rounded-full"
    />
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
    isListing,
    isLoadingDetail,
    isCreating,
    isCommenting,
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
      const result = await listIssues(stateFilter);
      setIssues(result);
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
        const result = await getIssue(issueNumber);
        setDetail(result);
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

  const openIssue = (issueNumber: number) => {
    setReplyBody("");
    setView({ kind: "detail", issueNumber });
  };

  const onCreateIssue = async () => {
    if (!newTitle.trim()) return;
    try {
      const issue = await createIssue({
        title: newTitle.trim(),
        body: newBody.trim() || undefined,
      });
      setNewTitle("");
      setNewBody("");
      setView({ kind: "detail", issueNumber: issue.number });
    } catch {
      // toast handled in hook
    }
  };

  const onReply = async () => {
    if (view.kind !== "detail" || !replyBody.trim()) return;
    try {
      const comment = await createComment(view.issueNumber, replyBody.trim());
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
    } catch {
      // toast handled in hook
    }
  };

  if (!enabled) {
    return (
      <p className="px-3 py-4 text-[11px] text-ws-text-muted">
        Connect and publish this project to GitHub to view and manage issues.
      </p>
    );
  }

  if (view.kind === "create") {
    return (
      <div className="flex h-full min-h-0 flex-col">
        <IssuesToolbar
          title="New issue"
          onBack={() => setView({ kind: "list" })}
        />
        <div className="min-h-0 flex-1 space-y-3 overflow-auto p-3">
          <div className="space-y-1.5">
            <label className="text-[10px] font-medium text-ws-text-muted uppercase">
              Title
            </label>
            <Input
              value={newTitle}
              onChange={(event) => setNewTitle(event.target.value)}
              placeholder="Issue title"
              className="h-8 border-ws-border bg-ws-bg text-[12px] text-ws-text"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-medium text-ws-text-muted uppercase">
              Description
            </label>
            <Textarea
              value={newBody}
              onChange={(event) => setNewBody(event.target.value)}
              placeholder="Describe the issue (optional)"
              rows={8}
              className="min-h-32 resize-none border-ws-border bg-ws-bg text-[12px] text-ws-text"
            />
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              disabled={!newTitle.trim() || isCreating}
              onClick={() => void onCreateIssue()}
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
    return (
      <div className="flex h-full min-h-0 flex-col">
        <IssuesToolbar
          title={detail ? `#${detail.number}` : "Issue"}
          onBack={() => {
            setView({ kind: "list" });
            setDetail(null);
          }}
          onRefresh={
            detail
              ? () => void loadDetail(detail.number)
              : () => void loadDetail(view.issueNumber)
          }
          isRefreshing={isLoadingDetail}
          externalUrl={detail?.url}
        />

        <div className="min-h-0 flex-1 overflow-auto">
          {isLoadingDetail && !detail ? (
            <div className="flex items-center gap-2 px-3 py-4 text-[11px] text-ws-text-muted">
              <Loader2Icon className="size-3.5 animate-spin" />
              Loading issue…
            </div>
          ) : error && !detail ? (
            <ErrorState message={error} onRetry={() => void loadDetail(view.issueNumber)} />
          ) : detail ? (
            <div className="space-y-3 p-3">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <IssueStateBadge state={detail.state} />
                  <span className="text-[10px] text-ws-text-muted">
                    opened {formatIssueDate(detail.createdAt)}
                  </span>
                </div>
                <h3 className="text-[13px] font-medium leading-snug text-ws-text">
                  {detail.title}
                </h3>
                <div className="flex items-center gap-2 text-[10px] text-ws-text-muted">
                  <AuthorAvatar
                    login={detail.authorLogin}
                    avatarUrl={detail.authorAvatarUrl}
                  />
                  <span>{detail.authorLogin}</span>
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
              </div>

              <div className="space-y-2 border-t border-ws-border-subtle pt-3">
                <p className="text-[10px] font-medium tracking-wide text-ws-text-muted uppercase">
                  Comments ({detail.comments.length})
                </p>
                {detail.comments.length === 0 ? (
                  <p className="text-[11px] text-ws-text-muted">
                    No comments yet.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {detail.comments.map((comment) => (
                      <li
                        key={comment.id}
                        className="rounded-md border border-ws-border/70 bg-ws-panel/50 p-2.5"
                      >
                        <div className="mb-1.5 flex items-center gap-2 text-[10px] text-ws-text-muted">
                          <AuthorAvatar
                            login={comment.authorLogin}
                            avatarUrl={comment.authorAvatarUrl}
                            size={16}
                          />
                          <span className="font-medium text-ws-text-secondary">
                            {comment.authorLogin}
                          </span>
                          <span>{formatIssueDate(comment.createdAt)}</span>
                        </div>
                        <p className="text-[12px] leading-relaxed whitespace-pre-wrap text-ws-text-secondary">
                          {comment.body}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ) : null}
        </div>

        {detail ? (
          <div className="shrink-0 space-y-2 border-t border-ws-border-subtle bg-ws-panel p-2.5">
            <Textarea
              value={replyBody}
              onChange={(event) => setReplyBody(event.target.value)}
              placeholder="Write a reply…"
              rows={3}
              disabled={isCommenting}
              className="min-h-16 resize-none border-ws-border bg-ws-bg text-[12px] text-ws-text"
            />
            <Button
              type="button"
              size="sm"
              disabled={!replyBody.trim() || isCommenting}
              onClick={() => void onReply()}
              className="h-7 bg-ws-accent text-[11px] text-white hover:bg-ws-accent-hover"
            >
              {isCommenting ? (
                <>
                  <Loader2Icon className="size-3.5 animate-spin" />
                  Posting…
                </>
              ) : (
                <>
                  <MessageSquareIcon className="size-3.5" />
                  Reply
                </>
              )}
            </Button>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex h-7 shrink-0 items-center justify-between border-b border-ws-border-subtle px-2">
        <div className="flex items-center gap-1">
          {(["open", "closed", "all"] as const).map((state) => (
            <button
              key={state}
              type="button"
              onClick={() => setStateFilter(state)}
              className={cn(
                "rounded-sm px-1.5 py-0.5 text-[10px] capitalize transition-colors",
                stateFilter === state
                  ? "bg-ws-hover text-ws-text"
                  : "text-ws-text-muted hover:text-ws-text",
              )}
            >
              {state}
            </button>
          ))}
        </div>
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
            <RefreshCwIcon
              className={cn("size-3", isListing && "animate-spin")}
            />
          </Button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto">
        {isListing && issues === null ? (
          <div className="flex items-center gap-2 px-3 py-4 text-[11px] text-ws-text-muted">
            <Loader2Icon className="size-3.5 animate-spin" />
            Loading issues…
          </div>
        ) : error ? (
          <ErrorState message={error} onRetry={() => void loadList()} />
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
                  onClick={() => openIssue(issue.number)}
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
                    <div className="flex items-center gap-2 pl-0 text-[10px] text-ws-text-muted">
                      <AuthorAvatar
                        login={issue.authorLogin}
                        avatarUrl={issue.authorAvatarUrl}
                        size={14}
                      />
                      <span className="truncate">{issue.authorLogin}</span>
                      {issue.commentCount > 0 ? (
                        <span className="inline-flex items-center gap-0.5">
                          <MessageSquareIcon className="size-2.5" />
                          {issue.commentCount}
                        </span>
                      ) : null}
                      <span className="ml-auto shrink-0">
                        {formatIssueDate(issue.updatedAt)}
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

function IssuesToolbar({
  title,
  onBack,
  onRefresh,
  isRefreshing,
  externalUrl,
}: {
  title: string;
  onBack: () => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  externalUrl?: string;
}) {
  return (
    <div className="flex h-7 shrink-0 items-center justify-between border-b border-ws-border-subtle px-1.5">
      <div className="flex min-w-0 items-center gap-1">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={onBack}
          className="size-5 shrink-0 rounded-sm text-ws-text-muted hover:bg-ws-hover hover:text-ws-text"
        >
          <ArrowLeftIcon className="size-3" />
        </Button>
        <span className="truncate text-[11px] font-medium text-ws-text">
          {title}
        </span>
      </div>
      <div className="flex items-center gap-0.5">
        {onRefresh ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            title="Refresh"
            aria-label="Refresh"
            disabled={isRefreshing}
            onClick={onRefresh}
            className="size-5 rounded-sm text-ws-text-muted hover:bg-ws-hover hover:text-ws-text"
          >
            <RefreshCwIcon
              className={cn("size-3", isRefreshing && "animate-spin")}
            />
          </Button>
        ) : null}
        {externalUrl ? (
          <Button
            asChild
            variant="ghost"
            size="icon-sm"
            className="size-5 rounded-sm text-ws-text-muted hover:bg-ws-hover hover:text-ws-text"
          >
            <a
              href={externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              title="Open on GitHub"
              aria-label="Open on GitHub"
            >
              <ExternalLinkIcon className="size-3" />
            </a>
          </Button>
        ) : null}
      </div>
    </div>
  );
}

function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="space-y-2 px-3 py-4">
      <p className="text-[11px] text-ws-danger-soft">{message}</p>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        onClick={onRetry}
        className="h-7 text-[11px] text-ws-text-secondary hover:bg-ws-hover hover:text-ws-text"
      >
        Try again
      </Button>
    </div>
  );
}
