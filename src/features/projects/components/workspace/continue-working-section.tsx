"use client";

import { ContinueProjectCard } from "@/features/projects/components/workspace/continue-project-card";
import { SectionHeader } from "@/features/projects/components/workspace/section-header";
import { useExpireStaleImports } from "@/features/projects/hooks/use-expire-stale-imports";
import type { WorkspaceProject } from "@/features/projects/lib/projects-workspace-types";

type ContinueWorkingSectionProps = {
  projects: WorkspaceProject[];
};

function importRank(project: WorkspaceProject) {
  if (project.importStatus === "importing") return 0;
  if (project.importStatus === "failed") return 1;
  return 2;
}

export function ContinueWorkingSection({
  projects,
}: ContinueWorkingSectionProps) {
  useExpireStaleImports(projects);

  // Prefer live / failed clones so the optimistic card is always visible.
  const recent = [...projects]
    .filter((project) => !project.pinned)
    .sort((a, b) => importRank(a) - importRank(b))
    .slice(0, 4);

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
