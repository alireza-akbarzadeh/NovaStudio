"use node";

import { v } from "convex/values";

import { action } from "./_generated/server";
import { formatGitHubApiError } from "./lib/github";
import { requireProjectGitHubAccess } from "./lib/githubProjectAccess";

export type GitHubBlameLine = {
  line: number;
  authorName: string;
  authorLogin: string | null;
  committedDate: string;
  shortSha: string;
  message: string;
  url: string;
};

type BlameGraphqlRange = {
  startingLine: number;
  endingLine: number;
  commit: {
    oid: string;
    abbreviatedOid: string;
    committedDate: string;
    message: string;
    author: {
      name: string;
      user: { login: string; avatarUrl: string } | null;
    };
  };
};

type BlameGraphqlResponse = {
  repository: {
    object: {
      blame: {
        ranges: BlameGraphqlRange[];
      };
    } | null;
  } | null;
};

export const getFileBlame = action({
  args: {
    projectId: v.id("projects"),
    path: v.string(),
  },
  handler: async (ctx, args): Promise<{
    path: string;
    branch: string;
    lines: GitHubBlameLine[];
  }> => {
    const path = args.path.trim().replace(/^\/+/, "");
    if (!path) {
      throw new Error("File path is required");
    }

    const { octokit, owner, repo, project } = await requireProjectGitHubAccess(
      ctx,
      args.projectId,
    );

    const branch = project.githubBranch?.trim() || "main";

    try {
      const data = (await octokit.graphql(
        `
        query ($owner: String!, $repo: String!, $expression: String!, $path: String!) {
          repository(owner: $owner, name: $repo) {
            object(expression: $expression) {
              ... on Commit {
                blame(path: $path) {
                  ranges {
                    startingLine
                    endingLine
                    commit {
                      oid
                      abbreviatedOid
                      committedDate
                      message
                      author {
                        name
                        user { login avatarUrl }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      `,
        {
          owner,
          repo,
          expression: branch,
          path,
        },
      )) as BlameGraphqlResponse;

      const ranges = data.repository?.object?.blame?.ranges ?? [];
      const lines: GitHubBlameLine[] = [];

      for (const range of ranges) {
        const commit = range.commit;
        const authorLogin = commit.author.user?.login ?? null;
        const authorName = authorLogin ?? commit.author.name ?? "Unknown";
        const message = commit.message.split("\n")[0] ?? commit.message;
        const url = `https://github.com/${owner}/${repo}/commit/${commit.oid}`;

        for (let line = range.startingLine; line <= range.endingLine; line++) {
          lines.push({
            line,
            authorName,
            authorLogin,
            committedDate: commit.committedDate,
            shortSha: commit.abbreviatedOid,
            message,
            url,
          });
        }
      }

      lines.sort((a, b) => a.line - b.line);
      return { path, branch, lines };
    } catch (error) {
      const formatted = formatGitHubApiError(error);
      throw new Error(formatted ?? "Failed to load Git blame");
    }
  },
});
