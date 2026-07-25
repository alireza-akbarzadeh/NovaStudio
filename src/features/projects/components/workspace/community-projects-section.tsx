"use client";

import { CommunityProjectCard } from "@/features/projects/components/workspace/community-project-card";
import { SectionHeader } from "@/features/projects/components/workspace/section-header";
import { usePublicProjects } from "@/features/projects/hooks/use-workspace";
import type { WorkspaceProject } from "@/features/projects/lib/projects-workspace-types";

type CommunityProjectsSectionProps = {
  onRequestAccess: (project: WorkspaceProject) => void;
};

export function CommunityProjectsSection({
  onRequestAccess,
}: CommunityProjectsSectionProps) {
  const publicProjects = usePublicProjects();
  const community = (publicProjects ?? []) as WorkspaceProject[];

  return (
    <section>
      <SectionHeader
        eyebrow="Discover"
        title="Community Projects"
        description="Explore public workspaces from developers around the world."
        actionLabel="Browse all"
        onAction={() => {}}
      />
      {publicProjects === undefined ? (
        <p className="text-sm text-muted-foreground">Loading community…</p>
      ) : community.length === 0 ? (
        <p className="rounded-[22px] border border-dashed border-border/70 bg-card/50 px-6 py-10 text-center text-sm text-muted-foreground">
          No public projects yet. Mark a project as public to appear here.
        </p>
      ) : (
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
      )}
    </section>
  );
}
