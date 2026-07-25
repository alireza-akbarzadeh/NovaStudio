"use client";

import {
  DownloadIcon,
  EyeIcon,
  GitForkIcon,
  PinIcon,
  StarIcon,
} from "lucide-react";
import { motion } from "motion/react";

import { Button } from "@/components/ui/button";
import { TechBadge } from "@/features/projects/components/workspace/tech-badge";
import type { WorkspaceProject } from "@/features/projects/lib/projects-workspace-types";
import { cn } from "@/lib/utils";

type CommunityProjectCardProps = {
  project: WorkspaceProject;
  index: number;
  onRequestAccess: (project: WorkspaceProject) => void;
};

export function CommunityProjectCard({
  project,
  index,
  onRequestAccess,
}: CommunityProjectCardProps) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.12 + index * 0.05, duration: 0.35 }}
      className="group relative overflow-hidden rounded-[24px] border border-border/60 bg-card/90 shadow-[0_18px_50px_-32px_rgba(76,29,149,0.55)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_30px_70px_-34px_rgba(76,29,149,0.6)]"
    >
      <div className={cn("relative h-44 overflow-hidden", project.coverTone)}>
        <div className="absolute inset-0 scale-100 bg-[radial-gradient(circle_at_25%_20%,rgba(255,255,255,0.35),transparent_55%)] transition-transform duration-500 group-hover:scale-110" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent opacity-80 transition group-hover:opacity-95" />
        {project.trending ? (
          <span className="absolute top-3 left-3 rounded-full bg-orange-500/90 px-2.5 py-1 text-[10px] font-semibold text-white shadow-sm">
            Trending
          </span>
        ) : (
          <span className="absolute top-3 left-3 rounded-full bg-white/20 px-2.5 py-1 text-[10px] font-semibold text-white backdrop-blur">
            Community
          </span>
        )}
        <div className="absolute inset-x-4 bottom-4 flex translate-y-2 gap-2 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          <Button
            size="sm"
            variant="secondary"
            className="rounded-xl bg-white/95 text-foreground hover:bg-white"
          >
            View Project
          </Button>
          <Button
            size="sm"
            className="rounded-xl"
            onClick={() => onRequestAccess(project)}
          >
            Request Access
          </Button>
          <button
            type="button"
            className="ml-auto inline-flex size-8 items-center justify-center rounded-xl bg-white/20 text-white backdrop-blur transition hover:bg-white/30"
            aria-label="Pin"
          >
            <PinIcon className="size-3.5" />
          </button>
        </div>
      </div>

      <div className="space-y-3 p-4">
        <div className="flex items-start gap-3">
          <span
            className="mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold text-white"
            style={{ backgroundColor: project.owner.color }}
          >
            {project.owner.initials}
          </span>
          <div className="min-w-0">
            <h3 className="truncate text-[15px] font-semibold tracking-tight">
              {project.name}
            </h3>
            <p className="text-[11px] text-muted-foreground">
              by {project.owner.name}
            </p>
          </div>
        </div>

        <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
          {project.description}
        </p>

        <div className="flex flex-wrap gap-1.5">
          {project.tech.map((tech) => (
            <TechBadge key={tech} label={tech} />
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <StarIcon className="size-3.5 text-amber-500" />
            {project.stars?.toLocaleString()}
          </span>
          <span className="inline-flex items-center gap-1">
            <GitForkIcon className="size-3.5" />
            {project.forks?.toLocaleString()}
          </span>
          <span className="inline-flex items-center gap-1">
            <EyeIcon className="size-3.5" />
            {project.views?.toLocaleString()}
          </span>
          <span className="inline-flex items-center gap-1">
            <DownloadIcon className="size-3.5" />
            {project.downloads?.toLocaleString()}
          </span>
        </div>
      </div>
    </motion.article>
  );
}
