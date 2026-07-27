"use client";

import { FileIcon } from "lucide-react";

import type {
  GitHubPullRequestDetail,
  GitHubPullRequestReviewComment,
} from "@/features/github/hooks/use-github-pull-requests";
import { fileBaseName } from "@/features/github/lib/pull-request/file-base-name";
import { cn } from "@/lib/utils";

type PullRequestFilesSidebarProps = {
  files: GitHubPullRequestDetail["files"];
  reviewComments: GitHubPullRequestReviewComment[];
  selectedFile: string | null;
  onSelectFile: (filename: string) => void;
};

export function PullRequestFilesSidebar({
  files,
  reviewComments,
  selectedFile,
  onSelectFile,
}: PullRequestFilesSidebarProps) {
  return (
    <aside className="flex w-52 shrink-0 flex-col border-r border-ws-border-subtle bg-ws-panel/20">
      <div className="shrink-0 border-b border-ws-border-subtle px-3 py-1.5">
        <p className="text-[10px] font-medium tracking-wide text-ws-text-muted uppercase">
          Files ({files.length})
        </p>
      </div>
      <ul className="min-h-0 flex-1 overflow-auto p-1">
        {files.map((file) => {
          const commentCount = reviewComments.filter(
            (comment) => comment.path === file.filename,
          ).length;
          const isActive = selectedFile === file.filename;

          return (
            <li key={file.filename}>
              <button
                type="button"
                onClick={() => onSelectFile(file.filename)}
                className={cn(
                  "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors",
                  isActive
                    ? "bg-ws-accent/15 text-ws-text"
                    : "text-ws-text-secondary hover:bg-ws-hover",
                )}
              >
                <FileIcon className="size-3 shrink-0 opacity-70" />
                <span className="min-w-0 flex-1 truncate font-mono text-[11px]">
                  {fileBaseName(file.filename)}
                </span>
                {commentCount > 0 ? (
                  <span className="shrink-0 rounded-full bg-sky-500/15 px-1.5 py-0.5 text-[9px] font-medium text-sky-400">
                    {commentCount}
                  </span>
                ) : null}
              </button>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
