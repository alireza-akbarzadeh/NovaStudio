"use client";

import { useMemo } from "react";

import {
  useProjectAllFileContents,
  useProjectFileMetadata,
} from "@/features/workspace/hooks/use-project-files";
import { loadFileContentDraft } from "@/features/workspace/lib/file-content-drafts";
import {
  buildWorkspaceSymbolIndex,
  filterSymbolHits,
  type WorkspaceSymbolHit,
} from "@/features/workspace/lib/workspace-symbol-index";

export function useWorkspaceSymbolSearch(
  projectId: string,
  query: string,
  enabled: boolean,
): {
  hits: WorkspaceSymbolHit[];
  loading: boolean;
  totalSymbols: number;
} {
  const metadata = useProjectFileMetadata(projectId);
  const { files, loading } = useProjectAllFileContents(projectId, enabled);

  const index = useMemo(() => {
    if (!enabled || !files) return [];
    const rows = files
      .filter((file) => file.kind === "file")
      .map((file) => {
        const draft = loadFileContentDraft(projectId, file.path);
        const content =
          draft && draft.updatedAt >= (file.updatedAt ?? 0)
            ? draft.content
            : (file.content ?? "");
        return { path: file.path, content };
      });
    return buildWorkspaceSymbolIndex(rows);
  }, [enabled, files, projectId]);

  const hits = useMemo(
    () => filterSymbolHits(index, query),
    [index, query],
  );

  const metadataLoading = metadata === undefined;

  return {
    hits,
    loading: enabled && (loading || metadataLoading),
    totalSymbols: index.length,
  };
}
