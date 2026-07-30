"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { useProject } from "@/features/projects/hooks/use-projects";
import {
  useProjectAllFileContents,
} from "@/features/workspace/hooks/use-project-files";
import { loadFileContentDraft } from "@/features/workspace/lib/file-content-drafts";
import {
  buildSemanticSearchIndex,
  filterSemanticChunksLocally,
  normalizeAiResults,
  pickChunksForAi,
  type SemanticSearchResult,
} from "@/features/workspace/lib/semantic-search-index";

const AI_DEBOUNCE_MS = 650;
const MIN_QUERY_LENGTH = 3;

export function useSemanticCodebaseSearch(
  projectId: string,
  query: string,
  enabled: boolean,
): {
  results: SemanticSearchResult[];
  loading: boolean;
  indexing: boolean;
  searching: boolean;
  error: string | null;
  totalChunks: number;
} {
  const project = useProject({ projectId });
  const { files, loading: filesLoading } = useProjectAllFileContents(
    projectId,
    enabled,
  );

  const chunks = useMemo(() => {
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
    return buildSemanticSearchIndex(rows);
  }, [enabled, files, projectId]);

  const trimmedQuery = query.trim();
  const localResults = useMemo(
    () => filterSemanticChunksLocally(chunks, trimmedQuery),
    [chunks, trimmedQuery],
  );

  const [aiResults, setAiResults] = useState<SemanticSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    if (!enabled) {
      setAiResults([]);
      setSearching(false);
      setError(null);
      return;
    }

    if (trimmedQuery.length < MIN_QUERY_LENGTH) {
      setAiResults([]);
      setSearching(false);
      setError(null);
      return;
    }

    const timer = window.setTimeout(() => {
      const requestId = ++requestIdRef.current;
      const candidates = pickChunksForAi(chunks, trimmedQuery);
      if (candidates.length === 0) {
        setAiResults([]);
        setSearching(false);
        return;
      }

      setSearching(true);
      setError(null);

      void fetch("/api/semantic-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: trimmedQuery,
          projectName: project?.name,
          chunks: candidates,
        }),
      })
        .then(async (res) => {
          const data = (await res.json()) as {
            results?: SemanticSearchResult[];
            error?: string;
          };
          if (!res.ok) {
            throw new Error(data.error ?? "Search failed");
          }
          if (requestId !== requestIdRef.current) return;
          const allowed = new Set(candidates.map((c) => c.path));
          setAiResults(
            normalizeAiResults(data.results ?? [], candidates, allowed),
          );
        })
        .catch((err: unknown) => {
          if (requestId !== requestIdRef.current) return;
          setAiResults([]);
          setError(
            err instanceof Error ? err.message : "Semantic search failed",
          );
        })
        .finally(() => {
          if (requestId === requestIdRef.current) {
            setSearching(false);
          }
        });
    }, AI_DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
  }, [chunks, enabled, project?.name, trimmedQuery]);

  const results =
    aiResults.length > 0
      ? aiResults
      : trimmedQuery.length >= MIN_QUERY_LENGTH
        ? localResults
        : [];

  return {
    results,
    loading: enabled && filesLoading,
    indexing: enabled && filesLoading,
    searching,
    error,
    totalChunks: chunks.length,
  };
}
