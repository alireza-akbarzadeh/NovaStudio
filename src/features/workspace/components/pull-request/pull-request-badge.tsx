import { cn } from "@/lib/utils";

type PullRequestBadgeProps = {
  state: "open" | "closed";
  draft: boolean;
  merged: boolean;
};

export function PullRequestBadge({
  state,
  draft,
  merged,
}: PullRequestBadgeProps) {
  if (merged) {
    return (
      <span className="rounded-full bg-violet-500/15 px-2 py-0.5 text-[10px] font-medium text-violet-500 uppercase">
        Merged
      </span>
    );
  }
  if (draft) {
    return (
      <span className="rounded-full bg-ws-text-muted/15 px-2 py-0.5 text-[10px] font-medium text-ws-text-muted uppercase">
        Draft
      </span>
    );
  }
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-[10px] font-medium uppercase",
        state === "open"
          ? "bg-emerald-500/15 text-emerald-500"
          : "bg-ws-text-muted/15 text-ws-text-muted",
      )}
    >
      {state}
    </span>
  );
}
