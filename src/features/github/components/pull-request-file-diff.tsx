"use client";

import {
  ChevronDownIcon,
  ChevronRightIcon,
  FileIcon,
} from "lucide-react";
import { useMemo, useState } from "react";

import type { GitHubPullRequestFile } from "@/features/github/hooks/use-github-pull-requests";
import {
  diffEditorHeight,
  parseUnifiedPatch,
} from "@/features/github/lib/parse-unified-patch";
import { WorkspaceDiffEditor } from "@/features/workspace/components/workspace-diff-editor";
import { cn } from "@/lib/utils";

function fileBaseName(path: string) {
  return path.split("/").filter(Boolean).pop() ?? path;
}

function fileDirName(path: string) {
  const parts = path.split("/").filter(Boolean);
  if (parts.length <= 1) return "";
  return parts.slice(0, -1).join("/");
}

function FileStatusBadge({ status }: { status: string }) {
  const className =
    status === "added"
      ? "bg-emerald-500/15 text-emerald-500"
      : status === "removed"
        ? "bg-red-500/15 text-red-400"
        : status === "renamed"
          ? "bg-violet-500/15 text-violet-400"
          : "bg-ws-text-muted/15 text-ws-text-muted";

  return (
    <span
      className={cn(
        "shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-medium uppercase",
        className,
      )}
    >
      {status}
    </span>
  );
}

function UnifiedPatchFallback({ patch }: { patch: string }) {
  return (
    <div className="max-h-72 overflow-auto border-t border-ws-border/70 bg-[#0d1117] p-0 font-mono text-[11px] leading-5">
      {patch.split("\n").map((line, index) => {
        if (line.startsWith("@@")) {
          return (
            <div
              key={`${index}-${line}`}
              className="bg-sky-500/10 px-2 py-0.5 text-sky-400"
            >
              {line}
            </div>
          );
        }
        if (line.startsWith("+") && !line.startsWith("+++")) {
          return (
            <div
              key={`${index}-${line}`}
              className="bg-emerald-500/20 px-2 text-emerald-300"
            >
              {line}
            </div>
          );
        }
        if (line.startsWith("-") && !line.startsWith("---")) {
          return (
            <div
              key={`${index}-${line}`}
              className="bg-red-500/20 px-2 text-red-300"
            >
              {line}
            </div>
          );
        }
        if (
          line.startsWith("diff ") ||
          line.startsWith("index ") ||
          line.startsWith("--- ") ||
          line.startsWith("+++ ")
        ) {
          return (
            <div
              key={`${index}-${line}`}
              className="px-2 py-0.5 text-ws-text-muted"
            >
              {line}
            </div>
          );
        }
        return (
          <div key={`${index}-${line}`} className="px-2 text-ws-text-secondary">
            {line || " "}
          </div>
        );
      })}
    </div>
  );
}

type PullRequestFileDiffProps = {
  file: GitHubPullRequestFile;
  expanded: boolean;
  onToggle: () => void;
};

export function PullRequestFileDiff({
  file,
  expanded,
  onToggle,
}: PullRequestFileDiffProps) {
  const parsed = useMemo(
    () => (file.patch ? parseUnifiedPatch(file.patch) : null),
    [file.patch],
  );

  const editorHeight = useMemo(() => {
    if (!parsed) return 200;
    const lines = Math.max(
      parsed.original.split("\n").length,
      parsed.modified.split("\n").length,
    );
    return diffEditorHeight(lines);
  }, [parsed]);

  const baseName = fileBaseName(file.filename);
  const dirName = fileDirName(file.filename);

  return (
    <li className="overflow-hidden rounded-md border border-ws-border/70 bg-ws-panel/40">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-2 px-2.5 py-2 text-left transition-colors hover:bg-ws-hover/50"
      >
        {expanded ? (
          <ChevronDownIcon className="size-3 shrink-0 text-ws-text-muted" />
        ) : (
          <ChevronRightIcon className="size-3 shrink-0 text-ws-text-muted" />
        )}
        <FileIcon className="size-3 shrink-0 text-ws-text-muted" />
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-baseline gap-1">
            {dirName ? (
              <span className="truncate text-[10px] text-ws-text-muted">
                {dirName}/
              </span>
            ) : null}
            <span className="truncate font-mono text-[11px] text-ws-text">
              {baseName}
            </span>
          </div>
          {file.previousFilename ? (
            <p className="truncate text-[10px] text-ws-text-muted">
              renamed from {file.previousFilename}
            </p>
          ) : null}
        </div>
        <FileStatusBadge status={file.status} />
        <span className="shrink-0 text-[10px] tabular-nums text-emerald-500">
          +{file.additions}
        </span>
        <span className="shrink-0 text-[10px] tabular-nums text-red-400">
          −{file.deletions}
        </span>
      </button>

      {expanded ? (
        file.patch ? (
          parsed ? (
            <div className="border-t border-ws-border/70">
              <div className="flex items-center justify-between border-b border-ws-border/70 bg-ws-panel/80 px-2.5 py-1 text-[10px] text-ws-text-muted">
                <span>Base</span>
                <span>→</span>
                <span>Head</span>
              </div>
              <div style={{ height: editorHeight }}>
                <WorkspaceDiffEditor
                  filePath={file.filename}
                  original={parsed.original}
                  modified={parsed.modified}
                  renderSideBySide={false}
                  height={editorHeight}
                />
              </div>
            </div>
          ) : (
            <UnifiedPatchFallback patch={file.patch} />
          )
        ) : (
          <p className="border-t border-ws-border/70 px-2.5 py-2 text-[10px] text-ws-text-muted italic">
            No patch available (binary or too large).
          </p>
        )
      ) : null}
    </li>
  );
}

type PullRequestFilesSectionProps = {
  files: GitHubPullRequestFile[];
};

export function PullRequestFilesSection({
  files,
}: PullRequestFilesSectionProps) {
  const [expandedFiles, setExpandedFiles] = useState<Set<string>>(() =>
    files.length === 1 ? new Set([files[0]!.filename]) : new Set(),
  );

  const allExpanded =
    files.length > 0 && files.every((file) => expandedFiles.has(file.filename));

  const toggleFile = (filename: string) => {
    setExpandedFiles((current) => {
      const next = new Set(current);
      if (next.has(filename)) {
        next.delete(filename);
      } else {
        next.add(filename);
      }
      return next;
    });
  };

  const setAllExpanded = (expand: boolean) => {
    setExpandedFiles(
      expand ? new Set(files.map((file) => file.filename)) : new Set(),
    );
  };

  if (files.length === 0) {
    return <p className="text-[11px] text-ws-text-muted">No files.</p>;
  }

  return (
    <div className="space-y-2 border-t border-ws-border-subtle pt-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] font-medium tracking-wide text-ws-text-muted uppercase">
          Files changed ({files.length})
        </p>
        {files.length > 1 ? (
          <button
            type="button"
            onClick={() => setAllExpanded(!allExpanded)}
            className="text-[10px] text-ws-link hover:underline"
          >
            {allExpanded ? "Collapse all" : "Expand all"}
          </button>
        ) : null}
      </div>
      <ul className="space-y-1.5">
        {files.map((file) => (
          <PullRequestFileDiff
            key={file.filename}
            file={file}
            expanded={expandedFiles.has(file.filename)}
            onToggle={() => toggleFile(file.filename)}
          />
        ))}
      </ul>
    </div>
  );
}
