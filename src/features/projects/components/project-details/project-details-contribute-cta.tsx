"use client";

import { ExternalLinkIcon, GitForkIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

type ProjectDetailsContributeCtaProps = {
  canOpen: boolean;
  canFork?: boolean;
  opening: boolean;
  forking?: boolean;
  requestStatus?: "pending" | "approved" | "denied";
  onOpenWorkspace: () => void;
  onUseTemplate?: () => void;
  onRequestAccess: () => void;
};

export function ProjectDetailsContributeCta({
  canOpen,
  canFork = false,
  opening,
  forking = false,
  requestStatus,
  onOpenWorkspace,
  onUseTemplate,
  onRequestAccess,
}: ProjectDetailsContributeCtaProps) {
  return (
    <section className="rounded-[24px] border border-primary/20 bg-primary/5 p-6">
      <h2 className="text-base font-semibold">Want to contribute?</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        {canFork
          ? "Copy this workspace as your own template, request editor access, or sponsor a feature."
          : "Request access to join as an editor, star the project, or propose a feature you'd like sponsored."}
      </p>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        {canFork ? (
          <Button
            className="rounded-xl"
            disabled={forking}
            onClick={onUseTemplate}
          >
            <GitForkIcon className="size-4" />
            {forking ? "Copying template…" : "Use as template"}
          </Button>
        ) : null}
        {canOpen ? (
          <Button
            variant={canFork ? "secondary" : "default"}
            className="rounded-xl"
            disabled={opening}
            onClick={onOpenWorkspace}
          >
            <ExternalLinkIcon className="size-4" />
            {opening ? "Opening…" : "Open in Studio"}
          </Button>
        ) : (
          <Button
            className="rounded-xl"
            disabled={requestStatus === "pending"}
            onClick={onRequestAccess}
          >
            {requestStatus === "pending"
              ? "Request pending"
              : "Request access to contribute"}
          </Button>
        )}
      </div>
    </section>
  );
}
