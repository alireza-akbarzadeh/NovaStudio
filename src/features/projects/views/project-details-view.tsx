"use client";

import {
  ProjectDetailsAboutSection,
  ProjectDetailsBackLink,
  ProjectDetailsContributeCta,
  ProjectDetailsContributorsSection,
  ProjectDetailsHeader,
  ProjectDetailsLoadingState,
  ProjectDetailsNotFound,
  ProjectDetailsPreviewSection,
  ProjectDetailsRoadmapSection,
  ProjectDetailsSponsorSection,
} from "@/features/projects/components/project-details";
import { useProjectDetailsPage } from "@/features/projects/hooks/use-project-details-page";

type ProjectDetailsViewProps = {
  projectId: string;
  onRequestAccess?: () => void;
};

export function ProjectDetailsView({
  projectId,
  onRequestAccess,
}: ProjectDetailsViewProps) {
  const page = useProjectDetailsPage(projectId);

  if (page.details === undefined) {
    return <ProjectDetailsLoadingState />;
  }

  if (page.details === null) {
    return <ProjectDetailsNotFound />;
  }

  const { details } = page;

  return (
    <div className="mx-auto w-full max-w-6xl pb-16">
      <ProjectDetailsBackLink />

      <ProjectDetailsHeader
        details={details}
        canOpen={page.canOpen}
        opening={page.opening}
        requestStatus={page.requestStatus}
        starred={page.starred}
        stars={page.stars}
        starPending={page.starPending}
        onOpenWorkspace={() => page.openProject(projectId)}
        onRequestAccess={() => page.requestAccess(onRequestAccess)}
        onStar={() => void page.handleStar()}
        onDownload={() => void page.handleDownload(details.githubRepoUrl)}
      />

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          <ProjectDetailsAboutSection details={details} />
          <ProjectDetailsPreviewSection details={details} />
          <ProjectDetailsSponsorSection
            features={details.features}
            onProposeFeature={page.handleProposeFeature}
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
    </div>
  );
}
