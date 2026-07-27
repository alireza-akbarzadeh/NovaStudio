"use client";

import { useCallback, useEffect, useState } from "react";

import {
  GitHubHubErrorState,
  GitHubLoadingRow,
} from "@/features/github/components/github-hub-ui";
import {
  useGitHubPullRequests,
  type GitHubPullRequestDetail,
  type PullRequestMergeMethod,
} from "@/features/github/hooks/use-github-pull-requests";
import { buildReviewCommentBody } from "@/features/github/lib/pull-request/build-review-comment-body";
import { PullRequestConversationPanel } from "@/features/workspace/components/pull-request/pull-request-conversation-panel";
import { PullRequestFilePanel } from "@/features/workspace/components/pull-request/pull-request-file-panel";
import { PullRequestFilesSidebar } from "@/features/workspace/components/pull-request/pull-request-files-sidebar";
import { PullRequestHeader } from "@/features/workspace/components/pull-request/pull-request-header";
import { useWorkspaceBreadcrumb } from "@/features/workspace/hooks/use-workspace-breadcrumb";
import { useWorkspaceStore } from "@/features/workspace/store/workspace-store";

type PullRequestViewProps = {
  projectId: string;
  pullNumber: number;
};

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
  const canReview = Boolean(
    detail && detail.state === "open" && !detail.merged,
  );
  const canComment = Boolean(
    detail && detail.state === "open" && !detail.merged,
  );
  const canMerge = Boolean(
    detail &&
      detail.state === "open" &&
      !detail.merged &&
      detail.mergeable !== false &&
      detail.mergeableState !== "dirty",
  );

  const onReview = useCallback(
    async (event: "APPROVE" | "REQUEST_CHANGES") => {
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
    },
    [detail, reviewBody, submitReview],
  );

  const onMerge = useCallback(async () => {
    if (!detail) return;
    try {
      await mergePullRequest(detail.number, mergeMethod);
      await loadDetail();
    } catch {
      // toast in hook
    }
  }, [detail, loadDetail, mergeMethod, mergePullRequest]);

  const onLineComment = useCallback(
    async (args: { line: number; body: string; suggestion?: string }) => {
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
    },
    [activeFile, createReviewComment, detail],
  );

  const onSubmitReply = useCallback(() => {
    if (!detail || !replyBody.trim()) return;
    void createComment(detail.number, replyBody.trim()).then((comment) => {
      setReplyBody("");
      setDetail((current) =>
        current
          ? { ...current, comments: [...current.comments, comment] }
          : current,
      );
    });
  }, [createComment, detail, replyBody]);

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

  const conversationCount = detail.comments.length + detail.reviews.length;

  return (
    <div className="flex h-full min-h-0 flex-col bg-ws-stage">
      <PullRequestHeader
        detail={detail}
        showDetails={showDetails}
        showConversation={showConversation}
        conversationCount={conversationCount}
        canReview={canReview}
        canMerge={canMerge}
        reviewBody={reviewBody}
        mergeMethod={mergeMethod}
        isLoadingDetail={isLoadingDetail}
        isReviewing={isReviewing}
        isMerging={isMerging}
        onToggleDetails={() => setShowDetails((open) => !open)}
        onToggleConversation={() => setShowConversation((open) => !open)}
        onRefresh={() => void loadDetail()}
        onReviewBodyChange={setReviewBody}
        onMergeMethodChange={setMergeMethod}
        onApprove={() => void onReview("APPROVE")}
        onRequestChanges={() => void onReview("REQUEST_CHANGES")}
        onMerge={() => void onMerge()}
      />

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <PullRequestFilesSidebar
          files={detail.files}
          reviewComments={detail.reviewComments}
          selectedFile={selectedFile}
          onSelectFile={setSelectedFile}
        />

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
          <PullRequestConversationPanel
            detail={detail}
            replyBody={replyBody}
            isCommenting={isCommenting}
            onReplyBodyChange={setReplyBody}
            onSubmitReply={onSubmitReply}
            onClose={() => setShowConversation(false)}
          />
        ) : null}
      </div>
    </div>
  );
}
