"use client";

import { ActivityFeedSection } from "@/features/projects/components/workspace/activity-feed-section";
import { CollectionsSection } from "@/features/projects/components/workspace/collections-section";
import { CommunityProjectsSection } from "@/features/projects/components/workspace/community-projects-section";
import { ContinueWorkingSection } from "@/features/projects/components/workspace/continue-working-section";
import { PinnedProjectsSection } from "@/features/projects/components/workspace/pinned-projects-section";
import { ProjectsEmptyState } from "@/features/projects/components/workspace/projects-empty-state";
import { ProjectsFiltersBar } from "@/features/projects/components/workspace/projects-filters-bar";
import { ProjectsPageHeader } from "@/features/projects/components/workspace/projects-page-header";
import { ProjectsStatsRow } from "@/features/projects/components/workspace/projects-stats-row";
import { TrendingProjectsSection } from "@/features/projects/components/workspace/trending-projects-section";
import type {
  ProjectFilter,
  WorkspaceProject,
} from "@/features/projects/lib/projects-workspace-types";

type ProjectsWorkspaceMainProps = {
  projects: WorkspaceProject[];
  /** Full catalog before filters — for empty pin messaging. */
  allProjects?: WorkspaceProject[];
  search: string;
  onSearchChange: (value: string) => void;
  filter: ProjectFilter;
  onFilterChange: (filter: ProjectFilter) => void;
  sort: string;
  onSortChange: (sort: string) => void;
  onImport: () => void;
  onRequestAccess: (project: WorkspaceProject) => void;
  isEmptyCatalog: boolean;
  isLoading?: boolean;
};

export function ProjectsWorkspaceMain({
  projects,
  allProjects,
  search,
  onSearchChange,
  filter,
  onFilterChange,
  sort,
  onSortChange,
  onImport,
  onRequestAccess,
  isEmptyCatalog,
  isLoading = false,
}: ProjectsWorkspaceMainProps) {
  return (
    <div className="min-w-0 flex-1 space-y-8">
      <ProjectsPageHeader
        search={search}
        onSearchChange={onSearchChange}
        onImport={onImport}
      />

      {isLoading ? (
        <div className="rounded-[22px] border border-border/60 bg-card/60 px-6 py-16 text-center text-sm text-muted-foreground backdrop-blur">
          Loading your workspace…
        </div>
      ) : isEmptyCatalog ? (
        <ProjectsEmptyState onImport={onImport} />
      ) : (
        <>
          <ProjectsFiltersBar
            filter={filter}
            onFilterChange={onFilterChange}
            sort={sort}
            onSortChange={onSortChange}
          />
          {projects.length === 0 ? (
            <div className="rounded-[22px] border border-dashed border-border/70 bg-card/60 px-6 py-12 text-center text-sm text-muted-foreground backdrop-blur">
              {filter === "pinned" ? (
                <>
                  <p className="font-medium text-foreground/90">
                    No pinned projects yet
                  </p>
                  <p className="mt-2">
                    Hover a project under Continue Working and click the pin
                    icon, then come back to this filter.
                  </p>
                  <button
                    type="button"
                    className="mt-4 text-sm font-medium text-primary hover:underline"
                    onClick={() => onFilterChange("all")}
                  >
                    Show all projects
                  </button>
                </>
              ) : (
                <>
                  No projects match your filters. Try another search or reset the
                  filter chips.
                </>
              )}
            </div>
          ) : (
            <>
              <ProjectsStatsRow onFilterChange={onFilterChange} />
              <PinnedProjectsSection
                projects={projects}
                allProjects={allProjects}
                onManagePins={() => onFilterChange("pinned")}
              />
              <ContinueWorkingSection projects={projects} />
              <CommunityProjectsSection onRequestAccess={onRequestAccess} />
              <TrendingProjectsSection />
              <CollectionsSection />
              <ActivityFeedSection />
            </>
          )}
        </>
      )}
    </div>
  );
}
