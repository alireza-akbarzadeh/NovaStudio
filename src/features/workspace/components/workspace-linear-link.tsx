"use client";

import {
  ExternalLinkIcon,
  KanbanSquareIcon,
  Link2OffIcon,
  Loader2Icon,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLinearConnection } from "@/features/integrations/hooks/use-linear-connection";
import { useProjectLinearLink } from "@/features/integrations/hooks/use-project-linear-link";

type WorkspaceLinearLinkProps = {
  projectId: string;
};

export function WorkspaceLinearLink({ projectId }: WorkspaceLinearLinkProps) {
  const { isConnected, isLoading: isConnectionLoading } = useLinearConnection();
  const { link, isLoading, isLinking, isUnlinking, linkIssue, unlinkIssue } =
    useProjectLinearLink(projectId);
  const [issueIdentifier, setIssueIdentifier] = useState("");

  if (isConnectionLoading || isLoading) {
    return (
      <div className="flex items-center gap-2 text-[11px] text-ws-text-muted">
        <Loader2Icon className="size-3.5 animate-spin" />
        Loading Linear…
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="space-y-2 rounded-lg border border-ws-border/70 bg-ws-stage/40 p-2.5">
        <div className="flex items-center gap-2 text-[11px] text-ws-text">
          <KanbanSquareIcon className="size-3.5 text-ws-text-muted" />
          <span className="font-medium">Linear</span>
        </div>
        <p className="text-[11px] leading-relaxed text-ws-text-muted">
          Connect Linear in Integrations to link an issue and sync status on push
          or deploy.
        </p>
        <Button
          asChild
          variant="outline"
          size="sm"
          className="h-7 w-full border-ws-border bg-ws-bg text-[11px] text-ws-text hover:bg-ws-hover"
        >
          <Link href="/projects/integrations">Open Integrations</Link>
        </Button>
      </div>
    );
  }

  if (link) {
    return (
      <div className="space-y-2 rounded-lg border border-ws-border/70 bg-ws-stage/40 p-2.5">
        <div className="flex items-center gap-2 text-[11px]">
          <KanbanSquareIcon className="size-3.5 text-ws-text-muted" />
          <span className="font-medium text-ws-text">Linear issue</span>
          <span className="ml-auto font-mono text-ws-text-secondary">
            {link.issueIdentifier}
          </span>
        </div>
        <p className="truncate text-[11px] text-ws-text-muted">{link.issueTitle}</p>
        <div className="flex gap-2">
          <Button
            asChild
            variant="outline"
            size="sm"
            className="h-7 flex-1 border-ws-border bg-ws-bg text-[11px] text-ws-text hover:bg-ws-hover"
          >
            <a href={link.issueUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLinkIcon className="size-3.5" />
              Open in Linear
            </a>
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isUnlinking}
            onClick={() => void unlinkIssue()}
            className="h-7 border-ws-border bg-ws-bg text-[11px] text-ws-text hover:bg-ws-hover"
          >
            {isUnlinking ? (
              <Loader2Icon className="size-3.5 animate-spin" />
            ) : (
              <Link2OffIcon className="size-3.5" />
            )}
          </Button>
        </div>
        <p className="text-[10px] leading-relaxed text-ws-text-muted">
          Push → comment + In Review · Deploy success → comment + Done (when
          those states exist in your team workflow).
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2 rounded-lg border border-ws-border/70 bg-ws-stage/40 p-2.5">
      <div className="flex items-center gap-2 text-[11px] text-ws-text">
        <KanbanSquareIcon className="size-3.5 text-ws-text-muted" />
        <span className="font-medium">Link Linear issue</span>
      </div>
      <div className="flex gap-2">
        <Input
          value={issueIdentifier}
          onChange={(event) => setIssueIdentifier(event.target.value)}
          placeholder="ENG-123"
          className="h-7 border-ws-border bg-ws-bg text-[11px] text-ws-text"
        />
        <Button
          type="button"
          size="sm"
          disabled={!issueIdentifier.trim() || isLinking}
          onClick={() => void linkIssue(issueIdentifier.trim())}
          className="h-7 bg-ws-accent text-[11px] text-white hover:bg-ws-accent-hover"
        >
          {isLinking ? (
            <Loader2Icon className="size-3.5 animate-spin" />
          ) : (
            "Link"
          )}
        </Button>
      </div>
    </div>
  );
}
