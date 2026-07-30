"use client";

import { ProjectDetailsTechStack } from "@/features/projects/components/project-details/project-details-tech-stack";
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

      <div className="mt-5">
        <ProjectDetailsTechStack tech={details.tech} />
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
