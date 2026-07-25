"use client";

import { useMutation } from "convex/react";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useProject } from "@/features/projects/hooks/use-projects";
import {
  useChangedCommitContext,
  useStagedCommitContext,
} from "@/features/workspace/hooks/use-project-files";
import { saveFileContentDraft } from "@/features/workspace/lib/file-content-drafts";

export type CodeReviewSeverity = "error" | "warning" | "info";

export type CodeReviewFinding = {
  id: string;
  path: string;
  severity: CodeReviewSeverity;
  title: string;
  message: string;
  startLine?: number;
  endLine?: number;
  suggestedContent?: string;
  status?: "open" | "applied" | "dismissed";
};

type CodeReviewApiResult = {
  findings: CodeReviewFinding[];
};

type ReviewFile = {
  path: string;
  isNew: boolean;
  content: string;
  syncedContent: string;
};

export function useCodeReview(projectId: string) {
  const project = useProject({ projectId });
  const stagedContext = useStagedCommitContext(projectId);
  const changedContext = useChangedCommitContext(projectId);
  const updateContent = useMutation(api.projectFiles.updateContent);
  const setFileStaged = useMutation(api.projectFiles.setFileStaged);

  const [findings, setFindings] = useState<CodeReviewFinding[]>([]);
  const [isReviewing, setIsReviewing] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reviewFiles = useMemo((): ReviewFile[] => {
    if (stagedContext && stagedContext.length > 0) {
      return stagedContext;
    }
    return changedContext ?? [];
  }, [changedContext, stagedContext]);

  const openFindings = useMemo(
    () => findings.filter((f) => f.status !== "dismissed" && f.status !== "applied"),
    [findings],
  );

  const review = useCallback(async () => {
    if (reviewFiles.length === 0) {
      toast.error("No local changes to review", {
        description: "Edit files or stage changes first.",
      });
      return;
    }

    setIsReviewing(true);
    setError(null);
    try {
      const response = await fetch("/api/code-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectName: project?.name,
          files: reviewFiles.slice(0, 20),
        }),
      });

      const data = (await response.json()) as
        | CodeReviewApiResult
        | { error?: string };

      if (!response.ok || !("findings" in data)) {
        const description =
          "error" in data && data.error
            ? data.error
            : "Could not complete code review";
        setError(description);
        toast.error("Code review failed", { description });
        return;
      }

      setFindings(
        data.findings.map((finding) => ({
          ...finding,
          status: "open" as const,
        })),
      );
      setHasReviewed(true);
      if (data.findings.length === 0) {
        toast.success("No issues found");
      } else {
        toast.success(
          `Found ${data.findings.length} suggestion${data.findings.length === 1 ? "" : "s"}`,
        );
      }
    } catch (err) {
      const description =
        err instanceof Error ? err.message : "Network request failed";
      setError(description);
      toast.error("Code review failed", { description });
    } finally {
      setIsReviewing(false);
    }
  }, [project?.name, reviewFiles]);

  const dismiss = useCallback((findingId: string) => {
    setFindings((prev) =>
      prev.map((finding) =>
        finding.id === findingId
          ? { ...finding, status: "dismissed" as const }
          : finding,
      ),
    );
  }, []);

  const apply = useCallback(
    async (finding: CodeReviewFinding) => {
      if (!finding.suggestedContent) {
        toast.error("No suggested patch for this finding");
        return false;
      }

      try {
        await updateContent({
          projectId: projectId as Id<"projects">,
          path: finding.path,
          content: finding.suggestedContent,
        });
        saveFileContentDraft(projectId, finding.path, finding.suggestedContent);
        await setFileStaged({
          projectId: projectId as Id<"projects">,
          path: finding.path,
          staged: true,
        });

        setFindings((prev) =>
          prev.map((item) => {
            if (item.id === finding.id) {
              return { ...item, status: "applied" as const };
            }
            // Same-file open findings may be stale after a full-file apply.
            if (
              item.path === finding.path &&
              item.status !== "applied" &&
              item.status !== "dismissed"
            ) {
              return { ...item, status: "dismissed" as const };
            }
            return item;
          }),
        );
        toast.success(`Applied fix to ${finding.path}`);
        return true;
      } catch (err) {
        const description =
          err instanceof Error ? err.message : "Failed to write file";
        toast.error("Could not apply suggestion", { description });
        return false;
      }
    },
    [projectId, setFileStaged, updateContent],
  );

  return {
    review,
    apply,
    dismiss,
    findings: openFindings,
    allFindings: findings,
    findingCount: openFindings.length,
    isReviewing,
    hasReviewed,
    error,
    canReview: reviewFiles.length > 0 && !isReviewing,
    reviewFileCount: reviewFiles.length,
    usingStagedOnly: (stagedContext?.length ?? 0) > 0,
  };
}
