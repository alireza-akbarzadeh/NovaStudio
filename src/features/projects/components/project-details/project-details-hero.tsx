"use client";

import { GitBranchIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ProjectDetailsData } from "@/features/projects/lib/project-details-types";
import { cn } from "@/lib/utils";

type ProjectDetailsHeroProps = {
  details: ProjectDetailsData;
  canOpen: boolean;
  opening: boolean;
  requestStatus?: "pending" | "approved" | "denied";
  onOpenWorkspace: () => void;
  onRequestAccess: () => void;
};

export function ProjectDetailsHero({
  details,
  canOpen,
  opening,
  requestStatus,
  onOpenWorkspace,
  onRequestAccess,
}: ProjectDetailsHeroProps) {
  return (
    <div className={cn("relative h-56 md:h-72", details.coverTone)}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.35),transparent_55%)]" />
        <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/20 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-6 md:p-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="min-w-0">
              <div className="mb-3 flex flex-wrap gap-2">
                <Badge className="rounded-full bg-white/15 text-white backdrop-blur">
                  Public
                </Badge>
                <Badge variant="secondary" className="rounded-full capitalize">
                  {details.status.replace("-", " ")}
                </Badge>
              </div>
              <h1 className="text-3xl font-semibold tracking-tight text-white md:text-4xl">
                {details.name}
              </h1>
              <p className="mt-2 flex items-center gap-2 text-sm text-white/80">
                <span
                  className="inline-flex size-7 items-center justify-center rounded-full text-[10px] font-semibold text-white"
                  style={{ backgroundColor: details.owner.color }}
                >
                  {details.owner.initials}
                </span>
                by {details.owner.name}
                <span className="text-white/50">·</span>
                Updated {details.lastUpdated}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {canOpen ? (
                <Button
                  className="rounded-xl"
                  disabled={opening}
                  onClick={onOpenWorkspace}
                >
                  {opening ? "Opening…" : "Open workspace"}
                </Button>
              ) : requestStatus === "pending" ? (
                <Button className="rounded-xl" disabled>
                  Request pending
                </Button>
              ) : (
                <Button className="rounded-xl" onClick={onRequestAccess}>
                  {requestStatus === "denied"
                    ? "Request again"
                    : "Request access"}
                </Button>
              )}
              {details.githubRepoUrl ? (
                <Button
                  variant="secondary"
                  className="rounded-xl bg-white/95 text-slate-900 hover:bg-white"
                  asChild
                >
                  <a
                    href={details.githubRepoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <GitBranchIcon className="size-4" />
                    GitHub
                  </a>
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      </div>
  );
}
