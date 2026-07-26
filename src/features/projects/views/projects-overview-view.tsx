"use client";

import { useMemo, useState } from "react";

import { CloneFromGitHubDialog } from "@/features/github/components/clone-from-github-dialog";
import { ProjectsRightSidebar } from "@/features/projects/components/workspace/projects-right-sidebar";
import { ProjectsWorkspaceMain } from "@/features/projects/components/workspace/projects-workspace-main";
import { RequestAccessModal } from "@/features/projects/components/workspace/request-access-modal";
import {
  useEnsureWorkspaceDefaults,
  useWorkspaceProjects,
} from "@/features/projects/hooks/use-workspace";
import { filterWorkspaceProjects } from "@/features/projects/lib/filter-workspace-projects";
import type {
  ProjectFilter,
  WorkspaceProject,
} from "@/features/projects/lib/projects-workspace-types";

export function ProjectsOverviewView() {
  useEnsureWorkspaceDefaults();

  const remoteProjects = useWorkspaceProjects();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<ProjectFilter>("all");
  const [sort, setSort] = useState("newest");
  const [cloneOpen, setCloneOpen] = useState(false);
  const [accessProject, setAccessProject] = useState<WorkspaceProject | null>(
    null,
  );

  const catalog = useMemo(
    () => (remoteProjects ?? []) as WorkspaceProject[],
    [remoteProjects],
  );

  const projects = useMemo(
    () => filterWorkspaceProjects(catalog, filter, search, sort),
    [catalog, filter, search, sort],
  );

  return (
    <>
      <div className="flex min-w-0 flex-1 gap-6">
        <ProjectsWorkspaceMain
          projects={projects}
          allProjects={catalog}
          search={search}
          onSearchChange={setSearch}
          filter={filter}
          onFilterChange={setFilter}
          sort={sort}
          onSortChange={setSort}
          onImport={() => setCloneOpen(true)}
          onRequestAccess={setAccessProject}
          isEmptyCatalog={remoteProjects !== undefined && catalog.length === 0}
          isLoading={remoteProjects === undefined}
        />
        <ProjectsRightSidebar />
      </div>

      <RequestAccessModal
        project={accessProject}
        open={Boolean(accessProject)}
        onOpenChange={(open) => {
          if (!open) setAccessProject(null);
        }}
      />
      <CloneFromGitHubDialog open={cloneOpen} onOpenChange={setCloneOpen} />
    </>
  );
}
