import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useMutation, usePaginatedQuery, useQuery } from "convex/react";
import { useEffect, useMemo, useRef } from "react";

import { useProject } from "@/features/projects/hooks/use-projects";

function asProjectId(projectId: string): Id<"projects"> {
  return projectId as Id<"projects">;
}

export type ProjectFileRow = {
  _id: Id<"projectFiles">;
  _creationTime: number;
  projectId: Id<"projects">;
  name: string;
  parentId?: Id<"projectFiles">;
  kind: "file" | "folder";
  path: string;
  updatedAt: number;
  staged?: boolean;
  contentHash?: string;
  syncedContentHash?: string;
  content?: string;
  syncedContent?: string;
};

/** Ensures legacy inline file bodies are migrated off projectFiles. */
export function useEnsureFileContentSplit(projectId: string) {
  const project = useProject({ projectId });
  const startMigration = useMutation(api.projectFiles.startContentMigration);
  const startedRef = useRef(false);

  useEffect(() => {
    if (!project || project.fileContentSplit === true) return;
    if (startedRef.current) return;
    startedRef.current = true;
    void startMigration({ projectId: asProjectId(projectId) });
  }, [project, projectId, startMigration]);

  return project?.fileContentSplit === true;
}

function useProjectFileMetadata(projectId: string, enabled: boolean) {
  return useQuery(
    api.projectFiles.listByProject,
    enabled ? { projectId: asProjectId(projectId) } : "skip",
  );
}

function useProjectFileContentsPages(projectId: string, enabled: boolean) {
  const { results, status, loadMore, isLoading } = usePaginatedQuery(
    api.projectFiles.listFileContentsPage,
    enabled ? { projectId: asProjectId(projectId) } : "skip",
    { initialNumItems: 200 },
  );

  useEffect(() => {
    if (!enabled || status !== "CanLoadMore") return;
    loadMore(200);
  }, [enabled, status, loadMore]);

  return {
    results,
    ready: enabled && status === "Exhausted" && !isLoading,
  };
}

export function useProjectFiles(projectId: string) {
  const splitReady = useEnsureFileContentSplit(projectId);
  const metadata = useProjectFileMetadata(projectId, splitReady);
  const { results: contents, ready: contentsReady } =
    useProjectFileContentsPages(projectId, splitReady);

  return useMemo(() => {
    if (!splitReady || metadata === undefined) {
      return undefined;
    }
    if (!contentsReady) {
      return undefined;
    }

    const byPath = new Map(
      contents.map((row) => [
        row.path,
        { content: row.content, syncedContent: row.syncedContent },
      ]),
    );

    return metadata.map((file) => {
      if (file.kind !== "file") {
        return file as ProjectFileRow;
      }
      const body = byPath.get(file.path);
      return {
        ...file,
        content: body?.content,
        syncedContent: body?.syncedContent,
      } satisfies ProjectFileRow;
    });
  }, [splitReady, metadata, contents, contentsReady]);
}

export function useProjectFile(projectId: string, path: string) {
  return useQuery(
    api.projectFiles.getByPath,
    path
      ? { projectId: asProjectId(projectId), path }
      : "skip",
  );
}

export function useSeedProjectFiles() {
  return useMutation(api.projectFiles.seedDefaults);
}

export function useCreateProjectFile() {
  return useMutation(api.projectFiles.create);
}

export function useUpdateProjectFileContent() {
  return useMutation(api.projectFiles.updateContent);
}

export function useRenameProjectFile() {
  return useMutation(api.projectFiles.rename);
}

export function useMoveProjectFile() {
  return useMutation(api.projectFiles.move);
}

export function useDuplicateProjectFile() {
  return useMutation(api.projectFiles.duplicate);
}

export function useDeleteProjectFile() {
  return useMutation(api.projectFiles.remove);
}

export function useChangedFiles(projectId: string) {
  const splitReady = useEnsureFileContentSplit(projectId);
  return useQuery(
    api.projectFiles.listChangedFiles,
    splitReady ? { projectId: asProjectId(projectId) } : "skip",
  );
}

export function useStagedCommitContext(projectId: string) {
  const splitReady = useEnsureFileContentSplit(projectId);
  return useQuery(
    api.projectFiles.listStagedCommitContext,
    splitReady ? { projectId: asProjectId(projectId) } : "skip",
  );
}

export function useChangedCommitContext(projectId: string) {
  const splitReady = useEnsureFileContentSplit(projectId);
  return useQuery(
    api.projectFiles.listChangedCommitContext,
    splitReady ? { projectId: asProjectId(projectId) } : "skip",
  );
}

export function useWriteFileAtPath() {
  return useMutation(api.projectFiles.writeFileAtPath);
}

export function useSetFileStaged() {
  return useMutation(api.projectFiles.setFileStaged);
}

export function useSetAllChangedStaged() {
  return useMutation(api.projectFiles.setAllChangedStaged);
}

export function useDiscardFileChanges() {
  return useMutation(api.projectFiles.discardFileChanges);
}

export function useProjectStashes(projectId: string) {
  return useQuery(api.projectStashes.listByProject, {
    projectId: asProjectId(projectId),
  });
}

export function useCreateProjectStash() {
  return useMutation(api.projectStashes.create);
}

export function useApplyProjectStash() {
  return useMutation(api.projectStashes.apply);
}

export function useRemoveProjectStash() {
  return useMutation(api.projectStashes.remove);
}
