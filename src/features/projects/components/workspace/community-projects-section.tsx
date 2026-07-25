"use client";

import { CommunityProjectCard } from "@/features/projects/components/workspace/community-project-card";
import { SectionHeader } from "@/features/projects/components/workspace/section-header";
import type { WorkspaceProject } from "@/features/projects/lib/projects-workspace-types";

type CommunityProjectsSectionProps = {
  projects: WorkspaceProject[];
  onRequestAccess: (project: WorkspaceProject) => void;
};

export function CommunityProjectsSection({
  projects,
  onRequestAccess,
}: CommunityProjectsSectionProps) {
  const community = projects.filter(
    (project) => project.visibility === "public",
  );

  return (
    <section>
      <SectionHeader
        eyebrow="Discover"
        title="Community Projects"
        description="Explore public workspaces from developers around the world."
        actionLabel="Browse all"
        onAction={() => {}}
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {community.map((project, index) => (
          <CommunityProjectCard
            key={project.id}
            project={project}
            index={index}
            onRequestAccess={onRequestAccess}
          />
        ))}
      </div>
    </section>
  );
}
