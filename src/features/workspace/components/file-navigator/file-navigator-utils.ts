import type { Doc } from "@/convex/_generated/dataModel";
import { buildFileTree, type FileTreeNode } from "@/features/workspace/lib/file-tree";
import { getFuzzyMatchIndices } from "@/features/workspace/lib/search";

export function fileBaseName(path: string) {
  return path.split("/").filter(Boolean).pop() || path;
}

export function fileParentDir(path: string) {
  const parts = path.split("/").filter(Boolean);
  if (parts.length <= 1) return "";
  return parts.slice(0, -1).join("/");
}

export function normalizeNavigatorPath(path: string) {
  return path.replace(/^\/+/, "").replace(/\/+$/, "");
}

export function splitNavigatorPath(path: string) {
  return normalizeNavigatorPath(path).split("/").filter(Boolean);
}

export function joinNavigatorPath(segments: string[]) {
  return segments.filter(Boolean).join("/");
}

export type NavigatorFolderEntry = {
  id: string;
  name: string;
  path: string;
};

export type NavigatorFileEntry = {
  path: string;
  name: string;
};

/** Children at a folder path (empty string = project root). */
export function listFolderContents(
  files: Doc<"projectFiles">[] | undefined,
  folderPath: string,
): { folders: NavigatorFolderEntry[]; fileEntries: NavigatorFileEntry[] } {
  if (!files) return { folders: [], fileEntries: [] };

  const normalized = normalizeNavigatorPath(folderPath);
  const prefix = normalized ? `${normalized}/` : "";
  const folderMap = new Map<string, NavigatorFolderEntry>();
  const fileEntries: NavigatorFileEntry[] = [];

  for (const item of files) {
    if (
      normalized &&
      item.path !== normalized &&
      !item.path.startsWith(prefix)
    ) {
      continue;
    }

    const relative = normalized ? item.path.slice(prefix.length) : item.path;
    if (!relative) continue;

    const parts = relative.split("/").filter(Boolean);
    const first = parts[0];
    if (!first) continue;

    if (parts.length === 1) {
      if (item.kind === "folder") {
        folderMap.set(item.path, {
          id: item._id,
          name: item.name,
          path: item.path,
        });
      } else {
        fileEntries.push({ path: item.path, name: item.name });
      }
      continue;
    }

    const childPath = prefix ? `${prefix}${first}` : first;
    if (folderMap.has(childPath)) continue;

    const realFolder = files.find(
      (entry) => entry.kind === "folder" && entry.path === childPath,
    );
    folderMap.set(childPath, {
      id: realFolder?._id ?? `virtual:${childPath}`,
      name: first,
      path: childPath,
    });
  }

  const folders = Array.from(folderMap.values()).sort((a, b) =>
    a.name.localeCompare(b.name),
  );
  fileEntries.sort((a, b) => a.name.localeCompare(b.name));

  return { folders, fileEntries };
}

export function fuzzyMatchFolder(query: string, name: string) {
  const trimmed = query.trim();
  if (!trimmed) return true;
  return getFuzzyMatchIndices(trimmed, name) !== null;
}

export function findTreeNodeByPath(
  nodes: FileTreeNode[],
  path: string,
): FileTreeNode | undefined {
  for (const node of nodes) {
    if (node.path === path) return node;
    if (node.children?.length) {
      const found = findTreeNodeByPath(node.children, path);
      if (found) return found;
    }
  }
  return undefined;
}

export function buildMetadataTree(files: Doc<"projectFiles">[] | undefined) {
  return files ? buildFileTree(files) : [];
}

export function pathExistsInProject(
  files: Doc<"projectFiles">[] | undefined,
  path: string,
) {
  if (!files || !path.trim()) return false;
  const normalized = normalizeNavigatorPath(path);
  return files.some((item) => item.path === normalized);
}

/** Suggest creating a new file when the query looks like a path that does not exist. */
export function suggestCreateFilePath(
  query: string,
  files: Doc<"projectFiles">[] | undefined,
  browsePath = "",
): string | null {
  const trimmed = normalizeNavigatorPath(query.trim());
  if (!trimmed || trimmed.endsWith("/")) return null;

  const fullPath = browsePath ? `${normalizeNavigatorPath(browsePath)}/${trimmed}` : trimmed;
  if (pathExistsInProject(files, fullPath)) return null;

  const base = fileBaseName(trimmed);
  const looksLikeFile =
    base.includes(".") || trimmed.includes("/") || Boolean(browsePath);

  if (!looksLikeFile) return null;

  return fullPath;
}

/** Suggest creating a folder (query ending with / or explicit folder name while browsing). */
export function suggestCreateFolderPath(
  query: string,
  files: Doc<"projectFiles">[] | undefined,
  browsePath = "",
): string | null {
  const raw = query.trim();
  if (!raw) return null;

  const trimmed = normalizeNavigatorPath(raw.replace(/\/+$/, ""));
  if (!trimmed) return null;

  const fullPath = browsePath
    ? `${normalizeNavigatorPath(browsePath)}/${trimmed}`
    : trimmed;

  if (pathExistsInProject(files, fullPath)) return null;

  if (raw.endsWith("/") || browsePath) {
    return fullPath;
  }

  return null;
}
