/**
 * Per-project file locks (local read-only). Persists in localStorage.
 * Independent of project permission — a viewer stays read-only even if unlocked.
 */
import { create } from "zustand";

const STORAGE_KEY = "polaris:locked-files:v1";

type LockedFilesState = {
  /** projectId → locked file paths */
  byProject: Record<string, string[]>;
  hydrated: boolean;
  hydrate: () => void;
  isFileLocked: (projectId: string, path: string) => boolean;
  setFileLocked: (projectId: string, path: string, locked: boolean) => void;
  toggleFileLock: (projectId: string, path: string) => boolean;
};

function loadFromStorage(): Record<string, string[]> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return {};
    const out: Record<string, string[]> = {};
    for (const [projectId, paths] of Object.entries(parsed)) {
      if (!Array.isArray(paths)) continue;
      out[projectId] = paths.filter((p): p is string => typeof p === "string");
    }
    return out;
  } catch {
    return {};
  }
}

function persist(byProject: Record<string, string[]>) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(byProject));
  } catch {
    // ignore quota / private mode
  }
}

export const useLockedFilesStore = create<LockedFilesState>((set, get) => ({
  byProject: {},
  hydrated: false,

  hydrate: () => {
    if (get().hydrated) return;
    set({ byProject: loadFromStorage(), hydrated: true });
  },

  isFileLocked: (projectId, path) => {
    const paths = get().byProject[projectId];
    return Boolean(paths?.includes(path));
  },

  setFileLocked: (projectId, path, locked) => {
    set((s) => {
      const prev = s.byProject[projectId] ?? [];
      const nextPaths = locked
        ? prev.includes(path)
          ? prev
          : [...prev, path]
        : prev.filter((p) => p !== path);
      const byProject = { ...s.byProject };
      if (nextPaths.length === 0) {
        delete byProject[projectId];
      } else {
        byProject[projectId] = nextPaths;
      }
      persist(byProject);
      return { byProject, hydrated: true };
    });
  },

  toggleFileLock: (projectId, path) => {
    const next = !get().isFileLocked(projectId, path);
    get().setFileLocked(projectId, path, next);
    return next;
  },
}));
