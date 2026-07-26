"use client";

import {
  ArchiveIcon,
  CopyIcon,
  Loader2Icon,
  MoreHorizontalIcon,
  PinIcon,
  RotateCcwIcon,
  Share2Icon,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useRetryGitHubClone } from "@/features/github/hooks/use-github-connection";
import { MemberAvatars } from "@/features/projects/components/workspace/member-avatars";
import { useOpenWorkspaceProject } from "@/features/projects/hooks/use-open-workspace-project";
import { parseConvexErrorMessage } from "@/features/github/lib/github-errors";
import {
  formatImportDuration,
  IMPORT_ETA_MS,
} from "@/features/projects/lib/import-status";
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

function useImportProgress(project: WorkspaceProject) {
  const isImporting = project.importStatus === "importing";
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!isImporting) return;
    setNow(Date.now());
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [isImporting, project.importStartedAt]);

  if (!isImporting) {
    return { isImporting: false, progress: null as number | null, label: null as string | null };
  }

  const startedAt = project.importStartedAt ?? now;
  const elapsed = Math.max(0, now - startedAt);
  const remaining = Math.max(0, IMPORT_ETA_MS - elapsed);
  const progress = Math.min(95, Math.round((elapsed / IMPORT_ETA_MS) * 100));
  const label =
    remaining > 0
      ? `Cloning from GitHub… ~${formatImportDuration(remaining)} left`
      : `Cloning from GitHub… ${formatImportDuration(elapsed)} elapsed`;

  return { isImporting: true, progress, label };
}

export function ContinueProjectCard({
  project,
  index,
}: ContinueProjectCardProps) {
  const { openProject, isPending } = useOpenWorkspaceProject();
  const { retry, isRetrying } = useRetryGitHubClone();
  const { isImporting, progress, label } = useImportProgress(project);
  const isFailed = project.importStatus === "failed";

  const handleRetry = async () => {
    try {
      await retry(project.id);
      toast.success("Retrying GitHub import — watch this card for progress");
    } catch (error) {
      toast.error(parseConvexErrorMessage(error, "Could not retry import"));
    }
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 + index * 0.04, duration: 0.32 }}
      className={cn(
        "group relative overflow-hidden rounded-[22px] border bg-card/85 p-4 shadow-[0_14px_40px_-30px_rgba(76,29,149,0.45)] backdrop-blur-xl transition-all duration-300",
        isImporting
          ? "border-violet-500/40"
          : isFailed
            ? "border-rose-500/35"
            : "border-border/60 hover:-translate-y-1 hover:shadow-[0_24px_55px_-28px_rgba(76,29,149,0.5)]",
      )}
    >
      <div className="flex gap-4">
        <div
          className={cn(
            "relative h-20 w-24 shrink-0 overflow-hidden rounded-2xl",
            project.coverTone,
          )}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.3),transparent_60%)]" />
          {isImporting ? (
            <div className="absolute inset-0 flex items-center justify-center bg-black/25">
              <Loader2Icon className="size-6 animate-spin text-white" />
            </div>
          ) : null}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="mb-1.5 flex flex-wrap items-center gap-2">
                {isImporting ? (
                  <span className="rounded-full bg-violet-500/15 px-2 py-0.5 text-[10px] font-semibold text-violet-700 dark:text-violet-300">
                    Cloning
                  </span>
                ) : isFailed ? (
                  <span className="rounded-full bg-rose-500/15 px-2 py-0.5 text-[10px] font-semibold text-rose-700 dark:text-rose-300">
                    Import failed
                  </span>
                ) : (
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                      statusStyles[project.status],
                    )}
                  >
                    {statusLabel[project.status]}
                  </span>
                )}
              </div>
              <h3 className="truncate text-[15px] font-semibold tracking-tight">
                {project.name}
              </h3>
              <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                {isImporting
                  ? (label ?? "Cloning from GitHub…")
                  : isFailed
                    ? "Clone failed — retry to pull the repository again."
                    : project.description}
              </p>
              {progress !== null ? (
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-foreground/8">
                  <div
                    className="h-full rounded-full bg-violet-500/80 transition-[width] duration-500 ease-out"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              ) : null}
            </div>
            <button
              type="button"
              className="inline-flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground"
              aria-label="More"
            >
              <MoreHorizontalIcon className="size-4" />
            </button>
          </div>

          {!isImporting && !isFailed ? (
            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-[11px] text-muted-foreground">
              <span>{project.lastOpened}</span>
              <span>Edited by {project.lastEditedBy}</span>
              <MemberAvatars members={project.members} />
            </div>
          ) : null}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <div className="flex gap-1 opacity-0 transition group-hover:opacity-100">
          {[
            { icon: PinIcon, label: "Pin" },
            { icon: CopyIcon, label: "Duplicate" },
            { icon: ArchiveIcon, label: "Archive" },
            { icon: Share2Icon, label: "Share" },
          ].map(({ icon: Icon, label: actionLabel }) => (
            <button
              key={actionLabel}
              type="button"
              title={actionLabel}
              disabled={isImporting || isFailed}
              className="inline-flex size-8 items-center justify-center rounded-xl text-muted-foreground transition hover:bg-primary/8 hover:text-primary disabled:opacity-40"
            >
              <Icon className="size-3.5" />
            </button>
          ))}
        </div>

        {isImporting ? (
          <Button size="sm" className="rounded-xl" disabled>
            <Loader2Icon className="size-3.5 animate-spin" />
            Cloning…
          </Button>
        ) : isFailed ? (
          <Button
            size="sm"
            variant="outline"
            className="rounded-xl"
            disabled={isRetrying}
            onClick={() => void handleRetry()}
          >
            {isRetrying ? (
              <Loader2Icon className="size-3.5 animate-spin" />
            ) : (
              <RotateCcwIcon className="size-3.5" />
            )}
            {isRetrying ? "Retrying…" : "Retry"}
          </Button>
        ) : (
          <Button
            size="sm"
            className="rounded-xl"
            disabled={isPending}
            onClick={() => openProject(project.id)}
          >
            {isPending ? "Opening…" : "Open Project"}
          </Button>
        )}
      </div>
    </motion.article>
  );
}
