"use client";

import { useRouter } from "next/navigation";

import { SectionHeader } from "@/features/projects/components/workspace/section-header";
import { TrendingProjectCard } from "@/features/projects/components/workspace/trending-project-card";
import { usePublicProjects } from "@/features/projects/hooks/use-workspace";
import type { WorkspaceProject } from "@/features/projects/lib/projects-workspace-types";

export function TrendingProjectsSection() {
  const publicProjects = usePublicProjects();
  const trending = ((publicProjects ?? []) as WorkspaceProject[]).slice(0, 8);
  const router = useRouter();

  return (
    <section>
      <SectionHeader
        eyebrow="This week"
        title="Trending Projects"
        description="Most recently updated public community workspaces."
        actionLabel="See all"
        onAction={() => router.push("/projects/trending")}
      />
      {publicProjects === undefined ? (
        <p className="text-sm text-muted-foreground">Loading trending…</p>
      ) : trending.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Trending public projects will show up here.
        </p>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {trending.map((project, index) => (
            <TrendingProjectCard
              key={project.id}
              project={project}
              index={index}
            />
          ))}
        </div>
      )}
    </section>
  );
}
