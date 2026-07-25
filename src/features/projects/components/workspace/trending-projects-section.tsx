"use client";

import { SectionHeader } from "@/features/projects/components/workspace/section-header";
import { TrendingProjectCard } from "@/features/projects/components/workspace/trending-project-card";
import type { WorkspaceProject } from "@/features/projects/lib/projects-workspace-types";

type TrendingProjectsSectionProps = {
  projects: WorkspaceProject[];
};

export function TrendingProjectsSection({
  projects,
}: TrendingProjectsSectionProps) {
  const trending = projects
    .filter((project) => project.trending || (project.weeklyStars ?? 0) > 0)
    .sort((a, b) => (b.weeklyStars ?? 0) - (a.weeklyStars ?? 0));

  return (
    <section>
      <SectionHeader
        eyebrow="This week"
        title="Trending Projects"
        description="Most starred, cloned, and recently active community workspaces."
      />
      <div className="flex gap-3 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {trending.map((project, index) => (
          <TrendingProjectCard
            key={project.id}
            project={project}
            index={index}
          />
        ))}
      </div>
    </section>
  );
}
