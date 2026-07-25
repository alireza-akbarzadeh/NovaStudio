import type {
  ProjectFilter,
  WorkspaceProject,
} from "@/features/projects/lib/projects-workspace-types";

export function filterWorkspaceProjects(
  projects: WorkspaceProject[],
  filter: ProjectFilter,
  search: string,
  sort: string,
): WorkspaceProject[] {
  const query = search.trim().toLowerCase();

  let next = projects.filter((project) => {
    if (filter === "pinned" && !project.pinned) return false;
    if (filter === "shared" && project.visibility !== "shared") return false;
    if (filter === "public" && project.visibility !== "public") return false;
    if (filter === "archived" && project.status !== "archived") return false;
    if (filter === "mine" && project.visibility === "public") return false;
    if (filter === "recent" && project.pinned) return false;

    if (!query) return true;
    const haystack = [
      project.name,
      project.description,
      project.owner.name,
      ...project.tech,
      ...(project.tags ?? []),
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(query);
  });

  next = [...next].sort((a, b) => {
    if (sort === "popular") return (b.stars ?? 0) - (a.stars ?? 0);
    if (sort === "updated") return a.lastUpdated.localeCompare(b.lastUpdated);
    return a.name.localeCompare(b.name);
  });

  return next;
}
