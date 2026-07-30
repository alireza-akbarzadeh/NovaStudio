"use client";

import { useState } from "react";

import {
  ProjectDetailsAboutSection,
  ProjectDetailsAccessInboxSection,
  ProjectDetailsActivitySection,
  ProjectDetailsBackLink,
  ProjectDetailsContributeCta,
  ProjectDetailsContributorsSection,
  ProjectDetailsDemoDialog,
  ProjectDetailsDiscussionSection,
  ProjectDetailsDocsSection,
  ProjectDetailsFeaturedBanner,
  ProjectDetailsHeader,
  ProjectDetailsLeaderboardSection,
  ProjectDetailsLoadingState,
  ProjectDetailsNotFound,
  ProjectDetailsPreviewSection,
  ProjectDetailsPushGitHubDialog,
  ProjectDetailsRelatedSection,
  ProjectDetailsRoadmapSection,
  ProjectDetailsSponsorDialog,
  ProjectDetailsSponsorSection,
  ProjectDetailsSponsorWallSection,
} from "@/features/projects/components/project-details";
import { useProjectDetailsPage } from "@/features/projects/hooks/use-project-details-page";
import { isProjectLinkedToGitHub } from "@/features/projects/lib/project-details-utils";

type ProjectDetailsViewProps = {
  projectId: string;
  onRequestAccess?: () => void;
};

export function ProjectDetailsView({
  projectId,
  onRequestAccess,
}: ProjectDetailsViewProps) {
  const page = useProjectDetailsPage(projectId);
  const [sponsorDialogOpen, setSponsorDialogOpen] = useState(false);
  const [pushGitHubDialogOpen, setPushGitHubDialogOpen] = useState(false);
  const [demoDialogOpen, setDemoDialogOpen] = useState(false);

  if (page.details === undefined) {
    return <ProjectDetailsLoadingState />;
  }

  if (page.details === null) {
    return <ProjectDetailsNotFound />;
  }

  const { details } = page;
  const isGitHubLinked = isProjectLinkedToGitHub(details);
  const canPushToGitHub =
    (details.viewer.isOwner || details.viewer.canManage) && !isGitHubLinked;
  const hasDemo = Boolean(details.demo?.url);
  const canManageDemo = details.viewer.isOwner || details.viewer.canManage;
  const showDemoButton = hasDemo || canManageDemo;

  return (
    <div className="mx-auto w-full max-w-6xl pb-16">
      <ProjectDetailsBackLink />

      <ProjectDetailsHeader
        details={details}
        demo={details.demo}
        canManageDemo={canManageDemo}
        canOpen={page.canOpen}
        canFork={page.canFork}
        opening={page.opening}
        forking={page.forkPending}
        requestStatus={page.requestStatus}
        starred={page.starred}
        stars={page.stars}
        starPending={page.starPending}
        following={page.following}
        followers={page.followers}
        followPending={page.followPending}
        onOpenWorkspace={() => page.openProject(projectId)}
        onUseTemplate={() => void page.handleFork()}
        onRequestAccess={() => page.requestAccess(onRequestAccess)}
        onStar={() => void page.handleStar()}
        onFollow={() => void page.handleFollow()}
        onDownload={() => void page.handleDownload(isGitHubLinked, details.githubRepoUrl, details.githubBranch)}
        onBecomeSponsor={() => setSponsorDialogOpen(true)}
        canPushToGitHub={canPushToGitHub}
        onPushToGitHub={() => setPushGitHubDialogOpen(true)}
        showDemoButton={showDemoButton}
        hasDemo={hasDemo}
        onOpenDemo={() => setDemoDialogOpen(true)}
      />

      <ProjectDetailsDemoDialog
        projectId={projectId}
        demo={details.demo}
        canManageDemo={canManageDemo}
        open={demoDialogOpen}
        onOpenChange={setDemoDialogOpen}
      />

      <ProjectDetailsPushGitHubDialog
        projectId={projectId}
        projectName={details.name}
        open={pushGitHubDialogOpen}
        onOpenChange={setPushGitHubDialogOpen}
      />

      <ProjectDetailsSponsorDialog
        open={sponsorDialogOpen}
        onOpenChange={setSponsorDialogOpen}
        currentTier={details.viewer.sponsorTier}
        onJoinAsSponsor={page.handleJoinAsSponsor}
        onProposeFeature={page.handleProposeFeature}
      />

      {details.viewer.isOwner && details.visibility === "public" ? (
        <ProjectDetailsFeaturedBanner projectId={projectId} details={details} />
      ) : null}

      <div className="mt-8">
        <ProjectDetailsPreviewSection details={details} />
      </div>

      <div className="mt-8 space-y-6">
        <ProjectDetailsAboutSection details={details} />
        <ProjectDetailsContributorsSection
          contributors={details.contributors}
          contributorCount={details.contributorCount}
        />
        <ProjectDetailsLeaderboardSection projectId={projectId} />
        <ProjectDetailsAccessInboxSection
          projectId={projectId}
          canManage={details.viewer.isOwner || details.viewer.canManage}
        />
        <ProjectDetailsActivitySection projectId={projectId} />
        <ProjectDetailsRoadmapSection
          projectId={projectId}
          todos={details.todos}
          canManage={details.viewer.isOwner || details.viewer.canManage}
        />
        <ProjectDetailsSponsorWallSection
          sponsors={details.sponsorWall}
          onBecomeSponsor={() => setSponsorDialogOpen(true)}
        />
        <ProjectDetailsSponsorSection
          features={details.features}
          onBecomeSponsor={() => setSponsorDialogOpen(true)}
          onUpvoteFeature={page.handleUpvoteFeature}
        />
        <ProjectDetailsDiscussionSection
          projectId={projectId}
          details={details}
        />
        <ProjectDetailsDocsSection
          projectId={projectId}
          canOpenStudio={page.canOpen}
          openingStudio={page.opening}
          onOpenStudio={() => page.openProject(projectId)}
        />
        <ProjectDetailsContributeCta
          canOpen={page.canOpen}
          canFork={page.canFork}
          opening={page.opening}
          forking={page.forkPending}
          requestStatus={page.requestStatus}
          onOpenWorkspace={() => page.openProject(projectId)}
          onUseTemplate={() => void page.handleFork()}
          onRequestAccess={() => page.requestAccess(onRequestAccess)}
        />
      </div>


      {details.relatedProjects.length > 0 ? (
        <div className="mt-8">
          <ProjectDetailsRelatedSection projects={details.relatedProjects} />
        </div>
      ) : null}
    </div>
  );
}
