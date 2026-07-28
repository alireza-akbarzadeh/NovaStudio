"use client";

import { TechBadge } from "@/features/projects/components/workspace/tech-badge";
import type { ProjectDetailsData } from "@/features/projects/lib/project-details-types";

type ProjectDetailsAboutSectionProps = {
  details: ProjectDetailsData;
};

export function ProjectDetailsAboutSection({
  details,
}: ProjectDetailsAboutSectionProps) {
  return (
    <section className="rounded-[24px] border border-border/60 bg-card/85 p-6">
      <h2 className="text-lg font-semibold tracking-tight">About</h2>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        {details.description}
      </p>
      <div className="mt-5 flex flex-wrap gap-2">
        {details.tech.map((tech) => (
          <TechBadge key={tech} label={tech} />
        ))}
      </div>
      {details.source ? (
        <p className="mt-4 text-xs text-muted-foreground">
          Built from{" "}
          <span className="font-medium text-foreground">
            {details.source === "github"
              ? "GitHub import"
              : details.templateId ?? details.source}
          </span>
          {details.progress ? ` · ${details.progress}% complete` : null}
        </p>
      ) : null}
    </section>
  );
}
