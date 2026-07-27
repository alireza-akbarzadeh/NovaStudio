import { searchInFiles, type SearchMatch } from "@/features/workspace/lib/search";

export type SearchWorkerRequest = {
  id: number;
  files: Array<{ path: string; kind: string; content?: string }>;
  query: string;
  options?: {
    caseSensitive?: boolean;
    pathPrefix?: string;
    maxMatches?: number;
  };
};

export type SearchWorkerResponse = {
  id: number;
  matches: SearchMatch[];
  truncated: boolean;
};

self.onmessage = (event: MessageEvent<SearchWorkerRequest>) => {
  const { id, files, query, options } = event.data;
  const { matches, truncated } = searchInFiles(files, query, options);
  const response: SearchWorkerResponse = { id, matches, truncated };
  self.postMessage(response);
};
