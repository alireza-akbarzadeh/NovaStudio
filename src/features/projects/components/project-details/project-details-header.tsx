"use client";

import type { ProjectDetailsData } from "@/features/projects/lib/project-details-types";
import { ProjectDetailsHero } from "./project-details-hero";
import { ProjectDetailsStatsBar } from "./project-details-stats-bar";

type ProjectDetailsHeaderProps = {
  details: ProjectDetailsData;
  canOpen: boolean;
  opening: boolean;
  requestStatus?: "pending" | "approved" | "denied";
  starred: boolean;
  stars: number;
  starPending: boolean;
  onOpenWorkspace: () => void;
  onRequestAccess: () => void;
  onStar: () => void;
  onDownload: () => void;
  onBecomeSponsor: () => void;
  canPushToGitHub: boolean;
  onPushToGitHub: () => void;
  showDemoButton: boolean;
  hasDemo: boolean;
  onOpenDemo: () => void;
};

export function ProjectDetailsHeader({
  details,
  canOpen,
  opening,
  requestStatus,
  starred,
  stars,
  starPending,
  onOpenWorkspace,
  onRequestAccess,
  onStar,
  onDownload,
  onBecomeSponsor,
  canPushToGitHub,
  onPushToGitHub,
  showDemoButton,
  hasDemo,
  onOpenDemo,
}: ProjectDetailsHeaderProps) {
  return (
    <section className="overflow-hidden rounded-[28px] border border-border/60 bg-card/90 shadow-[0_24px_70px_-40px_rgba(76,29,149,0.55)]">
      <ProjectDetailsHero
        details={details}
        canOpen={canOpen}
        opening={opening}
        requestStatus={requestStatus}
        onOpenWorkspace={onOpenWorkspace}
        onRequestAccess={onRequestAccess}
        onBecomeSponsor={onBecomeSponsor}
        canPushToGitHub={canPushToGitHub}
        onPushToGitHub={onPushToGitHub}
        showDemoButton={showDemoButton}
        hasDemo={hasDemo}
        onOpenDemo={onOpenDemo}
      />
      <ProjectDetailsStatsBar
        details={details}
        starred={starred}
        stars={stars}
        starPending={starPending}
        onStar={onStar}
        onDownload={onDownload}
      />
    </section>
  );
}
