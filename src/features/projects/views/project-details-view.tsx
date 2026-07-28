"use client";

import { useState } from "react";

import {
  ProjectDetailsAboutSection,
  ProjectDetailsBackLink,
  ProjectDetailsContributeCta,
  ProjectDetailsContributorsSection,
  ProjectDetailsDemoDialog,
  ProjectDetailsDocsSection,
  ProjectDetailsFeaturedBanner,
  ProjectDetailsHeader,
  ProjectDetailsLoadingState,
  ProjectDetailsNotFound,
  ProjectDetailsPreviewSection,
  ProjectDetailsPushGitHubDialog,
  ProjectDetailsRoadmapSection,
  ProjectDetailsSponsorDialog,
  ProjectDetailsSponsorSection,
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
        opening={page.opening}
        requestStatus={page.requestStatus}
        starred={page.starred}
        stars={page.stars}
        starPending={page.starPending}
        onOpenWorkspace={() => page.openProject(projectId)}
        onRequestAccess={() => page.requestAccess(onRequestAccess)}
        onStar={() => void page.handleStar()}
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
        onProposeFeature={page.handleProposeFeature}
      />

      {details.viewer.isOwner && details.visibility === "public" ? (
        <ProjectDetailsFeaturedBanner projectId={projectId} details={details} />
      ) : null}

      <div className="mt-8">
        <ProjectDetailsPreviewSection details={details} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <ProjectDetailsAboutSection details={details} />
          <ProjectDetailsSponsorSection
            features={details.features}
            onBecomeSponsor={() => setSponsorDialogOpen(true)}
            onUpvoteFeature={page.handleUpvoteFeature}
          />
        </div>

        <div className="space-y-6">
          <ProjectDetailsContributorsSection
            contributors={details.contributors}
            contributorCount={details.contributorCount}
          />
          <ProjectDetailsRoadmapSection todos={details.todos} />
          <ProjectDetailsContributeCta
            canOpen={page.canOpen}
            opening={page.opening}
            requestStatus={page.requestStatus}
            onOpenWorkspace={() => page.openProject(projectId)}
            onRequestAccess={() => page.requestAccess(onRequestAccess)}
          />
        </div>
      </div>

      <div className="mt-8">
        <ProjectDetailsDocsSection projectId={projectId} />
      </div>
    </div>
  );
}
