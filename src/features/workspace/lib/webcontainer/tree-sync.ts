/**
 * After scaffolding (npx create-*, npm create, …), copy new text files
 * from the WebContainer back into Convex. Never syncs node_modules.
 */

import type { WebContainer } from "@webcontainer/api";

import { isIgnoredWebContainerPath } from "@/features/workspace/lib/webcontainer/file-tree";
import type { PersistFileFn } from "@/features/workspace/lib/webcontainer/lockfile-sync";

const MAX_FILE_BYTES = 512 * 1024;
const MAX_FILES = 400;

const SKIP_DIR_NAMES = new Set([
  "node_modules",
  ".git",
  ".next",
  "dist",
  "build",
  ".cache",
  "coverage",
  ".turbo",
  ".vercel",
]);

function isProbablyBinary(content: string): boolean {
  return content.includes("\0");
}

async function walkFiles(
  wc: WebContainer,
  dir: string,
  out: string[],
): Promise<void> {
  let entries;
  try {
    entries = await wc.fs.readdir(dir || ".", { withFileTypes: true });
  } catch {
    return;
  }

  for (const entry of entries) {
    const name = entry.name;
    if (SKIP_DIR_NAMES.has(name)) continue;

    const path = dir ? `${dir}/${name}` : name;
    if (isIgnoredWebContainerPath(path)) continue;

    if (entry.isDirectory()) {
      await walkFiles(wc, path, out);
      continue;
    }

    if (entry.isFile()) {
      out.push(path);
    }
  }
}

/**
 * Persist text files from the WebContainer FS into the NovaStudio project.
 * Returns the list of paths written.
 */
export async function syncTreeToProject(
  wc: WebContainer,
  persist: PersistFileFn,
  options?: { root?: string },
): Promise<string[]> {
  const root = (options?.root ?? "").replace(/^\/+/, "").replace(/\/+$/, "");
  const paths: string[] = [];
  await walkFiles(wc, root, paths);

  const synced: string[] = [];
  for (const path of paths) {
    if (synced.length >= MAX_FILES) break;

    let content: string;
    try {
      content = await wc.fs.readFile(path, "utf-8");
    } catch {
      continue;
    }

    if (content.length > MAX_FILE_BYTES) continue;
    if (isProbablyBinary(content)) continue;

    await persist(path, content);
    synced.push(path);
  }

  return synced;
}
