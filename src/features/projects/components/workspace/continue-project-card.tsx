"use client";

import {
  ArchiveIcon,
  CopyIcon,
  MoreHorizontalIcon,
  PinIcon,
  Share2Icon,
} from "lucide-react";
import { motion } from "motion/react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { MemberAvatars } from "@/features/projects/components/workspace/member-avatars";
import type { WorkspaceProject } from "@/features/projects/lib/projects-workspace-types";
import { cn } from "@/lib/utils";

const statusStyles = {
  "in-progress": "bg-violet-500/12 text-violet-700 dark:text-violet-300",
  review: "bg-orange-500/12 text-orange-700 dark:text-orange-300",
  shipped: "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300",
  archived: "bg-rose-500/12 text-rose-700 dark:text-rose-300",
} as const;

const statusLabel = {
  "in-progress": "In Progress",
  review: "Review",
  shipped: "Shipped",
  archived: "Archived",
} as const;

type ContinueProjectCardProps = {
  project: WorkspaceProject;
  index: number;
};

export function ContinueProjectCard({
  project,
  index,
}: ContinueProjectCardProps) {
  const router = useRouter();

  return (
    <motion.article
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 + index * 0.04, duration: 0.32 }}
      className="group relative overflow-hidden rounded-[22px] border border-border/60 bg-card/85 p-4 shadow-[0_14px_40px_-30px_rgba(76,29,149,0.45)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_55px_-28px_rgba(76,29,149,0.5)]"
    >
      <div className="flex gap-4">
        <div
          className={cn(
            "relative h-20 w-24 shrink-0 overflow-hidden rounded-2xl",
            project.coverTone,
          )}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.3),transparent_60%)]" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="mb-1.5 flex flex-wrap items-center gap-2">
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                    statusStyles[project.status],
                  )}
                >
                  {statusLabel[project.status]}
                </span>
              </div>
              <h3 className="truncate text-[15px] font-semibold tracking-tight">
                {project.name}
              </h3>
              <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                {project.description}
              </p>
            </div>
            <button
              type="button"
              className="inline-flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground"
              aria-label="More"
            >
              <MoreHorizontalIcon className="size-4" />
            </button>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-[11px] text-muted-foreground">
            <span>{project.lastOpened}</span>
            <span>Edited by {project.lastEditedBy}</span>
            <MemberAvatars members={project.members} />
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <div className="flex gap-1 opacity-0 transition group-hover:opacity-100">
          {[
            { icon: PinIcon, label: "Pin" },
            { icon: CopyIcon, label: "Duplicate" },
            { icon: ArchiveIcon, label: "Archive" },
            { icon: Share2Icon, label: "Share" },
          ].map(({ icon: Icon, label }) => (
            <button
              key={label}
              type="button"
              title={label}
              className="inline-flex size-8 items-center justify-center rounded-xl text-muted-foreground transition hover:bg-primary/8 hover:text-primary"
            >
              <Icon className="size-3.5" />
            </button>
          ))}
        </div>
        <Button
          size="sm"
          className="rounded-xl"
          onClick={() => router.push("/projects/new")}
        >
          Open Project
        </Button>
      </div>
    </motion.article>
  );
}
