"use client";

import { useMemo, useState } from "react";

import { CommunityHubFilters } from "@/features/projects/components/workspace/community-hub-filters";
import { CommunityHubSearch } from "@/features/projects/components/workspace/community-hub-search";
import { CommunityProjectsSection } from "@/features/projects/components/workspace/community-projects-section";
import { HubPageHeader } from "@/features/projects/components/workspace/hub-page-header";
import { RequestAccessModal } from "@/features/projects/components/workspace/request-access-modal";
import { usePublicProjects } from "@/features/projects/hooks/use-workspace";
import {
  communityHubResultCount,
  type CommunityHubSort,
} from "@/features/projects/lib/community-hub-utils";
import type { WorkspaceProject } from "@/features/projects/lib/projects-workspace-types";

export function CommunityHubView() {
  const [requestProject, setRequestProject] = useState<WorkspaceProject | null>(
    null,
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [sort, setSort] = useState<CommunityHubSort>("recently-updated");
  const [acceptingContributorsOnly, setAcceptingContributorsOnly] =
    useState(false);
  const publicProjects = usePublicProjects(100);

  const hubQuery = useMemo(
    () => ({
      searchQuery,
      sort,
      acceptingContributorsOnly,
    }),
    [searchQuery, sort, acceptingContributorsOnly],
  );

  const resultCount = useMemo(() => {
    return communityHubResultCount(
      (publicProjects ?? []) as WorkspaceProject[],
      hubQuery,
    );
  }, [publicProjects, hubQuery]);

  return (
    <div className="mx-auto w-full max-w-5xl">
      <HubPageHeader
        title="Community"
        description="Discover public workspaces and request to contribute."
      />

      <div className="mb-6 space-y-4">
        <CommunityHubSearch
          value={searchQuery}
          onChange={setSearchQuery}
          resultCount={resultCount}
        />
        <CommunityHubFilters
          sort={sort}
          onSortChange={setSort}
          acceptingContributorsOnly={acceptingContributorsOnly}
          onAcceptingContributorsChange={setAcceptingContributorsOnly}
        />
      </div>

      <CommunityProjectsSection
        embedded
        hubQuery={hubQuery}
        onRequestAccess={setRequestProject}
      />

      <RequestAccessModal
        project={requestProject}
        open={Boolean(requestProject)}
        onOpenChange={(open) => {
          if (!open) setRequestProject(null);
        }}
      />
    </div>
  );
}
