import type { Octokit } from "@octokit/rest";

import { internal } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import { createOctokit, getClerkGitHubToken, parseRepoUrl } from "./github";

type ProjectGitHubAccessContext = {
  auth: {
    getUserIdentity: () => Promise<{ subject: string } | null>;
  };
  runQuery: typeof internal.githubPushMutations.getPushContext extends never
    ? never
    : (
        query: typeof internal.githubPushMutations.getPushContext,
        args: { projectId: Id<"projects"> },
      ) => Promise<{
        project: {
          ownerId: string;
          githubRepoUrl?: string;
          githubBranch?: string;
        };
      } | null>;
};

export async function requireProjectGitHubAccess(
  ctx: ProjectGitHubAccessContext,
  projectId: Id<"projects">,
): Promise<{
  octokit: Octokit;
  owner: string;
  repo: string;
  project: {
    ownerId: string;
    githubRepoUrl?: string;
    githubBranch?: string;
  };
}> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Unauthorized");
  }

  const token = await getClerkGitHubToken(identity.subject);
  if (!token) {
    throw new Error("GitHub is not connected.");
  }

  const context = await ctx.runQuery(internal.githubPushMutations.getPushContext, {
    projectId,
  });

  if (!context) {
    throw new Error("Project not found");
  }

  const { project } = context;
  if (project.ownerId !== identity.subject) {
    throw new Error("Unauthorized access to this project");
  }
  if (!project.githubRepoUrl) {
    throw new Error("This project is not linked to a GitHub repository");
  }

  const { owner, repo } = parseRepoUrl(project.githubRepoUrl);
  return {
    octokit: createOctokit(token),
    owner,
    repo,
    project,
  };
}

export function mapGitHubComment(comment: {
  id: number;
  body?: string | null;
  user: { login: string; avatar_url: string } | null;
  created_at: string;
  html_url: string;
}) {
  return {
    id: comment.id,
    body: comment.body ?? "",
    authorLogin: comment.user?.login ?? "ghost",
    authorAvatarUrl: comment.user?.avatar_url ?? "",
    createdAt: comment.created_at,
    url: comment.html_url,
  };
}

export function mapGitHubLabel(label: { name: string; color: string }) {
  return {
    name: label.name,
    color: label.color,
  };
}