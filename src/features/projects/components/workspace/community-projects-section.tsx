"use client";

import { useRouter } from "next/navigation";
import { useMemo } from "react";

import { CommunityProjectCard } from "@/features/projects/components/workspace/community-project-card";
import { FeaturedProjectsSection } from "@/features/projects/components/workspace/featured-projects-section";
import { SectionHeader } from "@/features/projects/components/workspace/section-header";
import { usePublicProjects } from "@/features/projects/hooks/use-workspace";
import {
  applyCommunityHubQuery,
  isCommunityHubDefaultView,
  type CommunityHubQueryOptions,
} from "@/features/projects/lib/community-hub-utils";
import type { WorkspaceProject } from "@/features/projects/lib/projects-workspace-types";

type CommunityProjectsSectionProps = {
  onRequestAccess: (project: WorkspaceProject) => void;
  /** Hide the section chrome when embedded in the dedicated community page. */
  embedded?: boolean;
  hubQuery?: CommunityHubQueryOptions;
};

export function CommunityProjectsSection({
  onRequestAccess,
  embedded = false,
  hubQuery = {},
}: CommunityProjectsSectionProps) {
  const publicProjects = usePublicProjects(embedded ? 100 : 24);
  const community = (publicProjects ?? []) as WorkspaceProject[];
  const router = useRouter();

  const isDefaultView = isCommunityHubDefaultView(hubQuery);
  const isSearching = Boolean((hubQuery.searchQuery ?? "").trim());
  const hasActiveFilters = !isDefaultView;

  const processedCommunity = useMemo(
    () => applyCommunityHubQuery(community, hubQuery),
    [community, hubQuery],
  );

  const { featuredProjects, otherProjects } = useMemo(() => {
    const source = isDefaultView ? community : processedCommunity;
    const featured = source
      .filter((project) => project.featured)
      .sort((a, b) => (b.featuredAt ?? 0) - (a.featuredAt ?? 0));
    const featuredIds = new Set(featured.map((project) => project.id));
    const rest = source.filter((project) => !featuredIds.has(project.id));
    return { featuredProjects: featured, otherProjects: rest };
  }, [community, processedCommunity, isDefaultView]);

  const gridProjects = embedded
    ? isDefaultView
      ? otherProjects
      : processedCommunity
    : hasActiveFilters
      ? processedCommunity
      : community;

  return (
    <section>
      {embedded && isDefaultView ? (
        <FeaturedProjectsSection
          projects={featuredProjects}
          onRequestAccess={onRequestAccess}
        />
      ) : null}

      {embedded ? null : (
        <SectionHeader
          eyebrow="Discover"
          title="Community Projects"
          description="Explore public workspaces from developers around the world."
          actionLabel="Browse all"
          onAction={() => router.push("/projects/community")}
        />
      )}

      {embedded && featuredProjects.length > 0 && isDefaultView ? (
        <SectionHeader
          eyebrow="Discover"
          title="All community projects"
          description="Browse every public workspace and request to contribute."
        />
      ) : null}

      {embedded && hasActiveFilters ? (
        <SectionHeader
          eyebrow={isSearching ? "Search" : "Filtered"}
          title={isSearching ? "Results" : "Community projects"}
          description={
            isSearching
              ? "Matching public workspaces by name, tech stack, or owner."
              : "Sorted and filtered public workspaces from the community hub."
          }
        />
      ) : null}

      {publicProjects === undefined ? (
        <p className="text-sm text-muted-foreground">Loading community…</p>
      ) : community.length === 0 ? (
        <p className="rounded-[22px] border border-dashed border-border/70 bg-card/50 px-6 py-10 text-center text-sm text-muted-foreground">
          No public projects yet. Mark a project as public to appear here.
        </p>
      ) : gridProjects.length === 0 ? (
        <p className="rounded-[22px] border border-dashed border-border/70 bg-card/50 px-6 py-10 text-center text-sm text-muted-foreground">
          {isSearching ? (
            <>
              No projects match &ldquo;{hubQuery.searchQuery?.trim()}&rdquo;. Try
              another name, tech tag, or owner.
            </>
          ) : hubQuery.acceptingContributorsOnly ? (
            <>No public projects are currently accepting new contributors.</>
          ) : (
            <>No projects match the current filters.</>
          )}
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {gridProjects.map((project, index) => (
            <CommunityProjectCard
              key={project.id}
              project={project}
              index={index}
              onRequestAccess={onRequestAccess}
            />
          ))}
        </div>
      )}
    </section>
  );
}
