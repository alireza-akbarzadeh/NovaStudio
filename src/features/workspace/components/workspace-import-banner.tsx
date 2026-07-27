"use client";

import { Loader2Icon } from "lucide-react";
import { useEffect, useState } from "react";

import { Progress } from "@/components/ui/progress";
import { useProject } from "@/features/projects/hooks/use-projects";
import {
  getImportFileProgress,
  getImportProgressLabel,
  getImportProgressPercent,
} from "@/features/projects/lib/import-status";

type WorkspaceImportBannerProps = {
  projectId: string;
};

export function WorkspaceImportBanner({ projectId }: WorkspaceImportBannerProps) {
  const project = useProject({ projectId });
  const [now, setNow] = useState(() => Date.now());

  const isImporting = project?.importStatus === "importing";

  useEffect(() => {
    if (!isImporting) return;
    setNow(Date.now());
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [isImporting, project?.importStartedAt]);

  if (!project || !isImporting) {
    return null;
  }

  const fileProgress = getImportFileProgress(project);
  const percent = getImportProgressPercent(project, now) ?? 0;
  const label =
    getImportProgressLabel(project, now) ??
    "Cloning from GitHub — file tree updates as files arrive";

  return (
    <div className="border-b border-violet-500/25 bg-violet-500/8 px-3 py-2">
      <div className="flex items-center gap-2">
        <Loader2Icon className="size-3.5 shrink-0 animate-spin text-violet-500" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[11px] font-medium text-ws-text">
            {label}
          </p>
          {fileProgress ? (
            <p className="text-[10px] text-ws-text-muted">
              You can browse the explorer while the clone finishes.
            </p>
          ) : null}
        </div>
        <span className="shrink-0 font-mono text-[10px] text-ws-text-muted tabular-nums">
          {percent}%
        </span>
      </div>
      <Progress
        value={percent}
        className="mt-2 h-1.5 bg-ws-hover [&>[data-slot=progress-indicator]]:bg-violet-500"
      />
    </div>
  );
}
