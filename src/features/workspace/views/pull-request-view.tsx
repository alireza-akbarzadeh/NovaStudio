"use client";

import {
  CheckIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ExternalLinkIcon,
  FileIcon,
  GitPullRequestIcon,
  Loader2Icon,
  MessageSquareIcon,
  MoreHorizontalIcon,
  RefreshCwIcon,
  XIcon,
} from "lucide-react";
import { Manrope } from "next/font/google";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { PullRequestDiffReview } from "@/features/github/components/pull-request-diff-review";
import {
  GitHubAuthorAvatar,
  GitHubCommentList,
  GitHubHubErrorState,
  GitHubLoadingRow,
  GitHubReplyBox,
  formatGitHubDate,
} from "@/features/github/components/github-hub-ui";
import {
  useGitHubPullRequests,
  type GitHubPullRequestDetail,
  type GitHubPullRequestFile,
  type GitHubPullRequestReviewComment,
  type PullRequestMergeMethod,
} from "@/features/github/hooks/use-github-pull-requests";
import {
  parseUnifiedPatch,
} from "@/features/github/lib/parse-unified-patch";
import { useWorkspaceBreadcrumb } from "@/features/workspace/hooks/use-workspace-breadcrumb";
import { useWorkspaceStore } from "@/features/workspace/store/workspace-store";
import { cn } from "@/lib/utils";

const display = Manrope({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

type PullRequestViewProps = {
  projectId: string;
  pullNumber: number;
};

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
      <span className="rounded-full bg-violet-500/15 px-2 py-0.5 text-[10px] font-medium text-violet-500 uppercase">
        Merged
      </span>
    );
  }
  if (draft) {
    return (
      <span className="rounded-full bg-ws-text-muted/15 px-2 py-0.5 text-[10px] font-medium text-ws-text-muted uppercase">
        Draft
      </span>
    );
  }
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-[10px] font-medium uppercase",
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

function fileBaseName(path: string) {
  return path.split("/").filter(Boolean).pop() ?? path;
}

function buildReviewCommentBody(comment: string, suggestion?: string) {
  const trimmed = comment.trim();
  const suggestionTrimmed = suggestion?.trim();
  if (!suggestionTrimmed) return trimmed;
  return `${trimmed}\n\n\`\`\`suggestion\n${suggestionTrimmed}\n\`\`\``;
}

function PullRequestFilePanel({
  file,
  reviewComments,
  canComment,
  isSubmitting,
  onSubmitLineComment,
}: {
  file: GitHubPullRequestFile;
  reviewComments: GitHubPullRequestReviewComment[];
  canComment: boolean;
  isSubmitting: boolean;
  onSubmitLineComment: (args: {
    line: number;
    body: string;
    suggestion?: string;
  }) => Promise<void>;
}) {
  const parsed = useMemo(
    () => (file.patch ? parseUnifiedPatch(file.patch) : null),
    [file.patch],
  );

  const fileComments = reviewComments.filter(
    (comment) => comment.path === file.filename,
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="flex shrink-0 items-center gap-2 border-b border-ws-border-subtle px-3 py-1.5">
        <FileIcon className="size-3.5 shrink-0 text-ws-text-muted" />
        <span className="truncate font-mono text-[12px] text-ws-text">
          {file.filename}
        </span>
        <span className="ml-auto text-[11px] tabular-nums text-emerald-500">
          +{file.additions}
        </span>
        <span className="text-[11px] tabular-nums text-red-400">
          −{file.deletions}
        </span>
      </div>

      {file.patch && parsed ? (
        <div className="min-h-0 flex-1">
          <PullRequestDiffReview
            filePath={file.filename}
            parsed={parsed}
            reviewComments={fileComments}
            canComment={canComment}
            isSubmitting={isSubmitting}
            fillHeight
            onSubmitLineComment={onSubmitLineComment}
          />
        </div>
      ) : (
        <p className="px-4 py-6 text-[13px] text-ws-text-muted italic">
          No patch available (binary or too large).
        </p>
      )}
    </div>
  );
}

/** Pull request review opened as a full-width editor tab. */
export function PullRequestView({ projectId, pullNumber }: PullRequestViewProps) {
  const {
    getPullRequest,
    createComment,
    submitReview,
    createReviewComment,
    mergePullRequest,
    isLoadingDetail,
    isCommenting,
    isReviewing,
    isReviewCommenting,
    isMerging,
  } = useGitHubPullRequests(projectId);

  const [detail, setDetail] = useState<GitHubPullRequestDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [replyBody, setReplyBody] = useState("");
  const [reviewBody, setReviewBody] = useState("");
  const [mergeMethod, setMergeMethod] =
    useState<PullRequestMergeMethod>("merge");
  const [showDetails, setShowDetails] = useState(false);
  const [showConversation, setShowConversation] = useState(false);

  const loadDetail = useCallback(async () => {
    setError(null);
    try {
      const next = await getPullRequest(pullNumber);
      setDetail(next);
      setSelectedFile((current) => current ?? next.files[0]?.filename ?? null);
    } catch (err) {
      setDetail(null);
      setError(
        err instanceof Error ? err.message : "Failed to load pull request",
      );
    }
  }, [getPullRequest, pullNumber]);

  useEffect(() => {
    void loadDetail();
  }, [loadDetail]);

  useEffect(() => {
    if (!detail) return;
    const tabId = `pull-request:${pullNumber}`;
    useWorkspaceStore.setState((state) => {
      const tab = state.editorTabs.find((entry) => entry.id === tabId);
      const nextTitle = `#${detail.number} ${detail.title}`;
      if (!tab || tab.title === nextTitle) return state;
      return {
        editorTabs: state.editorTabs.map((entry) =>
          entry.id === tabId ? { ...entry, title: nextTitle } : entry,
        ),
      };
    });
  }, [detail, pullNumber]);

  useWorkspaceBreadcrumb(
    detail
      ? [{ label: "Pull requests" }, { label: `#${detail.number}` }]
      : [{ label: "Pull requests" }, { label: `#${pullNumber}` }],
  );

  const activeFile = detail?.files.find((file) => file.filename === selectedFile);
  const canReview =
    detail && detail.state === "open" && !detail.merged;
  const canComment = Boolean(
    detail && detail.state === "open" && !detail.merged,
  );
  const canMerge =
    detail &&
    detail.state === "open" &&
    !detail.merged &&
    detail.mergeable !== false &&
    detail.mergeableState !== "dirty";

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
        current ? { ...current, reviews: [...current.reviews, review] } : current,
      );
    } catch {
      // toast in hook
    }
  };

  const onMerge = async () => {
    if (!detail) return;
    try {
      await mergePullRequest(detail.number, mergeMethod);
      await loadDetail();
    } catch {
      // toast in hook
    }
  };

  const onLineComment = async (args: {
    line: number;
    body: string;
    suggestion?: string;
  }) => {
    if (!detail || !activeFile) return;
    const comment = await createReviewComment({
      pullNumber: detail.number,
      path: activeFile.filename,
      line: args.line,
      body: buildReviewCommentBody(args.body, args.suggestion),
      commitId: detail.headSha,
    });
    setDetail((current) =>
      current
        ? {
            ...current,
            reviewComments: [...current.reviewComments, comment],
          }
        : current,
    );
  };

  if (isLoadingDetail && !detail) {
    return (
      <div className="flex h-full items-center justify-center">
        <GitHubLoadingRow label="Loading pull request…" />
      </div>
    );
  }

  if (error && !detail) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <GitHubHubErrorState message={error} onRetry={() => void loadDetail()} />
      </div>
    );
  }

  if (!detail) return null;

  const conversationCount =
    detail.comments.length + detail.reviews.length;

  return (
    <div className="flex h-full min-h-0 flex-col bg-ws-stage">
      <header className="shrink-0 border-b border-ws-border-subtle px-4 py-2">
        <div className="flex items-center gap-2">
          <GitPullRequestIcon
            className={cn(
              "size-4 shrink-0",
              detail.merged
                ? "text-violet-500"
                : detail.state === "open"
                  ? "text-emerald-500"
                  : "text-ws-text-muted",
            )}
          />
          <PullRequestBadge
            state={detail.state}
            draft={detail.draft}
            merged={detail.merged}
          />
          <span className="shrink-0 font-mono text-[11px] text-ws-link">
            #{detail.number}
          </span>
          <h1
            className={cn(
              display.className,
              "min-w-0 truncate text-sm font-semibold tracking-tight text-ws-text",
            )}
            title={detail.title}
          >
            {detail.title}
          </h1>
          <span className="hidden shrink-0 font-mono text-[10px] text-ws-text-muted sm:inline">
            {detail.headBranch} → {detail.baseBranch}
          </span>
          <span className="hidden shrink-0 text-[10px] text-emerald-500 md:inline">
            +{detail.additions}
          </span>
          <span className="hidden shrink-0 text-[10px] text-red-400 md:inline">
            −{detail.deletions}
          </span>

          <div className="ml-auto flex shrink-0 items-center gap-1">
            {canReview ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-7 border-ws-border bg-ws-bg px-2 text-[11px] text-ws-text hover:bg-ws-hover"
                  >
                    Review
                    <ChevronDownIcon className="size-3 opacity-60" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-80 border-ws-border bg-ws-panel p-3"
                >
                  <Textarea
                    value={reviewBody}
                    onChange={(event) => setReviewBody(event.target.value)}
                    placeholder="Overall review comment (required for Request changes)"
                    rows={3}
                    disabled={isReviewing}
                    className="mb-2 min-h-16 resize-none border-ws-border bg-ws-bg text-[12px] text-ws-text"
                  />
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      disabled={isReviewing || isMerging}
                      onClick={() => void onReview("APPROVE")}
                      className="h-7 flex-1 gap-1 bg-emerald-600 text-[11px] text-white hover:bg-emerald-700"
                    >
                      {isReviewing ? (
                        <Loader2Icon className="size-3 animate-spin" />
                      ) : (
                        <CheckIcon className="size-3" />
                      )}
                      Approve
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={isReviewing || isMerging}
                      onClick={() => void onReview("REQUEST_CHANGES")}
                      className="h-7 flex-1 gap-1 border-ws-border bg-ws-bg text-[11px] text-ws-text hover:bg-ws-hover"
                    >
                      <XIcon className="size-3" />
                      Request changes
                    </Button>
                  </div>
                  {canMerge ? (
                    <>
                      <DropdownMenuSeparator className="my-2 bg-ws-border" />
                      <div className="flex items-center gap-2">
                        <Select
                          value={mergeMethod}
                          onValueChange={(value) =>
                            setMergeMethod(value as PullRequestMergeMethod)
                          }
                        >
                          <SelectTrigger
                            size="sm"
                            className="h-7 flex-1 border-ws-border bg-ws-bg text-[11px] text-ws-text shadow-none"
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent position="popper" className="z-100">
                            <SelectItem value="merge" className="text-[11px]">
                              Merge commit
                            </SelectItem>
                            <SelectItem value="squash" className="text-[11px]">
                              Squash and merge
                            </SelectItem>
                            <SelectItem value="rebase" className="text-[11px]">
                              Rebase and merge
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          type="button"
                          size="sm"
                          disabled={isMerging || isReviewing}
                          onClick={() => void onMerge()}
                          className="h-7 bg-violet-600 text-[11px] text-white hover:bg-violet-700"
                        >
                          {isMerging ? (
                            <Loader2Icon className="size-3 animate-spin" />
                          ) : (
                            "Merge"
                          )}
                        </Button>
                      </div>
                    </>
                  ) : null}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : canMerge ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-7 border-ws-border bg-ws-bg px-2 text-[11px] text-ws-text hover:bg-ws-hover"
                  >
                    Merge
                    <ChevronDownIcon className="size-3 opacity-60" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-72 border-ws-border bg-ws-panel p-3"
                >
                  <div className="flex items-center gap-2">
                    <Select
                      value={mergeMethod}
                      onValueChange={(value) =>
                        setMergeMethod(value as PullRequestMergeMethod)
                      }
                    >
                      <SelectTrigger
                        size="sm"
                        className="h-7 flex-1 border-ws-border bg-ws-bg text-[11px] text-ws-text shadow-none"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent position="popper" className="z-100">
                        <SelectItem value="merge" className="text-[11px]">
                          Merge commit
                        </SelectItem>
                        <SelectItem value="squash" className="text-[11px]">
                          Squash and merge
                        </SelectItem>
                        <SelectItem value="rebase" className="text-[11px]">
                          Rebase and merge
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      size="sm"
                      disabled={isMerging}
                      onClick={() => void onMerge()}
                      className="h-7 bg-violet-600 text-[11px] text-white hover:bg-violet-700"
                    >
                      Merge
                    </Button>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : null}

            <Button
              type="button"
              size="sm"
              variant={showConversation ? "secondary" : "outline"}
              onClick={() => setShowConversation((open) => !open)}
              className="h-7 gap-1 border-ws-border bg-ws-bg px-2 text-[11px] text-ws-text hover:bg-ws-hover"
            >
              <MessageSquareIcon className="size-3" />
              {conversationCount > 0 ? conversationCount : null}
            </Button>

            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => setShowDetails((open) => !open)}
              className="h-7 px-2 text-[11px] text-ws-text-muted hover:bg-ws-hover hover:text-ws-text"
            >
              {showDetails ? (
                <ChevronUpIcon className="size-3.5" />
              ) : (
                <MoreHorizontalIcon className="size-3.5" />
              )}
            </Button>

            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => void loadDetail()}
              disabled={isLoadingDetail}
              className="size-7 p-0 text-ws-text-muted hover:bg-ws-hover hover:text-ws-text"
              title="Refresh"
            >
              <RefreshCwIcon
                className={cn("size-3.5", isLoadingDetail && "animate-spin")}
              />
            </Button>

            <Button
              type="button"
              size="sm"
              variant="ghost"
              asChild
              className="size-7 p-0 text-ws-text-muted hover:bg-ws-hover hover:text-ws-text"
              title="Open on GitHub"
            >
              <a href={detail.url} target="_blank" rel="noreferrer">
                <ExternalLinkIcon className="size-3.5" />
              </a>
            </Button>
          </div>
        </div>

        {showDetails ? (
          <div className="mt-2 space-y-2 border-t border-ws-border-subtle pt-2">
            <div className="flex flex-wrap items-center gap-2 text-[11px] text-ws-text-muted">
              <GitHubAuthorAvatar
                login={detail.authorLogin}
                avatarUrl={detail.authorAvatarUrl}
                size={16}
              />
              <span>{detail.authorLogin}</span>
              <span>· {formatGitHubDate(detail.createdAt)}</span>
              <span>{detail.changedFiles} files changed</span>
            </div>
            {detail.body ? (
              <p className="text-[12px] leading-relaxed whitespace-pre-wrap text-ws-text-secondary">
                {detail.body}
              </p>
            ) : null}
          </div>
        ) : null}
      </header>

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <aside className="flex w-52 shrink-0 flex-col border-r border-ws-border-subtle bg-ws-panel/20">
          <div className="shrink-0 border-b border-ws-border-subtle px-3 py-1.5">
            <p className="text-[10px] font-medium tracking-wide text-ws-text-muted uppercase">
              Files ({detail.files.length})
            </p>
          </div>
          <ul className="min-h-0 flex-1 overflow-auto p-1">
            {detail.files.map((file) => {
              const commentCount = detail.reviewComments.filter(
                (comment) => comment.path === file.filename,
              ).length;
              const isActive = selectedFile === file.filename;

              return (
                <li key={file.filename}>
                  <button
                    type="button"
                    onClick={() => setSelectedFile(file.filename)}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors",
                      isActive
                        ? "bg-ws-accent/15 text-ws-text"
                        : "text-ws-text-secondary hover:bg-ws-hover",
                    )}
                  >
                    <FileIcon className="size-3 shrink-0 opacity-70" />
                    <span className="min-w-0 flex-1 truncate font-mono text-[11px]">
                      {fileBaseName(file.filename)}
                    </span>
                    {commentCount > 0 ? (
                      <span className="shrink-0 rounded-full bg-sky-500/15 px-1.5 py-0.5 text-[9px] font-medium text-sky-400">
                        {commentCount}
                      </span>
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>
        </aside>

        <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
          {activeFile ? (
            <PullRequestFilePanel
              key={`${detail.number}:${activeFile.filename}`}
              file={activeFile}
              reviewComments={detail.reviewComments}
              canComment={canComment}
              isSubmitting={isReviewCommenting}
              onSubmitLineComment={onLineComment}
            />
          ) : (
            <div className="flex flex-1 items-center justify-center text-[13px] text-ws-text-muted">
              No files in this pull request.
            </div>
          )}
        </main>

        {showConversation ? (
          <aside className="flex w-72 shrink-0 flex-col border-l border-ws-border-subtle bg-ws-panel/20">
            <div className="flex shrink-0 items-center justify-between border-b border-ws-border-subtle px-3 py-1.5">
              <p className="text-[10px] font-medium tracking-wide text-ws-text-muted uppercase">
                Conversation
              </p>
              <button
                type="button"
                onClick={() => setShowConversation(false)}
                className="inline-flex size-6 items-center justify-center rounded-md text-ws-text-muted hover:bg-ws-hover hover:text-ws-text"
                aria-label="Close conversation"
              >
                <XIcon className="size-3.5" />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-auto px-3 py-2">
              {detail.reviews.length > 0 ? (
                <ul className="mb-3 space-y-2">
                  {detail.reviews.map((review) => (
                    <li
                      key={review.id}
                      className="rounded-md border border-ws-border/70 bg-ws-stage/40 p-2"
                    >
                      <div className="mb-1 flex flex-wrap items-center gap-1.5 text-[10px] text-ws-text-muted">
                        <GitHubAuthorAvatar
                          login={review.authorLogin}
                          avatarUrl={review.authorAvatarUrl}
                          size={16}
                        />
                        <span className="font-medium text-ws-text-secondary">
                          {review.authorLogin}
                        </span>
                        <ReviewStateBadge state={review.state} />
                      </div>
                      {review.body ? (
                        <p className="text-[12px] leading-relaxed whitespace-pre-wrap text-ws-text-secondary">
                          {review.body}
                        </p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              ) : null}
              <GitHubCommentList comments={detail.comments} />
            </div>

            {detail.state === "open" && !detail.merged ? (
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
          </aside>
        ) : null}
      </div>
    </div>
  );
}
