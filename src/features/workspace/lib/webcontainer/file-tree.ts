/**
 * Convert Polaris project files into a WebContainer FileSystemTree.
 */

import type { FileSystemTree } from "@webcontainer/api";

export type ProjectFileLike = {
  path: string;
  kind: "file" | "folder";
  content?: string;
};

function isIgnoredPath(path: string): boolean {
  const normalized = path.replace(/^\/+/, "");
  return (
    normalized === "node_modules" ||
    normalized.startsWith("node_modules/") ||
    normalized.includes("/node_modules/")
  );
}

/**
 * Build a nested FileSystemTree from flat project file rows.
 * Folders without children are still created when listed.
 */
export function projectFilesToTree(files: ProjectFileLike[]): FileSystemTree {
  const root: FileSystemTree = {};

  const ensureDir = (
    tree: FileSystemTree,
    name: string,
  ): FileSystemTree => {
    const existing = tree[name];
    if (existing && "directory" in existing) {
      return existing.directory;
    }
    const directory: FileSystemTree = {};
    tree[name] = { directory };
    return directory;
  };

  for (const file of files) {
    const normalized = file.path.replace(/^\/+/, "").replace(/\/+/g, "/");
    if (!normalized || isIgnoredPath(normalized)) continue;

    const segments = normalized.split("/").filter(Boolean);
    if (segments.length === 0) continue;

    let cursor = root;
    for (let i = 0; i < segments.length - 1; i++) {
      cursor = ensureDir(cursor, segments[i]!);
    }

    const leaf = segments[segments.length - 1]!;
    if (file.kind === "folder") {
      ensureDir(cursor, leaf);
    } else {
      cursor[leaf] = {
        file: {
          contents: file.content ?? "",
        },
      };
    }
  }

  return root;
}

/** Strip leading slash for WebContainer paths (`/src` → `src`, `/` → `.`). */
export function toWebContainerCwd(cwd: string): string {
  if (!cwd || cwd === "/") return ".";
  return cwd.replace(/^\/+/, "").replace(/\/+$/, "") || ".";
}

export function isIgnoredWebContainerPath(path: string): boolean {
  return isIgnoredPath(path);
}
