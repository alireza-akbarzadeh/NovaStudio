"use client";

import {
  ChevronUpIcon,
  ExternalLinkIcon,
  GitPullRequestIcon,
  MessageSquareIcon,
  MoreHorizontalIcon,
  RefreshCwIcon,
} from "lucide-react";
import { Manrope } from "next/font/google";

import { Button } from "@/components/ui/button";
import {
  GitHubAuthorAvatar,
  formatGitHubDate,
} from "@/features/github/components/github-hub-ui";
import type {
  GitHubPullRequestDetail,
  PullRequestMergeMethod,
} from "@/features/github/hooks/use-github-pull-requests";
import { PullRequestBadge } from "@/features/workspace/components/pull-request/pull-request-badge";
import { PullRequestReviewMenu } from "@/features/workspace/components/pull-request/pull-request-review-menu";
import { cn } from "@/lib/utils";

const display = Manrope({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

type PullRequestHeaderProps = {
  detail: GitHubPullRequestDetail;
  showDetails: boolean;
  showConversation: boolean;
  conversationCount: number;
  canReview: boolean;
  canMerge: boolean;
  reviewBody: string;
  mergeMethod: PullRequestMergeMethod;
  isLoadingDetail: boolean;
  isReviewing: boolean;
  isMerging: boolean;
  onToggleDetails: () => void;
  onToggleConversation: () => void;
  onRefresh: () => void;
  onReviewBodyChange: (value: string) => void;
  onMergeMethodChange: (value: PullRequestMergeMethod) => void;
  onApprove: () => void;
  onRequestChanges: () => void;
  onMerge: () => void;
};

export function PullRequestHeader({
  detail,
  showDetails,
  showConversation,
  conversationCount,
  canReview,
  canMerge,
  reviewBody,
  mergeMethod,
  isLoadingDetail,
  isReviewing,
  isMerging,
  onToggleDetails,
  onToggleConversation,
  onRefresh,
  onReviewBodyChange,
  onMergeMethodChange,
  onApprove,
  onRequestChanges,
  onMerge,
}: PullRequestHeaderProps) {
  return (
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
          <PullRequestReviewMenu
            canReview={canReview}
            canMerge={canMerge}
            reviewBody={reviewBody}
            mergeMethod={mergeMethod}
            isReviewing={isReviewing}
            isMerging={isMerging}
            onReviewBodyChange={onReviewBodyChange}
            onMergeMethodChange={onMergeMethodChange}
            onApprove={onApprove}
            onRequestChanges={onRequestChanges}
            onMerge={onMerge}
          />

          <Button
            type="button"
            size="sm"
            variant={showConversation ? "secondary" : "outline"}
            onClick={onToggleConversation}
            className="h-7 gap-1 border-ws-border bg-ws-bg px-2 text-[11px] text-ws-text hover:bg-ws-hover"
          >
            <MessageSquareIcon className="size-3" />
            {conversationCount > 0 ? conversationCount : null}
          </Button>

          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={onToggleDetails}
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
            onClick={onRefresh}
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
  );
}
