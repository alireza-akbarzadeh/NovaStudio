"use client";

import { WorkspaceFileTree } from "@/features/workspace/components/workspace-file-tree";

type ProjectFileNavigatorTreeProps = {
  projectId: string;
};

/**
 * Reusable project file tree for the sidebar explorer and other panels.
 * Wraps the full tree (toolbar, virtualization, DnD, context menus).
 */
export function ProjectFileNavigatorTree({
  projectId,
}: ProjectFileNavigatorTreeProps) {
  return <WorkspaceFileTree projectId={projectId} />;
}

/** @deprecated Use ProjectFileNavigatorTree */
export const WorkspaceFileTreePanel = ProjectFileNavigatorTree;
