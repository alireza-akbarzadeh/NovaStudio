"use client";

import type { ProjectDetailsData } from "@/features/projects/lib/project-details-types";
import { ProjectDetailsHero } from "./project-details-hero";
import { ProjectDetailsStatsBar } from "./project-details-stats-bar";

type ProjectDetailsHeaderProps = {
  details: ProjectDetailsData;
  demo: ProjectDetailsData["demo"];
  canManageDemo: boolean;
  canOpen: boolean;
  canFork?: boolean;
  opening: boolean;
  forking?: boolean;
  requestStatus?: "pending" | "approved" | "denied";
  starred: boolean;
  stars: number;
  starPending: boolean;
  following?: boolean;
  followers?: number;
  followPending?: boolean;
  onOpenWorkspace: () => void;
  onUseTemplate?: () => void;
  onRequestAccess: () => void;
  onStar: () => void;
  onFollow?: () => void;
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
  demo,
  canManageDemo,
  canOpen,
  canFork,
  opening,
  forking,
  requestStatus,
  starred,
  stars,
  starPending,
  following,
  followers,
  followPending,
  onOpenWorkspace,
  onUseTemplate,
  onRequestAccess,
  onStar,
  onFollow,
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
        demo={demo}
        canManageDemo={canManageDemo}
        canOpen={canOpen}
        canFork={canFork}
        opening={opening}
        forking={forking}
        requestStatus={requestStatus}
        onOpenWorkspace={onOpenWorkspace}
        onUseTemplate={onUseTemplate}
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
        following={following}
        followers={followers}
        followPending={followPending}
        onFollow={onFollow}
        showFollow={!details.viewer.isOwner}
        onDownload={onDownload}
      />
    </section>
  );
}
