import { v } from "convex/values";

import { mutation, query } from "./_generated/server";
import type { Id, Doc } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";
import {
  buildPath,
  ensureFolderSegments,
  normalizeRelativePath,
  touchProject,
  verifyProjectAccess,
  verifyProjectWriteAccess,
} from "./lib/projectFiles";

const MAX_STASH_FILES = 200;
const MAX_STASH_BYTES = 700_000;

type ProjectFileDoc = Doc<"projectFiles">;

function isChangedFile(file: ProjectFileDoc): boolean {
  if (file.kind !== "file") return false;
  if (file.syncedContent !== undefined) {
    return (file.content ?? "") !== file.syncedContent;
  }
  return true;
}

function fileSizeBytes(value: string) {
  return new TextEncoder().encode(value).byteLength;
}

function normalizeStashName(name: string | undefined, fallbackIndex: number) {
  const trimmed = name?.trim();
  if (trimmed) return trimmed;
  return `WIP #${fallbackIndex}`;
}

async function writeStashedFile(
  ctx: MutationCtx,
  args: {
    projectId: Id<"projects">;
    path: string;
    content: string;
    syncedContent?: string;
    staged: boolean;
  },
) {
  const normalized = normalizeRelativePath(args.path);
  const segments = normalized.split("/").filter(Boolean);
  const fileName = segments[segments.length - 1]!;
  const folderSegments = segments.slice(0, -1);

  const ensured = await ensureFolderSegments(
    ctx,
    args.projectId,
    undefined,
    undefined,
    folderSegments,
  );
  const parentId = ensured.parentId;
  const parentPath = ensured.parentPath;
  const filePath = buildPath(parentPath, fileName);

  const existing = await ctx.db
    .query("projectFiles")
    .withIndex("by_project_path", (q) =>
      q.eq("projectId", args.projectId).eq("path", filePath),
    )
    .unique();

  const now = Date.now();
  if (existing) {
    if (existing.kind !== "file") {
      throw new Error(`Path conflict: ${filePath} is a folder`);
    }
    await ctx.db.patch(existing._id, {
      content: args.content,
      syncedContent: args.syncedContent,
      staged: args.staged,
      updatedAt: now,
    });
    return;
  }

  await ctx.db.insert("projectFiles", {
    projectId: args.projectId,
    name: fileName,
    parentId,
    kind: "file",
    content: args.content,
    syncedContent: args.syncedContent,
    staged: args.staged,
    path: filePath,
    updatedAt: now,
  });
}

export const listByProject = query({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    await verifyProjectAccess(ctx, args.projectId);
    return await ctx.db
      .query("projectStashes")
      .withIndex("by_project_created", (q) => q.eq("projectId", args.projectId))
      .order("desc")
      .take(50);
  },
});

export const create = mutation({
  args: {
    projectId: v.id("projects"),
    name: v.optional(v.string()),
    onlyStaged: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { userId } = await verifyProjectWriteAccess(ctx, args.projectId);
    const files = await ctx.db
      .query("projectFiles")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    const changedFiles = files
      .filter((file) => isChangedFile(file))
      .filter((file) => (args.onlyStaged ? file.staged === true : true));

    if (changedFiles.length === 0) {
      throw new Error(
        args.onlyStaged
          ? "No staged files to stash"
          : "No changed files to stash",
      );
    }
    if (changedFiles.length > MAX_STASH_FILES) {
      throw new Error(
        `Too many files to stash (${changedFiles.length}). Max ${MAX_STASH_FILES}.`,
      );
    }

    let totalBytes = 0;
    for (const file of changedFiles) {
      totalBytes += fileSizeBytes(file.path);
      totalBytes += fileSizeBytes(file.content ?? "");
      totalBytes += fileSizeBytes(file.syncedContent ?? "");
    }
    if (totalBytes > MAX_STASH_BYTES) {
      throw new Error(
        "Stash is too large. Please stash fewer files (about 700KB max).",
      );
    }

    const stashCount = await ctx.db
      .query("projectStashes")
      .withIndex("by_project_created", (q) => q.eq("projectId", args.projectId))
      .take(1000);

    const now = Date.now();
    const stashId = await ctx.db.insert("projectStashes", {
      projectId: args.projectId,
      name: normalizeStashName(args.name, stashCount.length + 1),
      createdBy: userId,
      createdAt: now,
      fileCount: changedFiles.length,
      files: changedFiles.map((file) => ({
        path: file.path,
        content: file.content ?? "",
        syncedContent: file.syncedContent,
        staged: file.staged === true,
      })),
    });

    return stashId;
  },
});

export const apply = mutation({
  args: {
    projectId: v.id("projects"),
    stashId: v.id("projectStashes"),
    deleteAfterApply: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await verifyProjectWriteAccess(ctx, args.projectId);
    const stash = await ctx.db.get("projectStashes", args.stashId);
    if (!stash || stash.projectId !== args.projectId) {
      throw new Error("Stash not found");
    }

    for (const file of stash.files) {
      await writeStashedFile(ctx, {
        projectId: args.projectId,
        path: file.path,
        content: file.content,
        syncedContent: file.syncedContent,
        staged: file.staged,
      });
    }

    if (args.deleteAfterApply ?? true) {
      await ctx.db.delete(stash._id);
    }
    await touchProject(ctx, args.projectId);
    return { restoredFiles: stash.fileCount };
  },
});

export const remove = mutation({
  args: {
    projectId: v.id("projects"),
    stashId: v.id("projectStashes"),
  },
  handler: async (ctx, args) => {
    await verifyProjectWriteAccess(ctx, args.projectId);
    const stash = await ctx.db.get("projectStashes", args.stashId);
    if (!stash || stash.projectId !== args.projectId) {
      throw new Error("Stash not found");
    }
    await ctx.db.delete(stash._id);
  },
});
