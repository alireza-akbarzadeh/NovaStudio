"use client";

import { motion } from "motion/react";
import { useMemo, useState } from "react";

import { CloneFromGitHubDialog } from "@/features/github/components/clone-from-github-dialog";
import { ProjectsNavSidebar } from "@/features/projects/components/workspace/projects-nav-sidebar";
import { ProjectsRightSidebar } from "@/features/projects/components/workspace/projects-right-sidebar";
import { ProjectsWorkspaceMain } from "@/features/projects/components/workspace/projects-workspace-main";
import { RequestAccessModal } from "@/features/projects/components/workspace/request-access-modal";
import { filterWorkspaceProjects } from "@/features/projects/lib/filter-workspace-projects";
import { WORKSPACE_PROJECTS } from "@/features/projects/lib/projects-workspace-data";
import type {
  ProjectFilter,
  WorkspaceProject,
} from "@/features/projects/lib/projects-workspace-types";

export function ProjectsPageView() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<ProjectFilter>("all");
  const [sort, setSort] = useState("newest");
  const [cloneOpen, setCloneOpen] = useState(false);
  const [accessProject, setAccessProject] = useState<WorkspaceProject | null>(
    null,
  );

  const projects = useMemo(
    () => filterWorkspaceProjects(WORKSPACE_PROJECTS, filter, search, sort),
    [filter, search, sort],
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
      className="relative min-h-screen bg-background text-foreground"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 45% at 10% 0%, color-mix(in oklch, var(--ring) 16%, transparent), transparent 55%), radial-gradient(ellipse 55% 40% at 90% 10%, color-mix(in oklch, var(--accent) 50%, transparent), transparent 50%), radial-gradient(ellipse 50% 35% at 70% 100%, color-mix(in oklch, var(--primary) 8%, transparent), transparent 55%)",
        }}
      />

      <div className="relative z-10 flex min-h-screen">
        <ProjectsNavSidebar />
        <div className="flex min-w-0 flex-1 gap-6 px-4 py-6 md:px-6 lg:px-8">
          <ProjectsWorkspaceMain
            projects={projects}
            search={search}
            onSearchChange={setSearch}
            filter={filter}
            onFilterChange={setFilter}
            sort={sort}
            onSortChange={setSort}
            onImport={() => setCloneOpen(true)}
            onRequestAccess={setAccessProject}
            isEmptyCatalog={WORKSPACE_PROJECTS.length === 0}
          />
          <ProjectsRightSidebar />
        </div>
      </div>

      <RequestAccessModal
        project={accessProject}
        open={Boolean(accessProject)}
        onOpenChange={(open) => {
          if (!open) setAccessProject(null);
        }}
      />
      <CloneFromGitHubDialog open={cloneOpen} onOpenChange={setCloneOpen} />
    </motion.div>
  );
}
