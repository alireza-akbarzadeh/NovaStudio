"use client";

import {
  CheckIcon,
  CircleAlertIcon,
  CircleXIcon,
  InfoIcon,
  Loader2Icon,
  SparklesIcon,
  XIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  useCodeReview,
  type CodeReviewFinding,
  type CodeReviewSeverity,
} from "@/features/workspace/hooks/use-code-review";
import { useEditorTabs } from "@/features/workspace/hooks/use-editor-tabs";
import { useWorkspaceStore } from "@/features/workspace/store/workspace-store";
import { cn } from "@/lib/utils";

type WorkspaceGitReviewsProps = {
  projectId: string;
  enabled?: boolean;
};

function SeverityIcon({ severity }: { severity: CodeReviewSeverity }) {
  if (severity === "error") {
    return <CircleXIcon className="size-3.5 shrink-0 text-ws-danger-soft" />;
  }
  if (severity === "warning") {
    return <CircleAlertIcon className="size-3.5 shrink-0 text-amber-500" />;
  }
  return <InfoIcon className="size-3.5 shrink-0 text-ws-link" />;
}

export function WorkspaceGitReviews({
  projectId,
  enabled = true,
}: WorkspaceGitReviewsProps) {
  const {
    review,
    apply,
    dismiss,
    findings,
    findingCount,
    isReviewing,
    hasReviewed,
    error,
    canReview,
    reviewFileCount,
    usingStagedOnly,
  } = useCodeReview(projectId);
  const { openTab } = useEditorTabs(projectId);
  const setPendingEditorReveal = useWorkspaceStore(
    (s) => s.setPendingEditorReveal,
  );

  const onOpenFinding = (finding: CodeReviewFinding) => {
    const line = finding.startLine ?? 1;
    setPendingEditorReveal({
      path: finding.path,
      line,
      column: 1,
      matchLength: 1,
    });
    openTab({ kind: "file", path: finding.path }, { mode: "preview" });
  };

  if (!enabled) {
    return (
      <p className="px-3 py-4 text-[11px] text-ws-text-muted">
        Open a project with local files to run an AI code review.
      </p>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="space-y-2 border-b border-ws-border-subtle p-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-medium text-ws-text-muted">
            AI code review
          </span>
          {findingCount > 0 ? (
            <span className="rounded-full bg-ws-accent px-1.5 text-[9px] text-white">
              {findingCount}
            </span>
          ) : null}
        </div>
        <Button
          type="button"
          size="sm"
          disabled={!canReview}
          onClick={() => void review()}
          className="h-7 w-full bg-ws-accent text-[11px] text-white hover:bg-ws-accent-hover disabled:opacity-50"
        >
          {isReviewing ? (
            <>
              <Loader2Icon className="size-3.5 animate-spin" />
              Reviewing…
            </>
          ) : (
            <>
              <SparklesIcon className="size-3.5" />
              Review changes
              {reviewFileCount > 0 ? ` (${reviewFileCount})` : ""}
            </>
          )}
        </Button>
        <p className="text-[10px] leading-relaxed text-ws-text-muted">
          {reviewFileCount === 0
            ? "Make or stage local edits, then run a review. Suggestions apply inside the editor."
            : usingStagedOnly
              ? "Reviews staged files. Apply a fix to update the file and keep it staged."
              : "No staged files — reviewing all local changes."}
        </p>
      </div>

      <div className="min-h-0 flex-1 overflow-auto">
        {isReviewing && findings.length === 0 && !hasReviewed ? (
          <div className="flex items-center gap-2 px-3 py-4 text-[11px] text-ws-text-muted">
            <Loader2Icon className="size-3.5 animate-spin" />
            Analyzing changes…
          </div>
        ) : error && !hasReviewed ? (
          <div className="space-y-2 px-3 py-4">
            <p className="text-[11px] text-ws-danger-soft">{error}</p>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={!canReview}
              onClick={() => void review()}
              className="h-7 text-[11px] text-ws-text-secondary hover:bg-ws-hover hover:text-ws-text"
            >
              Try again
            </Button>
          </div>
        ) : !hasReviewed ? (
          <div className="space-y-1 px-3 py-4">
            <p className="text-[12px] font-medium text-ws-text">
              Review before you push
            </p>
            <p className="text-[11px] leading-relaxed text-ws-text-muted">
              NovaStudio AI checks your local diffs for bugs and risks, then offers
              patches you can apply without leaving the editor.
            </p>
          </div>
        ) : findings.length === 0 ? (
          <div className="space-y-1 px-3 py-4">
            <p className="text-[12px] font-medium text-ws-text">All clear</p>
            <p className="text-[11px] leading-relaxed text-ws-text-muted">
              No high-signal issues in the reviewed changes. You can Commit &amp;
              Push when ready.
            </p>
          </div>
        ) : (
          <ul className="space-y-0 p-1.5">
            {findings.map((finding) => (
              <li key={finding.id}>
                <div className="rounded-sm px-2 py-1.5 hover:bg-ws-hover">
                  <button
                    type="button"
                    onClick={() => onOpenFinding(finding)}
                    className="flex w-full gap-2 text-left"
                  >
                    <SeverityIcon severity={finding.severity} />
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <p className="text-[12px] leading-snug font-medium text-ws-text">
                        {finding.title}
                      </p>
                      <p className="text-[11px] leading-snug text-ws-text-muted">
                        {finding.message}
                      </p>
                      <p className="font-mono text-[10px] text-ws-link">
                        {finding.path}
                        {finding.startLine != null
                          ? `:${finding.startLine}`
                          : ""}
                      </p>
                    </div>
                  </button>
                  <div className="mt-1.5 flex items-center gap-1 pl-5">
                    {finding.suggestedContent ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => void apply(finding)}
                        className="h-6 gap-1 border-ws-border bg-ws-bg px-2 text-[10px] text-ws-text hover:bg-ws-hover"
                      >
                        <CheckIcon className="size-3" />
                        Apply
                      </Button>
                    ) : null}
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => dismiss(finding.id)}
                      className={cn(
                        "h-6 gap-1 px-2 text-[10px] text-ws-text-muted hover:bg-ws-hover hover:text-ws-text",
                      )}
                    >
                      <XIcon className="size-3" />
                      Dismiss
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
