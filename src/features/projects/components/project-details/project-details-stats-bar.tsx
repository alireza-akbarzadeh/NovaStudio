"use client";

import {
  DownloadIcon,
  EyeIcon,
  GitForkIcon,
  SparklesIcon,
  StarIcon,
  UsersIcon,
} from "lucide-react";

import type { ProjectDetailsData } from "@/features/projects/lib/project-details-types";
import { formatProjectCount } from "@/features/projects/lib/project-details-utils";
import { cn } from "@/lib/utils";

type ProjectDetailsStatsBarProps = {
  details: ProjectDetailsData;
  starred: boolean;
  stars: number;
  starPending: boolean;
  onStar: () => void;
  onDownload: () => void;
};

export function ProjectDetailsStatsBar({
  details,
  starred,
  stars,
  starPending,
  onStar,
  onDownload,
}: ProjectDetailsStatsBarProps) {
  return (
    <div className="grid gap-0 border-t border-border/60 md:grid-cols-[1fr_auto]">
      <div className="flex flex-wrap items-center gap-4 border-b border-border/60 px-6 py-4 md:border-r md:border-b-0">
        <button
          type="button"
          disabled={starPending}
          onClick={onStar}
          className={cn(
            "inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition",
            starred
              ? "bg-amber-500/12 text-amber-700 dark:text-amber-300"
              : "text-muted-foreground hover:bg-muted",
          )}
        >
          <StarIcon
            className={cn("size-4", starred && "fill-current text-amber-500")}
          />
          {formatProjectCount(stars)} stars
        </button>
        <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
          <EyeIcon className="size-4" />
          {formatProjectCount(details.stats.views)} views
        </span>
        <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
          <GitForkIcon className="size-4" />
          {formatProjectCount(details.stats.forks)} contributors
        </span>
        <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
          <SparklesIcon className="size-4" />
          {formatProjectCount(details.stats.sponsors ?? 0)}{" "}
          {(details.stats.sponsors ?? 0) === 1 ? "sponsor" : "sponsors"}
        </span>
        <button
          type="button"
          onClick={onDownload}
          className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-muted-foreground transition hover:bg-muted"
        >
          <DownloadIcon className="size-4" />
          {formatProjectCount(details.stats.downloads)} clones
        </button>
      </div>
      <div className="flex items-center gap-2 px-6 py-4 text-sm text-muted-foreground">
        <UsersIcon className="size-4" />
        {details.contributorCount} team members
      </div>
    </div>
  );
}
