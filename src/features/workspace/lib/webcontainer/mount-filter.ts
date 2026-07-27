import type { ProjectFileLike } from "@/features/workspace/lib/webcontainer/file-tree";

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
  ".output",
  "out",
]);

const MAX_MOUNT_FILE_BYTES = 512 * 1024;

function shouldSkipPath(path: string): boolean {
  const normalized = path.replace(/^\/+/, "").replace(/\/+/g, "/");
  if (!normalized) return true;

  const segments = normalized.split("/");
  for (const segment of segments) {
    if (SKIP_DIR_NAMES.has(segment)) {
      return true;
    }
  }

  return false;
}

/** Drop heavy / generated paths before copying the project into WebContainer. */
export function filterFilesForWebContainerMount(
  files: ProjectFileLike[],
): ProjectFileLike[] {
  return files.filter((file) => {
    if (shouldSkipPath(file.path)) {
      return false;
    }
    if (file.kind === "file" && (file.content?.length ?? 0) > MAX_MOUNT_FILE_BYTES) {
      return false;
    }
    return true;
  });
}
