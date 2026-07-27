"use client";

import { createContext } from "react";

import type { ProjectFileRow } from "@/features/workspace/hooks/use-project-files";

export type ProjectFilesContextValue = {
  projectId: string;
  /** File/folder rows without bodies — available as soon as metadata loads. */
  metadata: ProjectFileRow[] | undefined;
  /** Full rows with content — undefined until all content pages are loaded. */
  files: ProjectFileRow[] | undefined;
  contentsLoading: boolean;
};

export const ProjectFilesContext =
  createContext<ProjectFilesContextValue | null>(null);
