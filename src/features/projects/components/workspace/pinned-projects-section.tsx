"use client";

import { PinnedProjectCard } from "@/features/projects/components/workspace/pinned-project-card";
import { SectionHeader } from "@/features/projects/components/workspace/section-header";
import type { WorkspaceProject } from "@/features/projects/lib/projects-workspace-types";

type PinnedProjectsSectionProps = {
  projects: WorkspaceProject[];
};

export function PinnedProjectsSection({ projects }: PinnedProjectsSectionProps) {
  const pinned = projects.filter((project) => project.pinned);

  return (
    <section>
      <SectionHeader
        eyebrow="Pinned"
        title="Pinned Projects"
        description="Your most important workspaces, always within reach."
        actionLabel="Manage pins"
        onAction={() => {}}
      />
      <div className="flex gap-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {pinned.map((project, index) => (
          <PinnedProjectCard
            key={project.id}
            project={project}
            index={index}
          />
        ))}
      </div>
    </section>
  );
}
