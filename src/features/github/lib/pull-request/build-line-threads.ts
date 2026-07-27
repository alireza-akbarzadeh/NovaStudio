import type { GitHubPullRequestReviewComment } from "@/features/github/hooks/use-github-pull-requests";
import type { ParsedUnifiedPatch } from "@/features/github/lib/parse-unified-patch";

import type { LineThread } from "./types";

export function buildLineThreads(
  reviewComments: GitHubPullRequestReviewComment[],
  parsed: ParsedUnifiedPatch,
): LineThread[] {
  const byFileLine = new Map<number, GitHubPullRequestReviewComment[]>();
  for (const comment of reviewComments) {
    const bucket = byFileLine.get(comment.line) ?? [];
    bucket.push(comment);
    byFileLine.set(comment.line, bucket);
  }

  const threads: LineThread[] = [];
  for (const [fileLine, comments] of byFileLine) {
    const editorLine = parsed.fileLineToModifiedEditorLine.get(fileLine);
    if (!editorLine) continue;
    comments.sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
    threads.push({ editorLine, fileLine, comments });
  }
  threads.sort((a, b) => a.editorLine - b.editorLine);
  return threads;
}
