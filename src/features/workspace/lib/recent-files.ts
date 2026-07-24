/** Persist recently opened file paths per project for the command palette. */

const STORAGE_PREFIX = "polaris-recent-files:";
const MAX_RECENT = 12;

function storageKey(projectId: string) {
  return `${STORAGE_PREFIX}${projectId}`;
}

export function loadRecentFilePaths(projectId: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(storageKey(projectId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is string => typeof item === "string");
  } catch {
    return [];
  }
}

export function pushRecentFilePath(projectId: string, path: string) {
  if (typeof window === "undefined" || !path) return;
  const next = [
    path,
    ...loadRecentFilePaths(projectId).filter((item) => item !== path),
  ].slice(0, MAX_RECENT);
  try {
    localStorage.setItem(storageKey(projectId), JSON.stringify(next));
  } catch {
    // ignore quota
  }
}
