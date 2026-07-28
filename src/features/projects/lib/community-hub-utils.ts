import type { WorkspaceProject } from "@/features/projects/lib/projects-workspace-types";

export type CommunityHubSort =
  | "recently-updated"
  | "most-starred"
  | "trending";

export type CommunityHubQueryOptions = {
  searchQuery?: string;
  sort?: CommunityHubSort;
  acceptingContributorsOnly?: boolean;
};

export const COMMUNITY_HUB_SORT_OPTIONS: {
  value: CommunityHubSort;
  label: string;
}[] = [
  { value: "recently-updated", label: "Recently updated" },
  { value: "most-starred", label: "Most starred" },
  { value: "trending", label: "Trending" },
];

export function filterCommunityProjects(
  projects: WorkspaceProject[],
  query: string,
): WorkspaceProject[] {
  const terms = query
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);

  if (terms.length === 0) return projects;

  return projects.filter((project) => {
    const haystack = [
      project.name,
      project.description,
      project.owner.name,
      project.lastEditedBy,
      ...project.tech,
      ...(project.tags ?? []),
    ]
      .join(" ")
      .toLowerCase();

    return terms.every((term) => haystack.includes(term));
  });
}

export function filterAcceptingContributors(
  projects: WorkspaceProject[],
): WorkspaceProject[] {
  return projects.filter((project) => !project.isMember);
}

export function sortCommunityProjects(
  projects: WorkspaceProject[],
  sort: CommunityHubSort,
): WorkspaceProject[] {
  const sorted = [...projects];

  sorted.sort((a, b) => {
    if (sort === "most-starred") {
      return (
        (b.stars ?? 0) - (a.stars ?? 0) ||
        (b.updatedAt ?? 0) - (a.updatedAt ?? 0)
      );
    }

    if (sort === "trending") {
      return (
        (b.views ?? 0) - (a.views ?? 0) ||
        (b.stars ?? 0) - (a.stars ?? 0) ||
        (b.updatedAt ?? 0) - (a.updatedAt ?? 0)
      );
    }

    return (b.updatedAt ?? 0) - (a.updatedAt ?? 0);
  });

  return sorted;
}

export function applyCommunityHubQuery(
  projects: WorkspaceProject[],
  options: CommunityHubQueryOptions,
): WorkspaceProject[] {
  const searchQuery = options.searchQuery ?? "";
  const sort = options.sort ?? "recently-updated";
  const acceptingContributorsOnly = options.acceptingContributorsOnly ?? false;

  let result = filterCommunityProjects(projects, searchQuery);
  if (acceptingContributorsOnly) {
    result = filterAcceptingContributors(result);
  }
  return sortCommunityProjects(result, sort);
}

export function isCommunityHubDefaultView(
  options: CommunityHubQueryOptions,
): boolean {
  return (
    !(options.searchQuery ?? "").trim() &&
    (options.sort ?? "recently-updated") === "recently-updated" &&
    !(options.acceptingContributorsOnly ?? false)
  );
}

export function communityHubResultCount(
  projects: WorkspaceProject[],
  options: CommunityHubQueryOptions,
): number | undefined {
  const hasQuery =
    Boolean((options.searchQuery ?? "").trim()) ||
    Boolean(options.acceptingContributorsOnly) ||
    (options.sort ?? "recently-updated") !== "recently-updated";

  if (!hasQuery) return undefined;
  return applyCommunityHubQuery(projects, options).length;
}

export function communitySearchPlaceholder() {
  return "Search by project, tech, or owner…";
}
