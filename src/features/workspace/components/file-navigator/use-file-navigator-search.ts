"use client";

import { useMemo } from "react";

import type { Doc } from "@/convex/_generated/dataModel";
import {
  loadRecentFilePaths,
} from "@/features/workspace/lib/recent-files";
import {
  searchFilesByName,
  type FileNameMatch,
} from "@/features/workspace/lib/search";
import { SEARCH_FILE_NAME_LIMIT } from "@/features/workspace/lib/search-limits";

import {
  fuzzyMatchFolder,
  listFolderContents,
  suggestCreateFilePath,
  type NavigatorFileEntry,
  type NavigatorFolderEntry,
} from "./file-navigator-utils";

type UseFileNavigatorSearchArgs = {
  projectId: string;
  metadata: Doc<"projectFiles">[] | undefined;
  query: string;
  browsePath: string;
  enabled?: boolean;
};

export type FileNavigatorSearchResult = {
  recentPaths: string[];
  fileMatches: FileNameMatch[];
  browseFolders: NavigatorFolderEntry[];
  browseFiles: NavigatorFileEntry[];
  createFilePath: string | null;
  fileTruncated: boolean;
  isSearching: boolean;
};

export function useFileNavigatorSearch({
  projectId,
  metadata,
  query,
  browsePath,
  enabled = true,
}: UseFileNavigatorSearchArgs): FileNavigatorSearchResult {
  const trimmedQuery = query.trim();
  const isSearching = trimmedQuery.length > 0;

  const recentPaths = useMemo(() => {
    if (!enabled) return [];
    const paths = loadRecentFilePaths(projectId);
    const fileSet = new Set(
      (metadata ?? [])
        .filter((item) => item.kind === "file")
        .map((item) => item.path),
    );
    return paths.filter((path) => fileSet.has(path)).slice(0, 8);
  }, [enabled, metadata, projectId]);

  const fileSearchResult = useMemo(() => {
    if (!enabled || !metadata || !isSearching) {
      return { matches: [] as FileNameMatch[], truncated: false };
    }
    return searchFilesByName(metadata, trimmedQuery, {
      maxResults: SEARCH_FILE_NAME_LIMIT,
    });
  }, [enabled, isSearching, metadata, trimmedQuery]);

  const folderSearchMatches = useMemo(() => {
    if (!enabled || !metadata || !isSearching) return [] as NavigatorFolderEntry[];

    const folders = metadata
      .filter((item) => item.kind === "folder")
      .map((item) => ({
        id: item._id,
        name: item.name,
        path: item.path,
      }))
      .filter((folder) => fuzzyMatchFolder(trimmedQuery, folder.name))
      .sort((a, b) => a.path.localeCompare(b.path));

    return folders.slice(0, 40);
  }, [enabled, isSearching, metadata, trimmedQuery]);

  const browseContents = useMemo(() => {
    if (!enabled || isSearching) {
      return { folders: [] as NavigatorFolderEntry[], fileEntries: [] as NavigatorFileEntry[] };
    }
    return listFolderContents(metadata, browsePath);
  }, [browsePath, enabled, isSearching, metadata]);

  const createFilePath = useMemo(() => {
    if (!enabled || !isSearching) return null;
    return suggestCreateFilePath(trimmedQuery, metadata);
  }, [enabled, isSearching, metadata, trimmedQuery]);

  return {
    recentPaths,
    fileMatches: fileSearchResult.matches,
    browseFolders: isSearching ? folderSearchMatches : browseContents.folders,
    browseFiles: isSearching ? [] : browseContents.fileEntries,
    createFilePath,
    fileTruncated: fileSearchResult.truncated,
    isSearching,
  };
}
