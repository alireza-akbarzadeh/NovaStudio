"use client";

import { useState } from "react";

import { WorkspaceGitCi } from "@/features/workspace/components/workspace-git-ci";
import { WorkspaceGitIssues } from "@/features/workspace/components/workspace-git-issues";
import { WorkspaceGitPullRequests } from "@/features/workspace/components/workspace-git-pull-requests";
import { GitHubDisabledPanel } from "@/features/github/components/github-hub-ui";
import { cn } from "@/lib/utils";

type GitHubHubSection = "issues" | "pulls" | "actions";

type WorkspaceGitHubHubProps = {
  projectId: string;
  enabled: boolean;
};

const SECTIONS: { id: GitHubHubSection; label: string }[] = [
  { id: "issues", label: "Issues" },
  { id: "pulls", label: "Pull Requests" },
  { id: "actions", label: "Actions" },
];

export function WorkspaceGitHubHub({
  projectId,
  enabled,
}: WorkspaceGitHubHubProps) {
  const [section, setSection] = useState<GitHubHubSection>("issues");

  if (!enabled) {
    return (
      <GitHubDisabledPanel message="Connect and publish this project to GitHub to use Issues, Pull Requests, and Actions without leaving NovaStudio." />
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex h-7 shrink-0 items-end gap-px border-b border-ws-border-subtle bg-ws-panel px-1">
        {SECTIONS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setSection(item.id)}
            className={cn(
              "inline-flex h-6 items-center rounded-t-sm px-2 text-[10px] font-medium transition-colors",
              section === item.id
                ? "bg-ws-bg text-ws-text"
                : "text-ws-text-muted hover:text-ws-text",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className="min-h-0 flex-1 overflow-hidden">
        {section === "issues" ? (
          <WorkspaceGitIssues projectId={projectId} enabled={enabled} />
        ) : section === "pulls" ? (
          <WorkspaceGitPullRequests projectId={projectId} enabled={enabled} />
        ) : (
          <WorkspaceGitCi projectId={projectId} enabled={enabled} />
        )}
      </div>
    </div>
  );
}
