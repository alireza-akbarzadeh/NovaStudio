import type { Doc } from "@/convex/_generated/dataModel";

/** Typical GitHub import duration used for remaining-time estimates. */
export const IMPORT_ETA_MS = 45_000;

export function formatImportDuration(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes <= 0) {
    return `${seconds}s`;
  }
  return `${minutes}m ${seconds.toString().padStart(2, "0")}s`;
}

export function getImportStatusLabel(
  project: Pick<Doc<"projects">, "importStatus" | "importStartedAt" | "exportStatus">,
  now = Date.now(),
): string | null {
  if (project.importStatus === "importing") {
    const startedAt = project.importStartedAt ?? now;
    const elapsed = Math.max(0, now - startedAt);
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
