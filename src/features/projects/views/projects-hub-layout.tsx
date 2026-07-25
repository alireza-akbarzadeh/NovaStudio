"use client";

import { ProjectsWorkspaceShell } from "@/features/projects/components/workspace/projects-workspace-shell";

export function ProjectsHubLayout({ children }: { children: React.ReactNode }) {
  return <ProjectsWorkspaceShell>{children}</ProjectsWorkspaceShell>;
}
