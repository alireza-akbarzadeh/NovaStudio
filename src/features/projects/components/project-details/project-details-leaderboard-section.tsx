"use client";

import {
  GitCommitHorizontalIcon,
  Loader2Icon,
  MessageSquareIcon,
  RocketIcon,
  TrophyIcon,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useProjectContributorLeaderboard } from "@/features/projects/hooks/use-project-details";
import { cn } from "@/lib/utils";

type ProjectDetailsLeaderboardSectionProps = {
  projectId: string;
};

const rankStyles = [
  "border-amber-400/40 bg-amber-500/10",
  "border-slate-400/35 bg-slate-500/10",
  "border-orange-400/35 bg-orange-500/10",
] as const;

export function ProjectDetailsLeaderboardSection({
  projectId,
}: ProjectDetailsLeaderboardSectionProps) {
  const leaderboard = useProjectContributorLeaderboard(projectId);

  if (leaderboard === undefined) {
    return (
      <section className="rounded-[24px] border border-border/60 bg-card/85 p-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2Icon className="size-4 animate-spin" />
          Loading contributor leaderboard…
        </div>
      </section>
    );
  }

  if (leaderboard.length === 0) return null;

  return (
    <section className="rounded-[24px] border border-border/60 bg-card/85 p-6">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
            <TrophyIcon className="size-5 text-amber-500" />
            Contributor leaderboard
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Ranked by commits, reviews, shipped roadmap items, and discussion.
          </p>
        </div>
        <Badge variant="outline" className="rounded-full">
          Top {leaderboard.length}
        </Badge>
      </div>

      <ol className="space-y-2">
        {leaderboard.map((entry) => (
          <li
            key={entry.userId}
            className={cn(
              "flex items-center gap-3 rounded-xl border px-3 py-2.5",
              entry.rank <= 3
                ? rankStyles[entry.rank - 1]
                : "border-border/50 bg-muted/15",
            )}
          >
            <span
              className={cn(
                "inline-flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                entry.rank === 1
                  ? "bg-amber-500 text-white"
                  : entry.rank === 2
                    ? "bg-slate-500 text-white"
                    : entry.rank === 3
                      ? "bg-orange-500 text-white"
                      : "bg-muted text-muted-foreground",
              )}
            >
              {entry.rank}
            </span>

            <Avatar size="sm" style={{ boxShadow: `0 0 0 2px ${entry.color}` }}>
              {entry.imageUrl ? (
                <AvatarImage src={entry.imageUrl} alt="" />
              ) : null}
              <AvatarFallback className="text-[10px]">
                {entry.initials}
              </AvatarFallback>
            </Avatar>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{entry.name}</p>
              <p className="text-[11px] capitalize text-muted-foreground">
                {entry.role}
              </p>
            </div>

            <div className="hidden flex-wrap items-center justify-end gap-2 text-[10px] text-muted-foreground sm:flex">
              {entry.commits > 0 ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-background/70 px-2 py-0.5">
                  <GitCommitHorizontalIcon className="size-3" />
                  {entry.commits}
                </span>
              ) : null}
              {entry.reviews > 0 ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-background/70 px-2 py-0.5">
                  <MessageSquareIcon className="size-3" />
                  {entry.reviews}
                </span>
              ) : null}
              {entry.shipped > 0 ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-background/70 px-2 py-0.5">
                  <RocketIcon className="size-3" />
                  {entry.shipped}
                </span>
              ) : null}
            </div>

            <div className="text-right">
              <p className="text-sm font-semibold tabular-nums">{entry.score}</p>
              <p className="text-[10px] text-muted-foreground">pts</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
