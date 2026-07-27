"use node";

import { v } from "convex/values";
import { RequestError } from "@octokit/request-error";

import { action } from "./_generated/server";
import { formatGitHubApiError } from "./lib/github";
import { requireProjectGitHubAccess } from "./lib/githubProjectAccess";

function throwGitHubError(error: unknown, fallback: string): never {
  const formatted = formatGitHubApiError(error);
  throw new Error(formatted ?? fallback);
}

function mapWorkflowRun(run: {
  id: number;
  name?: string | null;
  display_title?: string | null;
  event: string;
  status: string | null;
  conclusion: string | null;
  html_url: string;
  head_branch?: string | null;
  head_sha: string;
  created_at: string;
  updated_at: string;
  run_number: number;
  workflow_id: number;
}) {
  return {
    id: run.id,
    runNumber: run.run_number,
    workflowId: run.workflow_id,
    name: run.display_title ?? run.name ?? "Workflow",
    event: run.event,
    status: run.status ?? "unknown",
    conclusion: run.conclusion,
    url: run.html_url,
    headBranch: run.head_branch ?? "",
    headSha: run.head_sha.slice(0, 7),
    createdAt: run.created_at,
    updatedAt: run.updated_at,
  };
}

export const listWorkflowRuns = action({
  args: {
    projectId: v.id("projects"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { octokit, owner, repo } = await requireProjectGitHubAccess(
      ctx,
      args.projectId,
    );
    const perPage = Math.min(Math.max(args.limit ?? 25, 1), 50);

    try {
      const { data } = await octokit.rest.actions.listWorkflowRunsForRepo({
        owner,
        repo,
        per_page: perPage,
      });

      return data.workflow_runs.map(mapWorkflowRun);
    } catch (error) {
      if (error instanceof Error && !(error instanceof RequestError)) {
        throw error;
      }
      throwGitHubError(error, "Failed to load GitHub Actions runs");
    }
  },
});
