"use client";

import { ProjectsStatCard } from "@/features/projects/components/workspace/projects-stat-card";
import { useWorkspaceStats } from "@/features/projects/hooks/use-workspace";
import { Skeleton } from "@/components/ui/skeleton";

export function ProjectsStatsRow() {
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
        <ProjectsStatCard key={stat.id} stat={stat} index={index} />
      ))}
    </section>
  );
}
