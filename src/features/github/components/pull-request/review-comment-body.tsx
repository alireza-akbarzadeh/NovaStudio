"use client";

import { CopyIcon } from "lucide-react";
import { toast } from "sonner";

import { parseReviewCommentBody } from "@/features/github/lib/pull-request/parse-review-comment-body";

type ReviewCommentBodyProps = {
  body: string;
};

export function ReviewCommentBody({ body }: ReviewCommentBodyProps) {
  const parsed = parseReviewCommentBody(body);

  const copySuggestion = async () => {
    if (!parsed.suggestion) return;
    try {
      await navigator.clipboard.writeText(parsed.suggestion);
      toast.success("Suggestion copied");
    } catch {
      toast.error("Could not copy to clipboard");
    }
  };

  return (
    <div className="space-y-2">
      {parsed.text ? (
        <p className="text-[13px] leading-relaxed whitespace-pre-wrap text-ws-text-secondary">
          {parsed.text}
        </p>
      ) : null}
      {parsed.suggestion ? (
        <div className="overflow-hidden rounded-md border border-emerald-500/30 bg-emerald-500/5">
          <div className="flex items-center justify-between gap-2 border-b border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1">
            <span className="text-[10px] font-medium tracking-wide text-emerald-400 uppercase">
              Suggested change
            </span>
            <button
              type="button"
              onClick={() => void copySuggestion()}
              className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] text-emerald-300 transition-colors hover:bg-emerald-500/20"
            >
              <CopyIcon className="size-3" />
              Copy
            </button>
          </div>
          <pre className="overflow-x-auto p-2.5 font-mono text-[12px] leading-relaxed whitespace-pre-wrap text-emerald-100/90">
            {parsed.suggestion}
          </pre>
        </div>
      ) : null}
    </div>
  );
}
