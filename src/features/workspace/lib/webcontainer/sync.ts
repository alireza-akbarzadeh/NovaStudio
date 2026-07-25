/**
 * Mount / write project files into a WebContainer filesystem.
 */

import type { WebContainer } from "@webcontainer/api";

import {
  isIgnoredWebContainerPath,
  projectFilesToTree,
  type ProjectFileLike,
} from "@/features/workspace/lib/webcontainer/file-tree";

/** Ensure parent directories exist for a relative path like `src/lib/foo.ts`. */
async function ensureParentDirs(
  wc: WebContainer,
  relativePath: string,
): Promise<void> {
  const parts = relativePath.split("/").filter(Boolean);
  if (parts.length <= 1) return;

  let current = "";
  for (let i = 0; i < parts.length - 1; i++) {
    current = current ? `${current}/${parts[i]}` : parts[i]!;
    try {
      await wc.fs.mkdir(current);
    } catch {
      // Exists or not creatable as dir — continue.
    }
  }
}

/** Mount the full project tree (replaces overlapping paths). */
export async function mountProject(
  wc: WebContainer,
  files: ProjectFileLike[],
): Promise<void> {
  const tree = projectFilesToTree(files);
  await wc.mount(tree);
}

/**
 * Write a single project file into the WebContainer.
 * Skips `node_modules` paths.
 */
export async function writeProjectFile(
  wc: WebContainer,
  path: string,
  content: string,
): Promise<void> {
  const relative = path.replace(/^\/+/, "").replace(/\/+/g, "/");
  if (!relative || isIgnoredWebContainerPath(relative)) return;

  await ensureParentDirs(wc, relative);
  await wc.fs.writeFile(relative, content);
}

/** True when `node_modules` exists at the project root inside the container. */
export async function hasNodeModules(wc: WebContainer): Promise<boolean> {
  try {
    const entries = await wc.fs.readdir("node_modules");
    return Array.isArray(entries) && entries.length >= 0;
  } catch {
    return false;
  }
}
