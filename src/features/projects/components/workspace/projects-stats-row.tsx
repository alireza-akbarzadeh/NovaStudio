"use client";

import { ProjectsStatCard } from "@/features/projects/components/workspace/projects-stat-card";
import { useWorkspaceStats } from "@/features/projects/hooks/use-workspace";
import { Skeleton } from "@/components/ui/skeleton";
import type { ProjectFilter } from "@/features/projects/lib/projects-workspace-types";

type ProjectsStatsRowProps = {
  onFilterChange?: (filter: ProjectFilter) => void;
};

const STAT_FILTER: Record<string, ProjectFilter> = {
  pinned: "pinned",
  recent: "recent",
  shared: "shared",
  public: "public",
};

export function ProjectsStatsRow({ onFilterChange }: ProjectsStatsRowProps) {
  const stats = useWorkspaceStats();

  if (stats === undefined) {
    return (
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-32 rounded-[20px]" />
        ))}
      </section>
    );
  }

  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat, index) => (
        <ProjectsStatCard
          key={stat.id}
          stat={stat}
          index={index}
          onClick={
            onFilterChange && STAT_FILTER[stat.id]
              ? () => onFilterChange(STAT_FILTER[stat.id]!)
              : undefined
          }
        />
      ))}
    </section>
  );
}
