import { cn } from "@/lib/utils";

type ReviewStateBadgeProps = {
  state: string;
};

export function ReviewStateBadge({ state }: ReviewStateBadgeProps) {
  const normalized = state.toUpperCase();
  const className =
    normalized === "APPROVED"
      ? "bg-emerald-500/15 text-emerald-500"
      : normalized === "CHANGES_REQUESTED"
        ? "bg-orange-500/15 text-orange-400"
        : "bg-ws-text-muted/15 text-ws-text-muted";

  return (
    <span
      className={cn(
        "rounded-full px-1.5 py-0.5 text-[9px] font-medium uppercase",
        className,
      )}
    >
      {state.replace(/_/g, " ").toLowerCase()}
    </span>
  );
}
