"use client";

import { useMemo, type ReactNode } from "react";

import { ProjectFilesContext } from "@/features/workspace/context/project-files-context";
import {
  mergeProjectFiles,
  type ProjectFileRow,
  useEnsureFileContentSplit,
  useProjectFileContentsPages,
  useProjectFileMetadataQuery,
} from "@/features/workspace/hooks/use-project-files";

type ProjectFilesProviderProps = {
  projectId: string;
  children: ReactNode;
};

export function ProjectFilesProvider({
  projectId,
  children,
}: ProjectFilesProviderProps) {
  const splitReady = useEnsureFileContentSplit(projectId);
  const metadata = useProjectFileMetadataQuery(projectId, splitReady);
  const { results: contents, ready: contentsReady } =
    useProjectFileContentsPages(projectId, splitReady);

  const metadataRows = useMemo((): ProjectFileRow[] | undefined => {
    if (!splitReady || metadata === undefined) {
      return undefined;
    }
    return metadata as ProjectFileRow[];
  }, [metadata, splitReady]);

  const files = useMemo(
    () => mergeProjectFiles(metadataRows, contents, contentsReady),
    [contents, contentsReady, metadataRows],
  );

  const value = useMemo(
    () => ({
      projectId,
      metadata: metadataRows,
      files,
      contentsLoading:
        splitReady && metadataRows !== undefined && !contentsReady,
    }),
    [contentsReady, files, metadataRows, projectId, splitReady],
  );

  return (
    <ProjectFilesContext.Provider value={value}>
      {children}
    </ProjectFilesContext.Provider>
  );
}
