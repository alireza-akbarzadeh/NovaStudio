"use client";

import {
  CheckIcon,
  ExternalLinkIcon,
  FileIcon,
  GitPullRequestIcon,
  Loader2Icon,
  RefreshCwIcon,
  XIcon,
} from "lucide-react";
import { Manrope } from "next/font/google";
import { useCallback, useEffect, useMemo, useState } from "react";

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
  diffEditorHeight,
  parseUnifiedPatch,
} from "@/features/github/lib/parse-unified-patch";
import { useWorkspaceBreadcrumb } from "@/features/workspace/hooks/use-workspace-breadcrumb";
import { WorkspaceDiffEditor } from "@/features/workspace/components/workspace-diff-editor";
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

function FileReviewComments({
  comments,
}: {
  comments: GitHubPullRequestReviewComment[];
}) {
  if (comments.length === 0) return null;

  return (
    <ul className="space-y-2 border-t border-ws-border/70 bg-ws-panel/30 p-3">
      {comments.map((comment) => (
        <li
          key={comment.id}
          className="rounded-md border border-ws-border/70 bg-ws-stage/40 p-3"
        >
          <div className="mb-1.5 flex flex-wrap items-center gap-2 text-[11px] text-ws-text-muted">
            <GitHubAuthorAvatar
              login={comment.authorLogin}
              avatarUrl={comment.authorAvatarUrl}
              size={18}
            />
            <span className="font-medium text-ws-text-secondary">
              {comment.authorLogin}
            </span>
            <span className="font-mono text-ws-link">
              line {comment.line}
            </span>
            <span>{formatGitHubDate(comment.createdAt)}</span>
          </div>
          <p className="text-[13px] leading-relaxed whitespace-pre-wrap text-ws-text-secondary">
            {comment.body}
          </p>
        </li>
      ))}
    </ul>
  );
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

  const editorHeight = useMemo(() => {
    if (!parsed) return diffEditorHeight(16, true);
    const lines = Math.max(
      parsed.original.split("\n").length,
      parsed.modified.split("\n").length,
    );
    return diffEditorHeight(lines, true);
  }, [parsed]);

  const [selectedLine, setSelectedLine] = useState(1);
  const [commentBody, setCommentBody] = useState("");
  const [suggestionBody, setSuggestionBody] = useState("");

  const fileComments = reviewComments.filter(
    (comment) => comment.path === file.filename,
  );

  const onSubmit = async () => {
    if (!commentBody.trim()) return;
    await onSubmitLineComment({
      line: selectedLine,
      body: commentBody,
      suggestion: suggestionBody,
    });
    setCommentBody("");
    setSuggestionBody("");
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="flex shrink-0 items-center gap-2 border-b border-ws-border-subtle px-4 py-2">
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
        <div
          className="min-h-0 shrink-0 overflow-hidden border-b border-ws-border/70"
          style={{ height: editorHeight }}
        >
          <WorkspaceDiffEditor
            filePath={file.filename}
            original={parsed.original}
            modified={parsed.modified}
            renderSideBySide
            height={editorHeight}
            onModifiedLineChange={setSelectedLine}
          />
        </div>
      ) : (
        <p className="border-b border-ws-border/70 px-4 py-6 text-[13px] text-ws-text-muted italic">
          No patch available (binary or too large).
        </p>
      )}

      <FileReviewComments comments={fileComments} />

      {canComment ? (
        <div className="shrink-0 space-y-3 border-t border-ws-border-subtle bg-ws-panel/20 p-4">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] font-medium tracking-wide text-ws-text-muted uppercase">
              Comment on change
            </p>
            <span className="text-[11px] text-ws-text-muted">
              Click a line in the diff or edit the line number
            </span>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[11px] text-ws-text-muted">Line</label>
            <Input
              type="number"
              min={1}
              value={selectedLine}
              onChange={(event) =>
                setSelectedLine(
                  Math.max(1, Number.parseInt(event.target.value, 10) || 1),
                )
              }
              className="h-8 w-20 border-ws-border bg-ws-bg text-[12px] text-ws-text"
            />
          </div>
          <Textarea
            value={commentBody}
            onChange={(event) => setCommentBody(event.target.value)}
            placeholder="Leave a review comment on this line…"
            rows={3}
            disabled={isSubmitting}
            className="min-h-20 resize-none border-ws-border bg-ws-bg text-[13px] text-ws-text"
          />
          <Textarea
            value={suggestionBody}
            onChange={(event) => setSuggestionBody(event.target.value)}
            placeholder="Suggested improvement (optional — becomes a GitHub suggestion block)"
            rows={3}
            disabled={isSubmitting}
            className="min-h-16 resize-none border-ws-border bg-ws-bg font-mono text-[12px] text-ws-text"
          />
          <Button
            type="button"
            size="sm"
            disabled={!commentBody.trim() || isSubmitting}
            onClick={() => void onSubmit()}
            className="h-8 bg-ws-accent text-[12px] text-white hover:bg-ws-accent-hover"
          >
            {isSubmitting ? (
              <>
                <Loader2Icon className="size-3.5 animate-spin" />
                Posting…
              </>
            ) : (
              "Add review comment"
            )}
          </Button>
        </div>
      ) : null}
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

  return (
    <div className="flex h-full min-h-0 flex-col bg-ws-stage">
      <header className="shrink-0 border-b border-ws-border-subtle px-6 py-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
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
              <span className="font-mono text-[11px] text-ws-text-muted">
                {detail.headBranch} → {detail.baseBranch}
              </span>
            </div>
            <h1
              className={cn(
                display.className,
                "text-lg font-semibold tracking-tight text-ws-text",
              )}
            >
              {detail.title}
            </h1>
            <div className="flex flex-wrap items-center gap-2 text-[12px] text-ws-text-muted">
              <GitHubAuthorAvatar
                login={detail.authorLogin}
                avatarUrl={detail.authorAvatarUrl}
              />
              <span>{detail.authorLogin}</span>
              <span>· {formatGitHubDate(detail.createdAt)}</span>
              <span className="text-emerald-500">+{detail.additions}</span>
              <span className="text-red-400">−{detail.deletions}</span>
              <span>{detail.changedFiles} files</span>
            </div>
            {detail.body ? (
              <p className="max-w-3xl text-[13px] leading-relaxed whitespace-pre-wrap text-ws-text-secondary">
                {detail.body}
              </p>
            ) : null}
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => void loadDetail()}
              disabled={isLoadingDetail}
              className="h-8 border-ws-border bg-ws-bg text-[12px] text-ws-text hover:bg-ws-hover"
            >
              <RefreshCwIcon
                className={cn("size-3.5", isLoadingDetail && "animate-spin")}
              />
              Refresh
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              asChild
              className="h-8 border-ws-border bg-ws-bg text-[12px] text-ws-text hover:bg-ws-hover"
            >
              <a href={detail.url} target="_blank" rel="noreferrer">
                <ExternalLinkIcon className="size-3.5" />
                Open on GitHub
              </a>
            </Button>
          </div>
        </div>

        {canReview || canMerge ? (
          <div className="mt-4 flex flex-wrap gap-4 border-t border-ws-border-subtle pt-4">
            {canReview ? (
              <div className="min-w-[280px] flex-1 space-y-2">
                <p className="text-[11px] font-medium tracking-wide text-ws-text-muted uppercase">
                  Review
                </p>
                <Textarea
                  value={reviewBody}
                  onChange={(event) => setReviewBody(event.target.value)}
                  placeholder="Overall review comment (required for Request changes)"
                  rows={2}
                  disabled={isReviewing}
                  className="min-h-14 resize-none border-ws-border bg-ws-bg text-[13px] text-ws-text"
                />
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    disabled={isReviewing || isMerging}
                    onClick={() => void onReview("APPROVE")}
                    className="h-8 gap-1 bg-emerald-600 text-[12px] text-white hover:bg-emerald-700"
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
                    className="h-8 gap-1 border-ws-border bg-ws-bg text-[12px] text-ws-text hover:bg-ws-hover"
                  >
                    <XIcon className="size-3.5" />
                    Request changes
                  </Button>
                </div>
              </div>
            ) : null}

            {canMerge ? (
              <div className="min-w-[240px] space-y-2">
                <p className="text-[11px] font-medium tracking-wide text-ws-text-muted uppercase">
                  Merge
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <Select
                    value={mergeMethod}
                    onValueChange={(value) =>
                      setMergeMethod(value as PullRequestMergeMethod)
                    }
                  >
                    <SelectTrigger
                      size="sm"
                      className="h-8 w-[180px] border-ws-border bg-ws-bg text-[12px] text-ws-text shadow-none"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent position="popper" className="z-[100]">
                      <SelectItem value="merge" className="text-[12px]">
                        Merge commit
                      </SelectItem>
                      <SelectItem value="squash" className="text-[12px]">
                        Squash and merge
                      </SelectItem>
                      <SelectItem value="rebase" className="text-[12px]">
                        Rebase and merge
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    size="sm"
                    disabled={isMerging || isReviewing}
                    onClick={() => void onMerge()}
                    className="h-8 bg-violet-600 text-[12px] text-white hover:bg-violet-700"
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
          </div>
        ) : null}
      </header>

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <aside className="flex w-64 shrink-0 flex-col border-r border-ws-border-subtle bg-ws-panel/20">
          <div className="shrink-0 border-b border-ws-border-subtle px-3 py-2">
            <p className="text-[11px] font-medium tracking-wide text-ws-text-muted uppercase">
              Files changed ({detail.files.length})
            </p>
          </div>
          <ul className="min-h-0 flex-1 overflow-auto p-1.5">
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
                      "flex w-full items-start gap-2 rounded-md px-2 py-2 text-left transition-colors",
                      isActive
                        ? "bg-ws-accent/15 text-ws-text"
                        : "text-ws-text-secondary hover:bg-ws-hover",
                    )}
                  >
                    <FileIcon className="mt-0.5 size-3 shrink-0 opacity-70" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-mono text-[11px]">
                        {fileBaseName(file.filename)}
                      </p>
                      <p className="truncate text-[10px] text-ws-text-muted">
                        {file.filename}
                      </p>
                    </div>
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
      </div>

      <div className="shrink-0 border-t border-ws-border-subtle">
        {detail.reviews.length > 0 ? (
          <div className="space-y-2 border-b border-ws-border-subtle px-6 py-4">
            <p className="text-[11px] font-medium tracking-wide text-ws-text-muted uppercase">
              Reviews ({detail.reviews.length})
            </p>
            <ul className="space-y-2">
              {detail.reviews.map((review) => (
                <li
                  key={review.id}
                  className="rounded-md border border-ws-border/70 bg-ws-panel/40 p-3"
                >
                  <div className="mb-1.5 flex flex-wrap items-center gap-2 text-[11px] text-ws-text-muted">
                    <GitHubAuthorAvatar
                      login={review.authorLogin}
                      avatarUrl={review.authorAvatarUrl}
                      size={18}
                    />
                    <span className="font-medium text-ws-text-secondary">
                      {review.authorLogin}
                    </span>
                    <ReviewStateBadge state={review.state} />
                    <span>{formatGitHubDate(review.submittedAt)}</span>
                  </div>
                  {review.body ? (
                    <p className="text-[13px] leading-relaxed whitespace-pre-wrap text-ws-text-secondary">
                      {review.body}
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="max-h-56 overflow-auto px-6 py-4">
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
                      ? { ...current, comments: [...current.comments, comment] }
                      : current,
                  );
                },
              );
            }}
          />
        ) : null}
      </div>
    </div>
  );
}
