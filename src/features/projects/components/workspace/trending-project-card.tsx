"use client";

import { FlameIcon, StarIcon } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";

import type { WorkspaceProject } from "@/features/projects/lib/projects-workspace-types";
import { cn } from "@/lib/utils";

type TrendingProjectCardProps = {
  project: WorkspaceProject;
  index: number;
  /** Fill grid cells on the trending page instead of carousel sizing. */
  fill?: boolean;
};

export function TrendingProjectCard({
  project,
  index,
  fill = false,
}: TrendingProjectCardProps) {
  return (
    <motion.article
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.08 + index * 0.04, duration: 0.3 }}
      className={cn(
        "group rounded-[20px] border border-border/60 bg-card/85 p-3 shadow-[0_12px_36px_-28px_rgba(76,29,149,0.45)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_48px_-28px_rgba(76,29,149,0.5)]",
        fill ? "w-full" : "flex min-w-[240px] max-w-[260px] shrink-0",
      )}
    >
      <Link
        href={`/projects/community/${project.id}`}
        className="flex w-full items-center gap-3"
      >
        <div
          className={cn(
            "relative size-14 shrink-0 overflow-hidden rounded-2xl",
            project.coverTone,
          )}
        >
          <span className="absolute top-1 left-1 inline-flex items-center gap-0.5 rounded-full bg-orange-500 px-1.5 py-0.5 text-[9px] font-bold text-white">
            <FlameIcon className="size-2.5" />
            Hot
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold tracking-tight">
            {project.name}
          </h3>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            {project.lastUpdated}
          </p>
          <p className="mt-1 inline-flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400">
            <StarIcon className="size-3 fill-current" />
            {project.stars?.toLocaleString() ?? "Public"}
          </p>
        </div>
      </Link>
    </motion.article>
  );
}
