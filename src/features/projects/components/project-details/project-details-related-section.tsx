"use client";

import { LayersIcon, StarIcon, UserIcon } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { TechBadge } from "@/features/projects/components/workspace/tech-badge";
import type { ProjectDetailsRelatedProject } from "@/features/projects/lib/project-details-types";
import { formatProjectCount } from "@/features/projects/lib/project-details-utils";
import { cn } from "@/lib/utils";

type ProjectDetailsRelatedSectionProps = {
  projects: ProjectDetailsRelatedProject[];
};

function relationLabel(project: ProjectDetailsRelatedProject) {
  if (project.relation === "both") {
    return "Same owner & tech";
  }
  if (project.relation === "same-owner") {
    return "Same owner";
  }
  return project.matchedTech.length > 0
    ? `Uses ${project.matchedTech[0]}`
    : "Similar stack";
}

function relationIcon(relation: ProjectDetailsRelatedProject["relation"]) {
  if (relation === "same-owner" || relation === "both") {
    return UserIcon;
  }
  return LayersIcon;
}

export function ProjectDetailsRelatedSection({
  projects,
}: ProjectDetailsRelatedSectionProps) {
  if (projects.length === 0) return null;

  return (
    <section className="rounded-[24px] border border-border/60 bg-card/85 p-6">
      <div className="mb-4">
        <h2 className="text-lg font-semibold tracking-tight">
          Related projects
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          More public workspaces with a similar stack or the same creator.
        </p>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {projects.map((project, index) => {
          const RelationIcon = relationIcon(project.relation);
          return (
            <motion.article
              key={project.id}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.06 + index * 0.04, duration: 0.28 }}
              className="w-[min(100%,280px)] shrink-0 overflow-hidden rounded-[22px] border border-border/60 bg-card/90 shadow-[0_14px_40px_-28px_rgba(76,29,149,0.45)]"
            >
              <Link
                href={`/projects/community/${project.id}`}
                className="group block"
              >
                <div
                  className={cn(
                    "relative h-24 overflow-hidden",
                    project.coverTone,
                  )}
                >
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.3),transparent_60%)]" />
                  <div className="absolute inset-0 bg-linear-to-t from-black/50 to-transparent" />
                  <Badge className="absolute top-3 left-3 rounded-full bg-black/35 text-white backdrop-blur">
                    <RelationIcon className="mr-1 size-3" />
                    {relationLabel(project)}
                  </Badge>
                </div>

                <div className="space-y-3 p-4">
                  <div className="flex items-start gap-2.5">
                    <span
                      className="inline-flex size-8 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold text-white"
                      style={{ backgroundColor: project.owner.color }}
                    >
                      {project.owner.initials}
                    </span>
                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-semibold tracking-tight transition group-hover:text-primary">
                        {project.name}
                      </h3>
                      <p className="text-[11px] text-muted-foreground">
                        by {project.owner.name}
                      </p>
                    </div>
                  </div>

                  <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                    {project.description}
                  </p>

                  <div className="flex flex-wrap gap-1.5">
                    {project.tech.map((tech) => (
                      <TechBadge key={tech} label={tech} />
                    ))}
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <StarIcon className="size-3.5 text-amber-500" />
                      {formatProjectCount(project.stars)}
                    </span>
                    <span>{project.lastUpdated}</span>
                  </div>
                </div>
              </Link>
            </motion.article>
          );
        })}
      </div>
    </section>
  );
}
