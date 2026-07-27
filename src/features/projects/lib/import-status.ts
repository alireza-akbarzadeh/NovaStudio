import type { Doc } from "@/convex/_generated/dataModel";

/** Typical GitHub import duration used for remaining-time estimates. */
export const IMPORT_ETA_MS = 45_000;

/**
 * Hard fail threshold for GitHub clones. Stuck jobs (Inngest down, hung
 * fetch, etc.) are marked failed so the user can retry.
 */
export const IMPORT_TIMEOUT_MS = 5 * 60 * 1000;

type ImportProgressProject = Pick<
  Doc<"projects">,
  "importStatus" | "importStartedAt" | "importTotalFiles" | "importDoneFiles"
>;

export function formatImportDuration(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes <= 0) {
    return `${seconds}s`;
  }
  return `${minutes}m ${seconds.toString().padStart(2, "0")}s`;
}

export function getImportFileProgress(
  project: ImportProgressProject,
): { percent: number; label: string } | null {
  if (project.importStatus !== "importing") {
    return null;
  }

  const total = project.importTotalFiles;
  const done = project.importDoneFiles ?? 0;

  if (typeof total === "number" && total > 0) {
    const percent = Math.min(99, Math.round((done / total) * 100));
    return {
      percent,
      label: `Importing ${done.toLocaleString()} / ${total.toLocaleString()} files…`,
    };
  }

  return null;
}

export function getImportProgressPercent(
  project: ImportProgressProject,
  now = Date.now(),
): number | null {
  const fileProgress = getImportFileProgress(project);
  if (fileProgress) {
    return fileProgress.percent;
  }

  if (project.importStatus !== "importing") {
    return null;
  }

  const startedAt = project.importStartedAt ?? now;
  const elapsed = Math.max(0, now - startedAt);
  return Math.min(95, Math.round((elapsed / IMPORT_TIMEOUT_MS) * 100));
}

export function getImportProgressLabel(
  project: ImportProgressProject,
  now = Date.now(),
): string | null {
  const fileProgress = getImportFileProgress(project);
  if (fileProgress) {
    return fileProgress.label;
  }

  return getImportStatusLabel(project, now);
}

export function isImportTimedOut(
  project: Pick<Doc<"projects">, "importStatus" | "importStartedAt">,
  now = Date.now(),
): boolean {
  if (project.importStatus !== "importing") return false;
  const startedAt = project.importStartedAt;
  if (startedAt == null) return false;
  return now - startedAt >= IMPORT_TIMEOUT_MS;
}

export function getImportStatusLabel(
  project: Pick<
    Doc<"projects">,
    "importStatus" | "importStartedAt" | "exportStatus" | "importTotalFiles" | "importDoneFiles"
  >,
  now = Date.now(),
): string | null {
  if (project.importStatus === "importing") {
    const fileProgress = getImportFileProgress(project);
    if (fileProgress) {
      return fileProgress.label;
    }

    const startedAt = project.importStartedAt ?? now;
    const elapsed = Math.max(0, now - startedAt);
    if (elapsed >= IMPORT_TIMEOUT_MS) {
      return "Import timed out — retry to try again";
    }
    const remaining = Math.max(0, IMPORT_ETA_MS - elapsed);
    if (remaining > 0) {
      return `Importing… ~${formatImportDuration(remaining)} left`;
    }
    return `Importing… ${formatImportDuration(elapsed)} elapsed`;
  }

  if (project.exportStatus === "exporting") {
    return "Exporting…";
  }

  return null;
}
