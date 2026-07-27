"use client";

import { useAction } from "convex/react";
import { useEffect, useRef, useState } from "react";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import type { SearchMatch } from "@/features/workspace/lib/search";

const SEARCH_DEBOUNCE_MS = 250;

export function useProjectServerTextSearch(
  projectId: string,
  query: string,
  options: {
    caseSensitive?: boolean;
    pathPrefix?: string;
    enabled?: boolean;
    maxMatches?: number;
  },
) {
  const { caseSensitive, pathPrefix, enabled = true, maxMatches } = options;
  const searchInProject = useAction(api.projectSearch.searchInProject);

  const [matches, setMatches] = useState<SearchMatch[]>([]);
  const [truncated, setTruncated] = useState(false);
  const [searching, setSearching] = useState(false);

  const requestIdRef = useRef(0);

  useEffect(() => {
    const trimmed = query.trim();
    if (!enabled || !trimmed) {
      setMatches([]);
      setTruncated(false);
      setSearching(false);
      return;
    }

    setSearching(true);
    const requestId = ++requestIdRef.current;

    const timer = window.setTimeout(() => {
      void searchInProject({
        projectId: projectId as Id<"projects">,
        query: trimmed,
        caseSensitive,
        pathPrefix,
        maxMatches,
      })
        .then((result) => {
          if (requestId !== requestIdRef.current) return;
          setMatches(result.matches);
          setTruncated(result.truncated);
          setSearching(false);
        })
        .catch(() => {
          if (requestId !== requestIdRef.current) return;
          setMatches([]);
          setTruncated(false);
          setSearching(false);
        });
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timer);
    };
  }, [
    caseSensitive,
    enabled,
    maxMatches,
    pathPrefix,
    projectId,
    query,
    searchInProject,
  ]);

  return { matches, searching, truncated };
}
