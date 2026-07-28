"use client";

import { PlayCircleIcon, SparklesIcon, UploadCloudIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toGitHubUrl } from "@/features/github/lib/github-url";
import { ProjectDetailsInlineDemo } from "@/features/projects/components/project-details/project-details-inline-demo";
import type {
  ProjectDetailsData,
  ProjectDetailsDemo,
} from "@/features/projects/lib/project-details-types";
import { isProjectLinkedToGitHub } from "@/features/projects/lib/project-details-utils";
import { cn } from "@/lib/utils";
import Image from "next/image";

type ProjectDetailsHeroProps = {
  details: ProjectDetailsData;
  demo: ProjectDetailsDemo | null;
  canManageDemo: boolean;
  canOpen: boolean;
  opening: boolean;
  requestStatus?: "pending" | "approved" | "denied";
  canPushToGitHub: boolean;
  showDemoButton: boolean;
  hasDemo: boolean;
  onOpenWorkspace: () => void;
  onRequestAccess: () => void;
  onBecomeSponsor: () => void;
  onPushToGitHub: () => void;
  onOpenDemo: () => void;
};

export function ProjectDetailsHero({
  details,
  demo,
  canManageDemo,
  canOpen,
  opening,
  requestStatus,
  canPushToGitHub,
  showDemoButton,
  hasDemo,
  onOpenWorkspace,
  onRequestAccess,
  onBecomeSponsor,
  onPushToGitHub,
  onOpenDemo,
}: ProjectDetailsHeroProps) {
  const isGitHubLinked = isProjectLinkedToGitHub(details);
  const showInlineDemo = hasDemo || canManageDemo;

  function scrollToDemo() {
    document
      .getElementById("project-demo")
      ?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  return (
    <div
      className={cn(
        "grid",
        showInlineDemo && "lg:grid-cols-[minmax(0,1fr)_min(420px,38%)]",
      )}
    >
      <div className={cn("relative min-h-56 md:min-h-72", details.coverTone)}>
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
              {showDemoButton && !showInlineDemo ? (
                <Button
                  variant="secondary"
                  className="rounded-xl bg-white/95 text-slate-900 hover:bg-white"
                  onClick={onOpenDemo}
                >
                  <PlayCircleIcon className="size-4" />
                  {hasDemo ? "Watch a demo" : "Add demo video"}
                </Button>
              ) : null}
              {showDemoButton && showInlineDemo && hasDemo ? (
                <Button
                  variant="secondary"
                  className="rounded-xl bg-white/95 text-slate-900 hover:bg-white lg:hidden"
                  onClick={scrollToDemo}
                >
                  <PlayCircleIcon className="size-4" />
                  Watch demo
                </Button>
              ) : null}
              <Button
                variant="secondary"
                className="rounded-xl bg-white/95 text-slate-900 hover:bg-white"
                onClick={onBecomeSponsor}
              >
                <SparklesIcon className="size-4" />
                Become a sponsor
              </Button>
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
              {isGitHubLinked && details.githubRepoUrl ? (
                <Button
                  variant="secondary"
                  className="rounded-xl bg-white/95 text-slate-900 hover:bg-white"
                  asChild
                >
                  <a
                    href={toGitHubUrl(details.githubRepoUrl, {
                      branch: details.githubBranch,
                    })}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Image
                      src="/images/github.png"
                      alt="GitHub"
                      width={20}
                      height={20}
                      className="size-5"
                    />
                    GitHub
                  </a>
                </Button>
              ) : canPushToGitHub ? (
                <Button
                  variant="secondary"
                  className="rounded-xl bg-white/95 text-slate-900 hover:bg-white"
                  onClick={onPushToGitHub}
                >
                  <UploadCloudIcon className="size-4" />
                  Push to GitHub
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {showInlineDemo ? (
        <ProjectDetailsInlineDemo
          demo={demo}
          canManageDemo={canManageDemo}
          onManageDemo={onOpenDemo}
          className="border-t lg:border-t-0"
        />
      ) : null}
    </div>
  );
}
