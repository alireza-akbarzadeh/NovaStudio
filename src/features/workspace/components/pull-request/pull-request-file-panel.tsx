"use client";

import { FileIcon } from "lucide-react";
import { useMemo } from "react";

import { PullRequestDiffReview } from "@/features/github/components/pull-request-diff-review";
import type {
  GitHubPullRequestFile,
  GitHubPullRequestReviewComment,
} from "@/features/github/hooks/use-github-pull-requests";
import { parseUnifiedPatch } from "@/features/github/lib/parse-unified-patch";

type PullRequestFilePanelProps = {
  file: GitHubPullRequestFile;
  reviewComments: GitHubPullRequestReviewComment[];
  canComment: boolean;
  isSubmitting: boolean;
  onSubmitLineComment: (args: {
    line: number;
    body: string;
    suggestion?: string;
  }) => Promise<void>;
  onSubmitThreadReply?: (args: {
    line: number;
    body: string;
    inReplyTo: number;
  }) => Promise<void>;
};

export function PullRequestFilePanel({
  file,
  reviewComments,
  canComment,
  isSubmitting,
  onSubmitLineComment,
  onSubmitThreadReply,
}: PullRequestFilePanelProps) {
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
            onSubmitThreadReply={onSubmitThreadReply}
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
