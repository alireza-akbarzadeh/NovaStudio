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

  const folders: NavigatorFolderEntry[] = [];
  const fileEntries: NavigatorFileEntry[] = [];

  for (const item of files) {
    if (normalized && item.path !== normalized && !item.path.startsWith(prefix)) {
      continue;
    }

    const relative = normalized ? item.path.slice(prefix.length) : item.path;
    const segments = relative.split("/").filter(Boolean);
    if (segments.length === 0) continue;

    if (segments.length === 1) {
      if (item.kind === "folder") {
        folders.push({ id: item._id, name: item.name, path: item.path });
      } else {
        fileEntries.push({ path: item.path, name: item.name });
      }
    } else if (item.kind === "folder" && segments.length > 1) {
      const childName = segments[0]!;
      if (!folders.some((folder) => folder.name === childName)) {
        folders.push({
          id: `virtual:${prefix}${childName}`,
          name: childName,
          path: prefix ? `${prefix}${childName}` : childName,
        });
      }
    }
  }

  folders.sort((a, b) => a.name.localeCompare(b.name));
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
): string | null {
  const trimmed = normalizeNavigatorPath(query.trim());
  if (!trimmed || trimmed.endsWith("/")) return null;
  if (pathExistsInProject(files, trimmed)) return null;

  const base = fileBaseName(trimmed);
  if (!base.includes(".") && !trimmed.includes("/")) return null;

  return trimmed;
}
