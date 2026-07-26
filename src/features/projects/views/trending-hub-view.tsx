"use client";

import { HubPageHeader } from "@/features/projects/components/workspace/hub-page-header";
import { TrendingProjectCard } from "@/features/projects/components/workspace/trending-project-card";
import { usePublicProjects } from "@/features/projects/hooks/use-workspace";
import type { WorkspaceProject } from "@/features/projects/lib/projects-workspace-types";
import { Skeleton } from "@/components/ui/skeleton";

export function TrendingHubView() {
  const publicProjects = usePublicProjects(24);
  const trending = ((publicProjects ?? []) as WorkspaceProject[]).slice(0, 24);

  return (
    <div className="mx-auto w-full max-w-5xl">
      <HubPageHeader
        title="Trending"
        description="Recently updated public community workspaces."
      />

      {publicProjects === undefined ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-2xl" />
          ))}
        </div>
      ) : trending.length === 0 ? (
        <div className="rounded-[22px] border border-dashed border-border/70 bg-card/50 px-6 py-16 text-center">
          <p className="text-sm text-muted-foreground">
            No public projects yet. Make a project public to appear here.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {trending.map((project, index) => (
            <TrendingProjectCard
              key={project.id}
              project={project}
              index={index}
              fill
            />
          ))}
        </div>
      )}
    </div>
  );
}
