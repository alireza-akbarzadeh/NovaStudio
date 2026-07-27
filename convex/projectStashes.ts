import { v } from "convex/values";

import { mutation, query } from "./_generated/server";
import type { Id, Doc } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";
import {
  deleteFileContent,
  hashContent,
  readFileContent,
  upsertFileContent,
} from "./lib/projectFileContents";
import {
  buildPath,
  ensureFolderSegments,
  isProjectFileChanged,
  normalizeRelativePath,
  touchProject,
  verifyProjectAccess,
  verifyProjectWriteAccess,
} from "./lib/projectFiles";

const MAX_STASH_FILES = 200;
const MAX_STASH_BYTES = 700_000;

type ProjectFileDoc = Doc<"projectFiles">;
type ProjectDoc = Doc<"projects">;

type StashFileSnapshot = {
  path: string;
  content: string;
  syncedContent?: string;
  staged: boolean;
};

function fileSizeBytes(value: string) {
  return new TextEncoder().encode(value).byteLength;
}

function normalizeStashName(name: string | undefined, fallbackIndex: number) {
  const trimmed = name?.trim();
  if (trimmed) return trimmed;
  return `WIP #${fallbackIndex}`;
}

async function loadChangedFileSnapshots(
  ctx: MutationCtx,
  project: ProjectDoc,
  onlyStaged: boolean,
): Promise<StashFileSnapshot[]> {
  const files = await ctx.db
    .query("projectFiles")
    .withIndex("by_project", (q) => q.eq("projectId", project._id))
    .collect();

  const snapshots: StashFileSnapshot[] = [];

  for (const file of files) {
    if (file.kind !== "file") continue;
    if (!isProjectFileChanged(file, project.syncedAt)) continue;
    if (onlyStaged && file.staged !== true) continue;

    const body = await readFileContent(ctx, project._id, file.path, file);
    snapshots.push({
      path: file.path,
      content: body.content,
      syncedContent: body.syncedContent,
      staged: file.staged === true,
    });
  }

  return snapshots;
}

/** Revert a changed file to its last synced baseline (JetBrains-style after stash). */
async function revertFileToBaseline(
  ctx: MutationCtx,
  project: ProjectDoc,
  file: ProjectFileDoc,
) {
  const body = await readFileContent(ctx, project._id, file.path, file);
  const hasBaseline =
    body.syncedContent !== undefined || file.syncedContentHash !== undefined;

  if (!hasBaseline) {
    if (file._creationTime > (project.syncedAt ?? 0)) {
      await deleteFileContent(ctx, project._id, file.path);
      await ctx.db.delete(file._id);
      return;
    }
    throw new Error(
      `Cannot stash "${file.path}" — no sync baseline. Push once to create one.`,
    );
  }

  const baseline = body.syncedContent ?? "";
  await upsertFileContent(ctx, {
    projectId: project._id,
    path: file.path,
    content: baseline,
    syncedContent: baseline,
  });
  const baselineHash = hashContent(baseline);
  await ctx.db.patch(file._id, {
    content: undefined,
    syncedContent: undefined,
    contentHash: baselineHash,
    syncedContentHash: baselineHash,
    staged: false,
    updatedAt: project.syncedAt ?? Date.now(),
  });
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
  const contentHash = hashContent(args.content);
  const syncedContentHash =
    args.syncedContent !== undefined
      ? hashContent(args.syncedContent)
      : undefined;
  const stillChanged =
    args.syncedContent === undefined || args.content !== args.syncedContent;

  await upsertFileContent(ctx, {
    projectId: args.projectId,
    path: filePath,
    content: args.content,
    syncedContent: args.syncedContent,
  });

  if (existing) {
    if (existing.kind !== "file") {
      throw new Error(`Path conflict: ${filePath} is a folder`);
    }
    await ctx.db.patch(existing._id, {
      content: undefined,
      syncedContent: undefined,
      contentHash,
      syncedContentHash,
      staged: stillChanged ? args.staged : false,
      updatedAt: now,
    });
    return;
  }

  await ctx.db.insert("projectFiles", {
    projectId: args.projectId,
    name: fileName,
    parentId,
    kind: "file",
    content: undefined,
    syncedContent: undefined,
    contentHash,
    syncedContentHash,
    staged: stillChanged ? args.staged : false,
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
    const { userId, project } = await verifyProjectWriteAccess(
      ctx,
      args.projectId,
    );
    const onlyStaged = args.onlyStaged === true;

    const snapshots = await loadChangedFileSnapshots(ctx, project, onlyStaged);

    if (snapshots.length === 0) {
      throw new Error(
        onlyStaged ? "No staged files to stash" : "No changed files to stash",
      );
    }
    if (snapshots.length > MAX_STASH_FILES) {
      throw new Error(
        `Too many files to stash (${snapshots.length}). Max ${MAX_STASH_FILES}.`,
      );
    }

    let totalBytes = 0;
    for (const file of snapshots) {
      totalBytes += fileSizeBytes(file.path);
      totalBytes += fileSizeBytes(file.content);
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
      fileCount: snapshots.length,
      files: snapshots,
    });

    const filesByPath = new Map(
      (
        await ctx.db
          .query("projectFiles")
          .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
          .collect()
      )
        .filter((file) => file.kind === "file")
        .map((file) => [file.path, file] as const),
    );

    for (const snapshot of snapshots) {
      const file = filesByPath.get(snapshot.path);
      if (!file) continue;
      await revertFileToBaseline(ctx, project, file);
    }

    await touchProject(ctx, args.projectId);
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
