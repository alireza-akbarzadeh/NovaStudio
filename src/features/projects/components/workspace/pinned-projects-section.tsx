"use client";

import { PinIcon } from "lucide-react";

import { PinnedProjectCard } from "@/features/projects/components/workspace/pinned-project-card";
import { SectionHeader } from "@/features/projects/components/workspace/section-header";
import type { WorkspaceProject } from "@/features/projects/lib/projects-workspace-types";

type PinnedProjectsSectionProps = {
  projects: WorkspaceProject[];
  /** Unfiltered catalog — used so empty pin state is accurate while filtering. */
  allProjects?: WorkspaceProject[];
  onManagePins?: () => void;
};

export function PinnedProjectsSection({
  projects,
  allProjects,
  onManagePins,
}: PinnedProjectsSectionProps) {
  const pinned = projects.filter((project) => project.pinned);
  const catalogPinnedCount = (allProjects ?? projects).filter(
    (project) => project.pinned,
  ).length;

  return (
    <section>
      <SectionHeader
        eyebrow="Pinned"
        title="Pinned Projects"
        description="Your most important workspaces, always within reach."
        actionLabel="Manage pins"
        onAction={onManagePins}
      />
      {pinned.length > 0 ? (
        <div className="flex gap-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {pinned.map((project, index) => (
            <PinnedProjectCard
              key={project.id}
              project={project}
              index={index}
            />
          ))}
        </div>
      ) : (
        <div className="flex items-start gap-3 rounded-[20px] border border-dashed border-border/70 bg-card/50 px-4 py-5 text-sm text-muted-foreground">
          <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <PinIcon className="size-4" />
          </span>
          <div className="min-w-0">
            <p className="font-medium text-foreground/90">
              {catalogPinnedCount === 0
                ? "No pinned projects yet"
                : "No pinned projects in this filter"}
            </p>
            <p className="mt-1 text-[13px] leading-relaxed">
              {catalogPinnedCount === 0
                ? "Hover a project under Continue Working and click the pin icon to keep it here."
                : "Clear filters or open Manage pins to see everything you’ve pinned."}
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
