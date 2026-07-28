"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { GitHubConnectionStatus } from "@/features/github/components/github-connection-status";
import {
  useConnectGitHub,
  useGitHubConnection,
} from "@/features/github/hooks/use-github-connection";
import { useInitializeGitRepo } from "@/features/github/hooks/use-initialize-git-repo";
import { GITHUB_REPO_SCOPE_MESSAGE } from "@/features/github/lib/github-scopes";
import { suggestRepoName } from "@/features/workspace/lib/git-repo-name";

type ProjectDetailsPushGitHubDialogProps = {
  projectId: string;
  projectName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ProjectDetailsPushGitHubDialog({
  projectId,
  projectName,
  open,
  onOpenChange,
}: ProjectDetailsPushGitHubDialogProps) {
  const { isConnected, hasRepoScope } = useGitHubConnection();
  const { connect, isConnecting: isAuthorizing } = useConnectGitHub();
  const { initialize, isInitializing, lastError, clearError } =
    useInitializeGitRepo(projectId);
  const [repoName, setRepoName] = useState("");
  const [isPrivate, setIsPrivate] = useState(true);

  useEffect(() => {
    if (open && projectName) {
      setRepoName(suggestRepoName(projectName));
      clearError();
    }
  }, [open, projectName, clearError]);

  const canInitialize =
    isConnected && hasRepoScope && repoName.trim().length > 0;

  async function handleInitialize() {
    if (!canInitialize || isInitializing) return;

    try {
      await initialize({ repoName: repoName.trim(), isPrivate });
      onOpenChange(false);
    } catch {
      /* toast handled in hook */
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Push to GitHub</DialogTitle>
          <DialogDescription>
            Create a GitHub repository and push this project&apos;s files.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-1">
          <GitHubConnectionStatus className="text-xs" />
          <div className="space-y-2">
            <label
              htmlFor="project-push-repo-name"
              className="text-sm font-medium"
            >
              Repository name
            </label>
            <Input
              id="project-push-repo-name"
              value={repoName}
              onChange={(event) => setRepoName(event.target.value)}
              placeholder="repository-name"
              className="rounded-xl"
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={isPrivate}
              onChange={(event) => setIsPrivate(event.target.checked)}
              className="accent-primary"
            />
            Private repository
          </label>
          {!isConnected ? (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                Connect GitHub before pushing this project.
              </p>
              <Button
                type="button"
                size="sm"
                className="rounded-xl"
                disabled={isAuthorizing}
                onClick={() => void connect()}
              >
                {isAuthorizing ? "Connecting…" : "Connect GitHub"}
              </Button>
            </div>
          ) : !hasRepoScope ? (
            <div className="space-y-2">
              <p className="text-xs text-amber-700 dark:text-amber-300">
                {GITHUB_REPO_SCOPE_MESSAGE}
              </p>
              <Button
                type="button"
                size="sm"
                className="rounded-xl"
                disabled={isAuthorizing}
                onClick={() => void connect()}
              >
                {isAuthorizing ? "Authorizing…" : "Grant repository access"}
              </Button>
            </div>
          ) : null}
          {lastError ? (
            <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {lastError}
            </p>
          ) : null}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            className="rounded-xl"
            disabled={isInitializing}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            className="rounded-xl"
            disabled={!canInitialize || isInitializing}
            onClick={() => void handleInitialize()}
          >
            {isInitializing ? "Pushing…" : "Push to GitHub"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
