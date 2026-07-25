"use client";

import { formatDistanceToNow } from "date-fns";
import { ArrowRightIcon } from "lucide-react";
import { motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import type { Doc } from "@/convex/_generated/dataModel";
import { ProjectListSkeleton } from "@/features/projects/components/project-list-loading";
import { getProjectsIcons, ProjectRow } from "@/features/projects/components/project-row";
import { useImportStatusLabel } from "@/features/projects/hooks/use-import-status-label";
import { useProjectPartial } from "@/features/projects/hooks/use-projects";
import { IMPORT_ETA_MS } from "@/features/projects/lib/import-status";
import { cn } from "@/lib/utils";

interface ProjectListProps {
  onViewAll: () => void;
}

function ContinueCard({
  project,
  onOpen,
}: {
  project: Doc<"projects">;
  onOpen: (project: Doc<"projects">) => void;
}) {
  const status = useImportStatusLabel(project);
  const isImporting = project.importStatus === "importing";
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!isImporting) return;
    setNow(Date.now());
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [isImporting, project.importStartedAt]);

  const progress = isImporting
    ? Math.min(
        95,
        Math.round(
          (Math.max(0, now - (project.importStartedAt ?? now)) / IMPORT_ETA_MS) *
            100,
        ),
      )
    : null;

  return (
    <div className="mb-3 px-1">
      <p className="mb-2 px-2 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
        {isImporting ? "Importing" : "Continue"}
      </p>
      <motion.button
        type="button"
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        onClick={() => {
          if (isImporting) return;
          onOpen(project);
        }}
        disabled={isImporting}
        className={cn(
          "group flex w-full items-center gap-3.5 rounded-sm border border-border/60 bg-background/40 px-3 py-3 text-left outline-none",
          "transition-colors duration-150",
          isImporting
            ? "cursor-default"
            : "hover:border-ring/30 hover:bg-foreground/6 focus-visible:bg-foreground/6 focus-visible:ring-1 focus-visible:ring-ring/40",
        )}
      >
        <span className="flex size-9 shrink-0 items-center justify-center rounded-sm border border-border/60 bg-background/40 text-muted-foreground transition-colors group-hover:border-ring/30 group-hover:text-ring">
          {getProjectsIcons(project)}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13px] font-medium tracking-tight text-foreground">
            {project.name}
          </span>
          <span className="mt-0.5 block truncate text-[12px] text-muted-foreground">
            {status ??
              `Updated ${formatDistanceToNow(project.updatedAt, { addSuffix: true })}`}
          </span>
          {progress !== null ? (
            <span className="mt-2 block h-1.5 overflow-hidden rounded-full bg-foreground/8">
              <span
                className="block h-full rounded-full bg-ring/70 transition-[width] duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </span>
          ) : null}
        </span>
        {!isImporting ? (
          <span className="flex shrink-0 items-center gap-1 text-[11px] text-muted-foreground transition-colors group-hover:text-foreground">
            Resume
            <ArrowRightIcon className="size-3.5 transition-transform duration-150 group-hover:translate-x-0.5" />
          </span>
        ) : null}
      </motion.button>
    </div>
  );
}

export function ProjectList({ onViewAll }: ProjectListProps) {
  const router = useRouter();
  const projects = useProjectPartial({ limit: 6 });

  const onOpenProject = (project: Doc<"projects">) => {
    router.push(`/projects/${project._id}`);
  };

  if (projects === undefined) {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="mb-2 flex items-baseline justify-between px-3">
          <h2 className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            Recent
          </h2>
        </div>
        <ProjectListSkeleton />
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="flex min-h-55 flex-1 flex-col items-center justify-center px-6 text-center">
        <p className="text-[13px] font-medium text-foreground/80">No projects yet</p>
        <p className="mt-1 max-w-55 text-[12px] leading-relaxed text-muted-foreground">
          Create a workspace or pull one from GitHub to get started.
        </p>
      </div>
    );
  }

  const importing = projects.find((project) => project.importStatus === "importing");
  const latest = importing ?? projects[0]!;
  const rest = projects.filter((project) => project._id !== latest._id);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <ContinueCard project={latest} onOpen={onOpenProject} />

      {rest.length > 0 ? (
        <>
          <div className="mb-2 flex items-baseline justify-between px-3">
            <h2 className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
              Recent
            </h2>
            <button
              type="button"
              onClick={onViewAll}
              className="text-[11px] text-muted-foreground transition-colors hover:text-foreground"
            >
              View all
            </button>
          </div>
          <div className="flex flex-col gap-0.5 overflow-y-auto">
            {rest.map((project, index) => (
              <ProjectRow
                key={project._id}
                project={project}
                index={index}
                onOpen={onOpenProject}
              />
            ))}
          </div>
        </>
      ) : (
        <div className="mt-auto flex justify-end px-3">
          <button
            type="button"
            onClick={onViewAll}
            className="text-[11px] text-muted-foreground transition-colors hover:text-foreground"
          >
            View all
          </button>
        </div>
      )}
    </div>
  );
}
