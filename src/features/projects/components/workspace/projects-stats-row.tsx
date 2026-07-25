"use client";

import { ProjectsStatCard } from "@/features/projects/components/workspace/projects-stat-card";
import { WORKSPACE_STATS } from "@/features/projects/lib/projects-workspace-data";

export function ProjectsStatsRow() {
  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {WORKSPACE_STATS.map((stat, index) => (
        <ProjectsStatCard key={stat.id} stat={stat} index={index} />
      ))}
    </section>
  );
}
