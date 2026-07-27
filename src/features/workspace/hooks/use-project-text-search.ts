"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import type { ProjectFileRow } from "@/features/workspace/hooks/use-project-files";
import type {
  SearchWorkerRequest,
  SearchWorkerResponse,
} from "@/features/workspace/lib/search.worker";
import type { SearchMatch } from "@/features/workspace/lib/search";

const SEARCH_DEBOUNCE_MS = 250;

function getSearchWorker(): Worker {
  return new Worker(new URL("../lib/search.worker.ts", import.meta.url));
}

export function useProjectTextSearch(
  files: ProjectFileRow[] | undefined,
  query: string,
  options: { caseSensitive?: boolean; pathPrefix?: string; enabled?: boolean },
) {
  const { caseSensitive, pathPrefix, enabled = true } = options;
  const [matches, setMatches] = useState<SearchMatch[]>([]);
  const [searching, setSearching] = useState(false);

  const workerRef = useRef<Worker | null>(null);
  const requestIdRef = useRef(0);

  const searchableFiles = useMemo(() => {
    if (!files) return undefined;
    return files.map((file) => ({
      path: file.path,
      kind: file.kind,
      content: file.content,
    }));
  }, [files]);

  useEffect(() => {
    return () => {
      workerRef.current?.terminate();
      workerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const trimmed = query.trim();
    if (!enabled || !searchableFiles || !trimmed) {
      setMatches([]);
      setSearching(false);
      return;
    }

    setSearching(true);
    const requestId = ++requestIdRef.current;

    const timer = window.setTimeout(() => {
      if (!workerRef.current) {
        workerRef.current = getSearchWorker();
      }

      const worker = workerRef.current;
      const onMessage = (event: MessageEvent<SearchWorkerResponse>) => {
        if (event.data.id !== requestId) return;
        worker.removeEventListener("message", onMessage);
        setMatches(event.data.matches);
        setSearching(false);
      };

      worker.addEventListener("message", onMessage);

      const payload: SearchWorkerRequest = {
        id: requestId,
        files: searchableFiles,
        query: trimmed,
        options: { caseSensitive, pathPrefix },
      };
      worker.postMessage(payload);
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timer);
    };
  }, [caseSensitive, enabled, pathPrefix, query, searchableFiles]);

  return { matches, searching };
}
