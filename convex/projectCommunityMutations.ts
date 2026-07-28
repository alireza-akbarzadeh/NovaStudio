import { v } from "convex/values";
import { internalMutation } from "./_generated/server";
import {
  buildPath,
  touchProject,
} from "./lib/projectFiles";
import {
  hashContent,
  readFileContent,
  upsertFileContent,
} from "./lib/projectFileContents";
import type { Id } from "./_generated/dataModel";

/** Import or refresh a repo doc from GitHub with synced = clean state. */
export const upsertSyncedProjectDoc = internalMutation({
  args: {
    projectId: v.id("projects"),
    path: v.string(),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const normalized = args.path
      .trim()
      .replace(/^\/+/, "")
      .replace(/\/+/g, "/");
    if (!normalized || normalized.includes("..")) {
      throw new Error("Invalid file path");
    }

    const segments = normalized.split("/").filter(Boolean);
    const fileName = segments[segments.length - 1]!;
    let parentId: Id<"projectFiles"> | undefined;
    let parentPath: string | undefined;

    for (let i = 0; i < segments.length - 1; i += 1) {
      const folderName = segments[i]!;
      const folderPath = buildPath(parentPath, folderName);
      const existing = await ctx.db
        .query("projectFiles")
        .withIndex("by_project_path", (q) =>
          q.eq("projectId", args.projectId).eq("path", folderPath),
        )
        .unique();

      if (existing) {
        parentId = existing._id;
        parentPath = existing.path;
        continue;
      }

      const now = Date.now();
      parentId = await ctx.db.insert("projectFiles", {
        projectId: args.projectId,
        name: folderName,
        parentId,
        kind: "folder",
        path: folderPath,
        updatedAt: now,
      });
      parentPath = folderPath;
    }

    const filePath = buildPath(parentPath, fileName);
    const contentHash = hashContent(args.content);
    const now = Date.now();
    const existingFile = await ctx.db
      .query("projectFiles")
      .withIndex("by_project_path", (q) =>
        q.eq("projectId", args.projectId).eq("path", filePath),
      )
      .unique();

    await upsertFileContent(ctx, {
      projectId: args.projectId,
      path: filePath,
      content: args.content,
      syncedContent: args.content,
    });

    if (existingFile) {
      await ctx.db.patch(existingFile._id, {
        content: undefined,
        syncedContent: undefined,
        contentHash,
        syncedContentHash: contentHash,
        staged: false,
        updatedAt: now,
      });
      await touchProject(ctx, args.projectId);
      return { path: filePath, created: false };
    }

    await ctx.db.insert("projectFiles", {
      projectId: args.projectId,
      name: fileName,
      parentId,
      kind: "file",
      contentHash,
      syncedContentHash: contentHash,
      staged: false,
      path: filePath,
      updatedAt: now,
    });
    await touchProject(ctx, args.projectId);
    return { path: filePath, created: true };
  },
});
