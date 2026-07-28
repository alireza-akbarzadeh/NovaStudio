"use client";

import {
  BellIcon,
  BellRingIcon,
  DownloadIcon,
  EyeIcon,
  GitForkIcon,
  SparklesIcon,
  StarIcon,
  UsersIcon,
} from "lucide-react";

import { ProjectDetailsShareBar } from "@/features/projects/components/project-details/project-details-share-bar";
import { ProjectDetailsTechStack } from "@/features/projects/components/project-details/project-details-tech-stack";
import type { ProjectDetailsData } from "@/features/projects/lib/project-details-types";
import { formatProjectCount } from "@/features/projects/lib/project-details-utils";
import { cn } from "@/lib/utils";

type ProjectDetailsStatsBarProps = {
  details: ProjectDetailsData;
  starred: boolean;
  stars: number;
  starPending: boolean;
  onStar: () => void;
  following?: boolean;
  followers?: number;
  followPending?: boolean;
  onFollow?: () => void;
  showFollow?: boolean;
  onDownload: () => void;
};

export function ProjectDetailsStatsBar({
  details,
  starred,
  stars,
  starPending,
  onStar,
  following = false,
  followers = 0,
  followPending = false,
  onFollow,
  showFollow = false,
  onDownload,
}: ProjectDetailsStatsBarProps) {
  return (
    <div className="border-t border-border/60">
      <div className="grid gap-0 md:grid-cols-[1fr_auto]">
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
          {showFollow && onFollow ? (
            <button
              type="button"
              disabled={followPending}
              onClick={onFollow}
              className={cn(
                "inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition",
                following
                  ? "bg-violet-500/12 text-violet-700 dark:text-violet-300"
                  : "text-muted-foreground hover:bg-muted",
              )}
            >
              {following ? (
                <BellRingIcon className="size-4 fill-current text-violet-500" />
              ) : (
                <BellIcon className="size-4" />
              )}
              {following ? "Following" : "Follow"}
              {followers > 0 ? (
                <span className="text-muted-foreground">
                  · {formatProjectCount(followers)}
                </span>
              ) : null}
            </button>
          ) : null}
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

        <div className="flex flex-col gap-4 border-b border-border/60 px-6 py-4 md:border-b-0">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <UsersIcon className="size-4" />
            {details.contributorCount} team members
          </div>
          <ProjectDetailsShareBar details={details} />
        </div>
      </div>

      <div className="border-t border-border/60 px-6 py-4">
        <ProjectDetailsTechStack tech={details.tech} variant="bar" />
      </div>
    </div>
  );
}
