"use client";

import { MoreHorizontalIcon, StarIcon } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import type { Id } from "@/convex/_generated/dataModel";
import { MemberAvatars } from "@/features/projects/components/workspace/member-avatars";
import { TechBadge } from "@/features/projects/components/workspace/tech-badge";
import { parseConvexErrorMessage } from "@/features/github/lib/github-errors";
import { useOpenWorkspaceProject } from "@/features/projects/hooks/use-open-workspace-project";
import { useTogglePin } from "@/features/projects/hooks/use-workspace";
import { communityProjectPath } from "@/features/projects/lib/project-details-share-utils";
import type { WorkspaceProject } from "@/features/projects/lib/projects-workspace-types";
import { cn } from "@/lib/utils";

type PinnedProjectCardProps = {
  project: WorkspaceProject;
  index: number;
};

export function PinnedProjectCard({ project, index }: PinnedProjectCardProps) {
  const router = useRouter();
  const togglePin = useTogglePin();
  const { openProject, isPending } = useOpenWorkspaceProject();
  const isPublic = project.visibility === "public";
  const detailsHref = communityProjectPath(project.id);

  const handleUnpin = async () => {
    try {
      await togglePin({ projectId: project.id as Id<"projects"> });
      toast.success("Unpinned");
    } catch (error) {
      toast.error(parseConvexErrorMessage(error, "Could not update pin"));
    }
  };

  function handleCardActivate() {
    if (isPublic) {
      router.push(detailsHref);
      return;
    }
    openProject(project.id);
  }

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.08 + index * 0.05, duration: 0.35 }}
      role="button"
      tabIndex={0}
      aria-label={
        isPublic ? `View ${project.name} details` : `Open ${project.name}`
      }
      aria-busy={isPending}
      onClick={handleCardActivate}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          handleCardActivate();
        }
      }}
      className="group relative flex min-w-[280px] max-w-[320px] shrink-0 cursor-pointer flex-col overflow-hidden rounded-[22px] border border-border/60 bg-card/85 shadow-[0_16px_48px_-32px_rgba(76,29,149,0.5)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_28px_60px_-30px_rgba(76,29,149,0.55)]"
    >
      <div className={cn("relative h-36 overflow-hidden", project.coverTone)}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.28),transparent_55%)]" />
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/35 to-transparent" />
        <button
          type="button"
          className="absolute top-3 right-3 inline-flex size-8 items-center justify-center rounded-full bg-black/25 text-amber-300 backdrop-blur transition hover:scale-105 hover:bg-black/35"
          aria-label="Unpin project"
          onClick={(event) => {
            event.stopPropagation();
            void handleUnpin();
          }}
        >
          <StarIcon className="size-4 fill-current" />
        </button>
        <button
          type="button"
          className="absolute top-3 left-3 inline-flex size-8 items-center justify-center rounded-full bg-black/20 text-white/90 opacity-0 backdrop-blur transition group-hover:opacity-100"
          aria-label="More actions"
          onClick={(event) => event.stopPropagation()}
        >
          <MoreHorizontalIcon className="size-4" />
        </button>
        {isPublic ? (
          <div className="absolute inset-x-3 bottom-3 flex translate-y-2 gap-2 opacity-0 transition group-hover:translate-y-0 group-hover:opacity-100">
            <Button
              size="sm"
              className="h-8 flex-1 rounded-xl bg-white/95 text-xs text-slate-900 hover:bg-white"
              asChild
              onClick={(event) => event.stopPropagation()}
            >
              <Link href={detailsHref}>Details</Link>
            </Button>
            <Button
              size="sm"
              className="h-8 flex-1 rounded-xl text-xs"
              disabled={isPending}
              onClick={(event) => {
                event.stopPropagation();
                openProject(project.id);
              }}
            >
              {isPending ? "…" : "Studio"}
            </Button>
          </div>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <h3 className="truncate text-[15px] font-semibold tracking-tight">
            {project.name}
          </h3>
          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
            {project.description}
          </p>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {project.tech.map((tech) => (
            <TechBadge key={tech} label={tech} />
          ))}
        </div>

        <div className="mt-auto flex items-center justify-between gap-2 pt-1">
          <MemberAvatars members={project.members} />
          <span className="text-[11px] text-muted-foreground">
            {project.lastUpdated}
          </span>
        </div>
      </div>

      <div className="h-1.5 bg-muted">
        <div
          className="h-full rounded-r-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all"
          style={{ width: `${project.progress}%` }}
        />
      </div>
    </motion.article>
  );
}
