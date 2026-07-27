"use client";

import { parseReviewCommentBody } from "@/features/github/lib/pull-request/parse-review-comment-body";

type ReviewCommentBodyProps = {
  body: string;
};

export function ReviewCommentBody({ body }: ReviewCommentBodyProps) {
  const parsed = parseReviewCommentBody(body);

  return (
    <div className="space-y-2">
      {parsed.text ? (
        <p className="text-[13px] leading-relaxed whitespace-pre-wrap text-ws-text-secondary">
          {parsed.text}
        </p>
      ) : null}
      {parsed.suggestion ? (
        <div className="overflow-hidden rounded-md border border-emerald-500/30 bg-emerald-500/5">
          <div className="border-b border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-medium tracking-wide text-emerald-400 uppercase">
            Suggested change
          </div>
          <pre className="overflow-x-auto p-2.5 font-mono text-[12px] leading-relaxed whitespace-pre-wrap text-emerald-100/90">
            {parsed.suggestion}
          </pre>
        </div>
      ) : null}
    </div>
  );
}
