import type { GitHubPullRequestReviewComment } from "@/features/github/hooks/use-github-pull-requests";
import type { ParsedUnifiedPatch } from "@/features/github/lib/parse-unified-patch";

export type LineThread = {
  editorLine: number;
  fileLine: number;
  comments: GitHubPullRequestReviewComment[];
};

export type PullRequestDiffReviewProps = {
  filePath: string;
  parsed: ParsedUnifiedPatch;
  reviewComments: GitHubPullRequestReviewComment[];
  canComment: boolean;
  isSubmitting: boolean;
  /** When true, the diff fills the parent flex container height. */
  fillHeight?: boolean;
  height?: number;
  onSubmitLineComment: (args: {
    line: number;
    body: string;
    suggestion?: string;
  }) => Promise<void>;
};

export type SubmitLineCommentArgs = PullRequestDiffReviewProps["onSubmitLineComment"] extends (
  args: infer A,
) => unknown
  ? A
  : never;
