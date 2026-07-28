"use client";

import {
  DownloadIcon,
  EyeIcon,
  GitForkIcon,
  PinIcon,
  StarIcon,
} from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import type { Id } from "@/convex/_generated/dataModel";
import { parseConvexErrorMessage } from "@/features/github/lib/github-errors";
import { TechBadge } from "@/features/projects/components/workspace/tech-badge";
import { useToggleProjectStar } from "@/features/projects/hooks/use-project-details";
import type { WorkspaceProject } from "@/features/projects/lib/projects-workspace-types";
import { cn } from "@/lib/utils";

type CommunityProjectCardProps = {
  project: WorkspaceProject;
  index: number;
  onRequestAccess: (project: WorkspaceProject) => void;
};

function formatCount(value?: number) {
  const n = value ?? 0;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return n.toLocaleString();
}

export function CommunityProjectCard({
  project,
  index,
  onRequestAccess,
}: CommunityProjectCardProps) {
  const toggleStar = useToggleProjectStar();
  const detailsHref = `/projects/community/${project.id}`;
  const isMember = project.isMember ?? false;
  const requestStatus = project.accessRequestStatus;
  const [starred, setStarred] = useState(false);
  const [stars, setStars] = useState(project.stars ?? 0);
  const [starPending, setStarPending] = useState(false);

  const requestLabel =
    requestStatus === "pending"
      ? "Request pending"
      : requestStatus === "denied"
        ? "Request again"
        : "Request Access";

  async function handleStar() {
    setStarPending(true);
    try {
      const result = await toggleStar({
        projectId: project.id as Id<"projects">,
      });
      setStarred(result.starred);
      setStars(result.stars);
    } catch (error) {
      toast.error(parseConvexErrorMessage(error, "Could not star project"));
    } finally {
      setStarPending(false);
    }
  }

  return (
    <motion.article
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.12 + index * 0.05, duration: 0.35 }}
      className="group relative overflow-hidden rounded-[24px] border border-border/60 bg-card/90 shadow-[0_18px_50px_-32px_rgba(76,29,149,0.55)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_30px_70px_-34px_rgba(76,29,149,0.6)]"
    >
      <div className={cn("relative h-44 overflow-hidden", project.coverTone)}>
        <Link
          href={detailsHref}
          className="absolute inset-0 block"
          aria-label={`View ${project.name} details`}
        >
          <div className="absolute inset-0 scale-100 bg-[radial-gradient(circle_at_25%_20%,rgba(255,255,255,0.35),transparent_55%)] transition-transform duration-500 group-hover:scale-110" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent opacity-80 transition group-hover:opacity-95" />
        </Link>
        {project.trending ? (
          <span className="pointer-events-none absolute top-3 left-3 rounded-full bg-orange-500/90 px-2.5 py-1 text-[10px] font-semibold text-white shadow-sm">
            Trending
          </span>
        ) : (
          <span className="pointer-events-none absolute top-3 left-3 rounded-full bg-white/20 px-2.5 py-1 text-[10px] font-semibold text-white backdrop-blur">
            Community
          </span>
        )}
        <div className="absolute inset-x-4 bottom-4 z-10 flex translate-y-2 gap-2 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          <Button
            size="sm"
            className="rounded-xl bg-white text-slate-900 shadow-sm hover:bg-white/90"
            asChild
          >
            <Link href={detailsHref}>View details</Link>
          </Button>
          {isMember ? null : (
            <Button
              size="sm"
              variant="secondary"
              className="rounded-xl bg-black/40 text-white backdrop-blur hover:bg-black/55"
              disabled={requestStatus === "pending"}
              onClick={() => onRequestAccess(project)}
            >
              {requestLabel}
            </Button>
          )}
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
        <Link href={detailsHref} className="flex items-start gap-3">
          <span
            className="mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold text-white"
            style={{ backgroundColor: project.owner.color }}
          >
            {project.owner.initials}
          </span>
          <div className="min-w-0">
            <h3 className="truncate text-[15px] font-semibold tracking-tight transition group-hover:text-primary">
              {project.name}
            </h3>
            <p className="text-[11px] text-muted-foreground">
              by {project.owner.name}
            </p>
          </div>
        </Link>

        <Link href={detailsHref}>
          <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
            {project.description}
          </p>
        </Link>

        <div className="flex flex-wrap gap-1.5">
          {project.tech.map((tech) => (
            <TechBadge key={tech} label={tech} />
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-muted-foreground">
          <button
            type="button"
            disabled={starPending}
            onClick={() => void handleStar()}
            className={cn(
              "inline-flex items-center gap-1 rounded-lg px-1.5 py-0.5 transition hover:bg-muted hover:text-foreground",
              starred && "text-amber-600 dark:text-amber-400",
            )}
          >
            <StarIcon
              className={cn(
                "size-3.5 text-amber-500",
                starred && "fill-current",
              )}
            />
            {formatCount(stars)}
          </button>
          <Link
            href={detailsHref}
            className="inline-flex items-center gap-1 rounded-lg px-1.5 py-0.5 transition hover:bg-muted hover:text-foreground"
          >
            <GitForkIcon className="size-3.5" />
            {formatCount(project.forks)}
          </Link>
          <Link
            href={detailsHref}
            className="inline-flex items-center gap-1 rounded-lg px-1.5 py-0.5 transition hover:bg-muted hover:text-foreground"
          >
            <EyeIcon className="size-3.5" />
            {formatCount(project.views)}
          </Link>
          <Link
            href={detailsHref}
            className="inline-flex items-center gap-1 rounded-lg px-1.5 py-0.5 transition hover:bg-muted hover:text-foreground"
          >
            <DownloadIcon className="size-3.5" />
            {formatCount(project.downloads)}
          </Link>
        </div>
      </div>
    </motion.article>
  );
}
