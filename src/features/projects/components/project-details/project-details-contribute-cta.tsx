"use client";

import { ExternalLinkIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

type ProjectDetailsContributeCtaProps = {
  canOpen: boolean;
  opening: boolean;
  requestStatus?: "pending" | "approved" | "denied";
  onOpenWorkspace: () => void;
  onRequestAccess: () => void;
};

export function ProjectDetailsContributeCta({
  canOpen,
  opening,
  requestStatus,
  onOpenWorkspace,
  onRequestAccess,
}: ProjectDetailsContributeCtaProps) {
  return (
    <section className="rounded-[24px] border border-primary/20 bg-primary/5 p-6">
      <h2 className="text-base font-semibold">Want to contribute?</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Request access to join as an editor, star the project, or propose a
        feature you&apos;d like sponsored.
      </p>
      <div className="mt-4 flex flex-col gap-2">
        {canOpen ? (
          <Button
            className="rounded-xl"
            disabled={opening}
            onClick={onOpenWorkspace}
          >
            <ExternalLinkIcon className="size-4" />
            Open workspace
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
