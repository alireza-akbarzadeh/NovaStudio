"use client";

import { SparklesIcon } from "lucide-react";

import { CommunityProjectCard } from "@/features/projects/components/workspace/community-project-card";
import { SectionHeader } from "@/features/projects/components/workspace/section-header";
import type { WorkspaceProject } from "@/features/projects/lib/projects-workspace-types";

type FeaturedProjectsSectionProps = {
  projects: WorkspaceProject[];
  onRequestAccess: (project: WorkspaceProject) => void;
};

export function FeaturedProjectsSection({
  projects,
  onRequestAccess,
}: FeaturedProjectsSectionProps) {
  if (projects.length === 0) return null;

  return (
    <section className="mb-10">
      <SectionHeader
        eyebrow="Spotlight"
        title="Featured projects"
        description="Public workspaces highlighted by their creators on the community hub."
      />
      <div className="flex gap-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {projects.map((project, index) => (
          <div
            key={project.id}
            className="w-[min(100%,320px)] shrink-0 sm:w-[320px]"
          >
            <CommunityProjectCard
              project={project}
              index={index}
              onRequestAccess={onRequestAccess}
            />
          </div>
        ))}
      </div>
      <p className="mt-3 inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <SparklesIcon className="size-3.5 text-primary" />
        Project owners can feature public workspaces from Share settings or the
        project page.
      </p>
    </section>
  );
}
