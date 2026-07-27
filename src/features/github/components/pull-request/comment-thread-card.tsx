"use client";

import { ChevronDownIcon, ChevronRightIcon, Loader2Icon } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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
  canComment?: boolean;
  isSubmitting?: boolean;
  onSelect?: () => void;
  onReply?: (body: string, inReplyTo: number) => Promise<void>;
};

export function CommentThreadCard({
  fileLine,
  comments,
  isActive = false,
  defaultExpanded = false,
  canComment = false,
  isSubmitting = false,
  onSelect,
  onReply,
}: CommentThreadCardProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [replyBody, setReplyBody] = useState("");
  const latest = comments[comments.length - 1];

  useEffect(() => {
    if (isActive) setExpanded(true);
  }, [isActive]);

  const toggle = () => {
    setExpanded((open) => !open);
    onSelect?.();
  };

  const submitReply = async () => {
    if (!replyBody.trim() || !latest || !onReply) return;
    await onReply(replyBody.trim(), latest.id);
    setReplyBody("");
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
        <div className="space-y-3 border-t border-ws-border/70 px-3 py-2.5">
          <ul className="space-y-3">
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

          {canComment && onReply ? (
            <div
              className="space-y-2 rounded-md border border-ws-border/70 bg-ws-bg/60 p-2.5"
              onMouseDown={(event) => event.stopPropagation()}
            >
              <Textarea
                value={replyBody}
                onChange={(event) => setReplyBody(event.target.value)}
                placeholder="Reply to thread…"
                rows={2}
                disabled={isSubmitting}
                className="min-h-14 resize-none border-ws-border bg-ws-panel text-[12px] text-ws-text"
              />
              <div className="flex justify-end">
                <Button
                  type="button"
                  size="sm"
                  disabled={!replyBody.trim() || isSubmitting}
                  onClick={() => void submitReply()}
                  className="h-7 bg-sky-600 text-[11px] text-white hover:bg-sky-700"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2Icon className="size-3 animate-spin" />
                      Posting…
                    </>
                  ) : (
                    "Reply"
                  )}
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
