/**
 * After npm/pnpm/yarn/bun mutates manifests, copy them back into Convex.
 */

import type { WebContainer } from "@webcontainer/api";

import { SYNCABLE_MANIFEST_PATHS } from "@/features/workspace/lib/webcontainer/package-manager";

export type PersistFileFn = (
  path: string,
  content: string,
) => Promise<void>;

async function readTextFile(
  wc: WebContainer,
  path: string,
): Promise<string | null> {
  try {
    const data = await wc.fs.readFile(path, "utf-8");
    return typeof data === "string" ? data : new TextDecoder().decode(data);
  } catch {
    return null;
  }
}

/**
 * Read package.json + lockfiles from the WebContainer and persist via `persist`.
 * Never touches `node_modules`.
 */
export async function syncManifestsToProject(
  wc: WebContainer,
  persist: PersistFileFn,
): Promise<string[]> {
  const synced: string[] = [];

  for (const path of SYNCABLE_MANIFEST_PATHS) {
    const content = await readTextFile(wc, path);
    if (content === null) continue;
    await persist(path, content);
    synced.push(path);
  }

  return synced;
}
