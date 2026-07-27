"use client";

import { ChevronDownIcon, ChevronRightIcon } from "lucide-react";
import { useEffect, useState } from "react";

import type { GitHubPullRequestReviewComment } from "@/features/github/hooks/use-github-pull-requests";
import {
  GitHubAuthorAvatar,
  formatGitHubDate,
} from "@/features/github/components/github-hub-ui";
import { ReviewCommentBody } from "@/features/github/components/pull-request/review-comment-body";
import { cn } from "@/lib/utils";

type CommentThreadCardProps = {
  fileLine: number;
  comments: GitHubPullRequestReviewComment[];
  isActive?: boolean;
  defaultExpanded?: boolean;
  onSelect?: () => void;
};

export function CommentThreadCard({
  fileLine,
  comments,
  isActive = false,
  defaultExpanded = false,
  onSelect,
}: CommentThreadCardProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const latest = comments[comments.length - 1];

  useEffect(() => {
    if (isActive) setExpanded(true);
  }, [isActive]);

  const toggle = () => {
    setExpanded((open) => !open);
    onSelect?.();
  };

  return (
    <div
      className={cn(
        "overflow-hidden rounded-md border bg-ws-panel shadow-sm",
        isActive
          ? "border-sky-500/50 ring-1 ring-sky-500/20"
          : "border-ws-border/70",
      )}
    >
      <button
        type="button"
        onClick={toggle}
        className="flex w-full items-center gap-2 px-3 py-2 text-left transition-colors hover:bg-ws-hover/50"
      >
        {expanded ? (
          <ChevronDownIcon className="size-3.5 shrink-0 text-ws-text-muted" />
        ) : (
          <ChevronRightIcon className="size-3.5 shrink-0 text-ws-text-muted" />
        )}
        <span className="shrink-0 font-mono text-[11px] text-sky-400">
          Line {fileLine}
        </span>
        <span className="min-w-0 flex-1 truncate text-[11px] text-ws-text-muted">
          {comments.length} comment{comments.length === 1 ? "" : "s"}
          {latest ? ` · ${latest.authorLogin}` : ""}
        </span>
      </button>

      {expanded ? (
        <ul className="space-y-3 border-t border-ws-border/70 px-3 py-2.5">
          {comments.map((comment) => (
            <li
              key={comment.id}
              className="space-y-1.5 rounded-md bg-ws-stage/50 p-2.5"
            >
              <div className="flex flex-wrap items-center gap-2 text-[11px] text-ws-text-muted">
                <GitHubAuthorAvatar
                  login={comment.authorLogin}
                  avatarUrl={comment.authorAvatarUrl}
                  size={18}
                />
                <span className="font-medium text-ws-text-secondary">
                  {comment.authorLogin}
                </span>
                <span>{formatGitHubDate(comment.createdAt)}</span>
              </div>
              <ReviewCommentBody body={comment.body} />
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
