"use client";

import { useMemo, type ReactNode } from "react";

import { ProjectFilesContext } from "@/features/workspace/context/project-files-context";
import {
  type ProjectFileRow,
  useEnsureFileContentSplit,
  useProjectFileMetadataQuery,
} from "@/features/workspace/hooks/use-project-files";

type ProjectFilesProviderProps = {
  projectId: string;
  children: ReactNode;
};

/** Subscribes to file tree metadata only — bodies load on demand elsewhere. */
export function ProjectFilesProvider({
  projectId,
  children,
}: ProjectFilesProviderProps) {
  const splitReady = useEnsureFileContentSplit(projectId);
  const metadata = useProjectFileMetadataQuery(projectId, splitReady);

  const metadataRows = useMemo((): ProjectFileRow[] | undefined => {
    if (!splitReady || metadata === undefined) {
      return undefined;
    }
    return metadata as ProjectFileRow[];
  }, [metadata, splitReady]);

  const value = useMemo(
    () => ({
      projectId,
      metadata: metadataRows,
      files: metadataRows,
      contentsLoading: false,
    }),
    [metadataRows, projectId],
  );

  return (
    <ProjectFilesContext.Provider value={value}>
      {children}
    </ProjectFilesContext.Provider>
  );
}
