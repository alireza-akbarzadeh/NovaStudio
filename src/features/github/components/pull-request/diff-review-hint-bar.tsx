import { MessageSquarePlusIcon } from "lucide-react";

export function PullRequestDiffReviewHintBar() {
  return (
    <div className="flex shrink-0 items-center gap-2 border-b border-ws-border/70 bg-ws-panel/40 px-3 py-1 text-[10px] text-ws-text-muted">
      <MessageSquarePlusIcon className="size-3 shrink-0 text-sky-400" />
      Click a line or + to comment inline
    </div>
  );
}
