"use client";

import { ContinueProjectCard } from "@/features/projects/components/workspace/continue-project-card";
import { SectionHeader } from "@/features/projects/components/workspace/section-header";
import type { WorkspaceProject } from "@/features/projects/lib/projects-workspace-types";

type ContinueWorkingSectionProps = {
  projects: WorkspaceProject[];
};

export function ContinueWorkingSection({
  projects,
}: ContinueWorkingSectionProps) {
  const recent = projects.filter((project) => !project.pinned).slice(0, 4);

  return (
    <section>
      <SectionHeader
        eyebrow="Recent"
        title="Continue Working"
        description="Pick up where you left off across your team workspaces."
        actionLabel="View all"
        onAction={() => {}}
      />
      <div className="grid gap-4 lg:grid-cols-2">
        {recent.map((project, index) => (
          <ContinueProjectCard
            key={project.id}
            project={project}
            index={index}
          />
        ))}
      </div>
    </section>
  );
}
