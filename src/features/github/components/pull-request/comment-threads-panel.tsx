"use client";

import { ChevronDownIcon, ChevronRightIcon, MessageSquareIcon } from "lucide-react";
import { useMemo, useState } from "react";

import { CommentThreadCard } from "@/features/github/components/pull-request/comment-thread-card";
import type { LineThread } from "@/features/github/lib/pull-request/types";

type CommentThreadsPanelProps = {
  threads: LineThread[];
  activeFileLine: number | null;
  canComment?: boolean;
  isSubmitting?: boolean;
  onSelectThread: (thread: LineThread) => void;
  onSubmitThreadReply?: (args: {
    line: number;
    body: string;
    inReplyTo: number;
  }) => Promise<void>;
};

export function CommentThreadsPanel({
  threads,
  activeFileLine,
  canComment = false,
  isSubmitting = false,
  onSelectThread,
  onSubmitThreadReply,
}: CommentThreadsPanelProps) {
  const [panelExpanded, setPanelExpanded] = useState(true);

  const sortedThreads = useMemo(
    () => [...threads].sort((a, b) => a.fileLine - b.fileLine),
    [threads],
  );

  if (sortedThreads.length === 0) return null;

  return (
    <div className="shrink-0 border-t border-ws-border-subtle bg-ws-panel/30">
      <button
        type="button"
        onClick={() => setPanelExpanded((open) => !open)}
        className="flex w-full items-center gap-2 px-3 py-2 text-left transition-colors hover:bg-ws-hover/40"
      >
        {panelExpanded ? (
          <ChevronDownIcon className="size-3.5 shrink-0 text-ws-text-muted" />
        ) : (
          <ChevronRightIcon className="size-3.5 shrink-0 text-ws-text-muted" />
        )}
        <MessageSquareIcon className="size-3.5 shrink-0 text-sky-400" />
        <span className="text-[11px] font-medium text-ws-text">
          Line comments ({sortedThreads.length})
        </span>
      </button>

      {panelExpanded ? (
        <div className="max-h-56 space-y-2 overflow-auto px-3 pb-3">
          {sortedThreads.map((thread) => (
            <CommentThreadCard
              key={thread.fileLine}
              fileLine={thread.fileLine}
              comments={thread.comments}
              isActive={activeFileLine === thread.fileLine}
              defaultExpanded={activeFileLine === thread.fileLine}
              canComment={canComment}
              isSubmitting={isSubmitting}
              onSelect={() => onSelectThread(thread)}
              onReply={
                onSubmitThreadReply
                  ? (body, inReplyTo) =>
                      onSubmitThreadReply({
                        line: thread.fileLine,
                        body,
                        inReplyTo,
                      })
                  : undefined
              }
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
