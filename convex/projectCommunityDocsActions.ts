"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import { createOctokit, getClerkGitHubToken, parseRepoUrl } from "./lib/github";
import {
  ALL_PROJECT_DOC_PATHS,
  PROJECT_DOC_SLOTS,
} from "./lib/projectDocPaths";

function decodeGitHubContent(raw: string, encoding?: string) {
  if (encoding === "base64") {
    return Buffer.from(raw.replace(/\n/g, ""), "base64").toString("utf-8");
  }
  return raw;
}

export const syncProjectDocsFromGitHub = action({
  args: { projectId: v.id("projects") },
  handler: async (
    ctx,
    args,
  ): Promise<{ imported: string[]; missing: string[]; branch: string }> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const context = await ctx.runQuery(internal.githubPushMutations.getPushContext, {
      projectId: args.projectId,
    });
    if (!context) throw new Error("Project not found");

    const { project } = context;
    if (project.ownerId !== identity.subject) {
      throw new Error("Only the project owner can sync docs from GitHub");
    }
    if (!project.githubRepoUrl) {
      throw new Error("This project is not linked to a GitHub repository");
    }

    const token = await getClerkGitHubToken(identity.subject);
    if (!token) throw new Error("GitHub is not connected");

    const { owner, repo } = parseRepoUrl(project.githubRepoUrl);
    const branch = project.githubBranch?.trim() || "main";
    const octokit = createOctokit(token);

    const imported: string[] = [];
    const missing: string[] = [];

    for (const slot of PROJECT_DOC_SLOTS) {
      let found = false;
      for (const path of slot.paths) {
        try {
          const { data } = await octokit.rest.repos.getContent({
            owner,
            repo,
            path,
            ref: branch,
          });
          if (Array.isArray(data) || data.type !== "file") continue;

          const content = decodeGitHubContent(data.content ?? "", data.encoding);
          await ctx.runMutation(internal.projectCommunityMutations.upsertSyncedProjectDoc, {
            projectId: args.projectId,
            path,
            content,
          });
          imported.push(path);
          found = true;
          break;
        } catch (error) {
          const status =
            error &&
            typeof error === "object" &&
            "status" in error &&
            typeof (error as { status?: number }).status === "number"
              ? (error as { status: number }).status
              : null;
          if (status !== 404) throw error;
        }
      }
      if (!found) missing.push(slot.defaultPath);
    }

    return { imported, missing, branch };
  },
});

export const fetchProjectDocFromGitHub = action({
  args: {
    projectId: v.id("projects"),
    path: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const filePath = args.path.trim().replace(/^\/+/, "");
    if (!ALL_PROJECT_DOC_PATHS.some((p) => p.toLowerCase() === filePath.toLowerCase())) {
      throw new Error("Unsupported documentation path");
    }

    const context = await ctx.runQuery(internal.githubPushMutations.getPushContext, {
      projectId: args.projectId,
    });
    if (!context) throw new Error("Project not found");

    const { project } = context;
    if (project.ownerId !== identity.subject) {
      throw new Error("Only the project owner can fetch docs from GitHub");
    }
    if (!project.githubRepoUrl) {
      throw new Error("This project is not linked to a GitHub repository");
    }

    const token = await getClerkGitHubToken(identity.subject);
    if (!token) throw new Error("GitHub is not connected");

    const { owner, repo } = parseRepoUrl(project.githubRepoUrl);
    const branch = project.githubBranch?.trim() || "main";
    const octokit = createOctokit(token);

    try {
      const { data } = await octokit.rest.repos.getContent({
        owner,
        repo,
        path: filePath,
        ref: branch,
      });
      if (Array.isArray(data) || data.type !== "file") {
        return { path: filePath, exists: false, content: "" };
      }
      const content = decodeGitHubContent(data.content ?? "", data.encoding);
      await ctx.runMutation(internal.projectCommunityMutations.upsertSyncedProjectDoc, {
        projectId: args.projectId,
        path: filePath,
        content,
      });
      return { path: filePath, exists: true, content };
    } catch (error) {
      const status =
        error &&
        typeof error === "object" &&
        "status" in error &&
        typeof (error as { status?: number }).status === "number"
          ? (error as { status: number }).status
          : null;
      if (status === 404) {
        return { path: filePath, exists: false, content: "" };
      }
      throw error;
    }
  },
});
