"use client";

import { formatDistanceToNow } from "date-fns";
import { ArrowRightIcon } from "lucide-react";
import { motion } from "motion/react";

import type { Doc } from "@/convex/_generated/dataModel";
import { useImportStatusLabel } from "@/features/projects/hooks/use-import-status-label";
import { IMPORT_ETA_MS } from "@/features/projects/lib/import-status";
import { cn } from "@/lib/utils";

import { AlertCircleIcon, FolderOpenIcon, Loader2Icon } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";

export const getProjectsIcons = (project: Doc<"projects">) => {
  if (project.source === "github" || project.importStatus) {
    if (project.importStatus === "failed") {
      return <AlertCircleIcon className="size-3.5 text-muted-foreground" />;
    }
    if (project.importStatus === "importing") {
      return <Loader2Icon className="size-3.5 text-muted-foreground animate-spin" />;
    }
    return <Image src="/images/github.png" alt="GitHub" width={14} height={14} className="size-3.5 dark:invert" />;
  }
  return <FolderOpenIcon className="size-3.5 text-muted-foreground " />
};

function useImportProgress(project: Doc<"projects">) {
  const [now, setNow] = useState(() => Date.now());
  const isImporting = project.importStatus === "importing";

  useEffect(() => {
    if (!isImporting) return;
    setNow(Date.now());
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [isImporting, project.importStartedAt]);

  if (!isImporting) return null;

  const startedAt = project.importStartedAt ?? now;
  const elapsed = Math.max(0, now - startedAt);
  return Math.min(95, Math.round((elapsed / IMPORT_ETA_MS) * 100));
}

export function ProjectRow({
  project,
  index,
  onOpen,
}: {
  project: Doc<"projects">;
  index: number;
  onOpen?: (project: Doc<"projects">) => void;
}) {
  const status = useImportStatusLabel(project);
  const progress = useImportProgress(project);
  const isImporting = project.importStatus === "importing";

  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      onClick={() => {
        if (isImporting) return;
        onOpen?.(project);
      }}
      disabled={isImporting}
      className={cn(
        "group relative flex w-full items-center gap-3 px-3 py-2.5 text-left outline-none",
        "rounded-sm transition-colors duration-150",
        isImporting
          ? "cursor-default opacity-90"
          : "hover:bg-foreground/6 focus-visible:bg-foreground/6 focus-visible:ring-1 focus-visible:ring-ring/40",
      )}
    >
      <span className="flex size-8 shrink-0 items-center justify-center rounded-sm bg-foreground/6 text-muted-foreground transition-colors group-hover:bg-ring/15 group-hover:text-ring">
        {getProjectsIcons(project)}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13px] font-medium tracking-tight text-foreground">
          {project.name}
        </span>
        <span className="mt-0.5 block truncate font-mono text-[11px] text-muted-foreground">
          {status ??
            `Updated ${formatDistanceToNow(project.updatedAt, { addSuffix: true })}`}
        </span>
        {progress !== null ? (
          <span className="mt-1.5 block h-1 overflow-hidden rounded-full bg-foreground/8">
            <span
              className="block h-full rounded-full bg-ring/70 transition-[width] duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </span>
        ) : null}
      </span>
      {!isImporting ? (
        <ArrowRightIcon className="size-3.5 shrink-0 text-muted-foreground opacity-0 transition-all duration-150 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0" />
      ) : null}
    </motion.button>
  );
}
