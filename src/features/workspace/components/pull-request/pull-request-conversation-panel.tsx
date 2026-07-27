"use client";

import { XIcon } from "lucide-react";

import {
  GitHubAuthorAvatar,
  GitHubCommentList,
  GitHubReplyBox,
} from "@/features/github/components/github-hub-ui";
import type { GitHubPullRequestDetail } from "@/features/github/hooks/use-github-pull-requests";
import { ReviewStateBadge } from "@/features/workspace/components/pull-request/pull-request-review-state-badge";

type PullRequestConversationPanelProps = {
  detail: GitHubPullRequestDetail;
  replyBody: string;
  isCommenting: boolean;
  onReplyBodyChange: (value: string) => void;
  onSubmitReply: () => void;
  onClose: () => void;
};

export function PullRequestConversationPanel({
  detail,
  replyBody,
  isCommenting,
  onReplyBodyChange,
  onSubmitReply,
  onClose,
}: PullRequestConversationPanelProps) {
  return (
    <aside className="flex w-72 shrink-0 flex-col border-l border-ws-border-subtle bg-ws-panel/20">
      <div className="flex shrink-0 items-center justify-between border-b border-ws-border-subtle px-3 py-1.5">
        <p className="text-[10px] font-medium tracking-wide text-ws-text-muted uppercase">
          Conversation
        </p>
        <button
          type="button"
          onClick={onClose}
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
          onChange={onReplyBodyChange}
          isSubmitting={isCommenting}
          onSubmit={onSubmitReply}
        />
      ) : null}
    </aside>
  );
}
