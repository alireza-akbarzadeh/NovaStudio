"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { ProjectDetailsContributor } from "@/features/projects/lib/project-details-types";

type ProjectDetailsContributorsSectionProps = {
  contributors: ProjectDetailsContributor[];
  contributorCount: number;
};

export function ProjectDetailsContributorsSection({
  contributors,
  contributorCount,
}: ProjectDetailsContributorsSectionProps) {
  return (
    <section className="rounded-[24px] border border-border/60 bg-card/85 p-6">
      <h2 className="text-lg font-semibold tracking-tight">Contributors</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        {contributorCount} people working on this project.
      </p>
      <ul className="mt-4 space-y-3">
        {contributors.map((member) => (
          <li
            key={member.id}
            className="flex items-center gap-3 rounded-xl border border-border/50 bg-muted/20 px-3 py-2.5"
          >
            <Avatar size="sm" style={{ boxShadow: `0 0 0 2px ${member.color}` }}>
              {member.imageUrl ? (
                <AvatarImage src={member.imageUrl} alt="" />
              ) : null}
              <AvatarFallback className="text-[10px]">
                {member.initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{member.name}</p>
              <p className="text-[11px] capitalize text-muted-foreground">
                {member.role}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
