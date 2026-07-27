"use client";

import { useEffect, useState } from "react";

import type { Doc } from "@/convex/_generated/dataModel";
import { getImportStatusLabel } from "@/features/projects/lib/import-status";

/**
 * Live status label that ticks while a GitHub import is in progress.
 */
export function useImportStatusLabel(
  project: Pick<
    Doc<"projects">,
    "importStatus" | "importStartedAt" | "exportStatus" | "importTotalFiles" | "importDoneFiles"
  >,
): string | null {
  const [now, setNow] = useState(() => Date.now());
  const isImporting = project.importStatus === "importing";

  useEffect(() => {
    if (!isImporting) {
      return;
    }

    setNow(Date.now());
    const id = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => window.clearInterval(id);
  }, [isImporting, project.importStartedAt]);

  return getImportStatusLabel(project, now);
}
