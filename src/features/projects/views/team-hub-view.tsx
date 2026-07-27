"use client";

import Link from "next/link";

import { HubPageHeader } from "@/features/projects/components/workspace/hub-page-header";
import { TeamPendingRequestsSection } from "@/features/projects/components/workspace/team-pending-requests-section";
import { useTeamDirectory } from "@/features/projects/hooks/use-workspace";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const roleBadge = {
  owner: "bg-violet-500/15 text-violet-700 dark:text-violet-300",
  editor: "bg-sky-500/15 text-sky-700 dark:text-sky-300",
  viewer: "bg-muted text-muted-foreground",
} as const;

export function TeamHubView() {
  const members = useTeamDirectory();

  return (
    <div className="mx-auto w-full max-w-4xl">
      <TeamPendingRequestsSection />

      <HubPageHeader
        title="Team"
        description="Everyone collaborating across your projects — invite more from a project’s sharing settings."
      />

      {members === undefined ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-2xl" />
          ))}
        </div>
      ) : members.length === 0 ? (
        <div className="rounded-[22px] border border-dashed border-border/70 bg-card/50 px-6 py-16 text-center backdrop-blur-xl">
          <h2 className="text-lg font-semibold tracking-tight">No teammates yet</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Open a project and invite collaborators from sharing settings. They’ll
            show up here across all workspaces you share.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {members.map((member) => (
            <li
              key={member.userId}
              className="rounded-[20px] border border-border/60 bg-card/80 p-4 backdrop-blur-xl"
            >
              <div className="flex items-start gap-3">
                <span
                  className="inline-flex size-11 shrink-0 items-center justify-center rounded-2xl text-sm font-semibold text-white"
                  style={{ backgroundColor: member.color }}
                >
                  {member.initials}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-semibold tracking-tight">
                      {member.name}
                    </p>
                    {member.roles.map((role) => (
                      <span
                        key={role}
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[10px] font-medium capitalize",
                          roleBadge[role],
                        )}
                      >
                        {role}
                      </span>
                    ))}
                  </div>
                  {member.email ? (
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {member.email}
                    </p>
                  ) : null}
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {member.projects.map((project) => (
                      <Link
                        key={`${member.userId}-${project.id}`}
                        href={`/projects/${project.id}`}
                        className="rounded-full bg-muted/70 px-2.5 py-1 text-[11px] text-muted-foreground transition hover:bg-primary/10 hover:text-primary"
                      >
                        {project.name}
                        <span className="ml-1 opacity-60">· {project.role}</span>
                      </Link>
                    ))}
                  </div>
                </div>
                <span className="shrink-0 text-[11px] text-muted-foreground">
                  {member.projects.length} project
                  {member.projects.length === 1 ? "" : "s"}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
