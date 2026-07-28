import { v } from "convex/values";

import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";
import { internalMutation, mutation, query } from "./_generated/server";
import { paginationOptsValidator } from "convex/server";
import {
  buildPath,
  deleteFolderRecursive,
  ensureFolderSegments,
  isProjectFileChanged,
  listSiblingNames,
  normalizeRelativePath,
  seedDefaultProjectFiles,
  suggestUniqueName,
  touchProject,
  updateDescendantPaths,
  verifyProjectAccess,
  verifyProjectWriteAccess,
} from "./lib/projectFiles";
import { identityDisplayName } from "./lib/projectAccess";
import { slotForPath } from "./lib/projectDocPaths";
import { notifyProjectFollowers } from "./lib/notifyProjectFollowers";
import { recordProjectActivity } from "./lib/recordActivity";
import {
  hashContent,
  readFileContent,
  upsertFileContent,
  deleteFileContent,
  copyFileContent,
} from "./lib/projectFileContents";

async function maybeNotifyProjectDocFollowers(
  ctx: MutationCtx,
  args: {
    projectId: Id<"projects">;
    path: string;
    excludeUserId: string;
  },
) {
  const project = await ctx.db.get("projects", args.projectId);
  if (!project || project.visibility !== "public") return;

  const slot = slotForPath(args.path);
  if (!slot) return;

  await notifyProjectFollowers(ctx, {
    projectId: args.projectId,
    excludeUserId: args.excludeUserId,
    title: `${project.name} updated ${slot.label}`,
    body: `Documentation was updated on ${project.name}.`,
    href: `/projects/community/${args.projectId}`,
    tone: "blue",
  });
}

/** Avoid flooding the timeline while autosave fires every ~800ms. */
const EDIT_ACTIVITY_COOLDOWN_MS = 2 * 60 * 1000;

/** Keep timeline snapshots well under Convex's 1MB document limit. */
const SNAPSHOT_CONTENT_CAP = 200_000;

function fileBasename(path: string) {
  const slash = path.lastIndexOf("/");
  return slash >= 0 ? path.slice(slash + 1) : path;
}

function truncateSnapshotContent(value: string) {
  if (value.length <= SNAPSHOT_CONTENT_CAP) return value;
  return `${value.slice(0, SNAPSHOT_CONTENT_CAP)}\n\n/* …truncated for activity timeline */\n`;
}

async function maybeRecordFileEditActivity(
  ctx: MutationCtx,
  args: {
    projectId: Id<"projects">;
    path: string;
    userId: string;
    actorName?: string;
    beforeContent: string;
    afterContent: string;
  },
) {
  if (args.beforeContent === args.afterContent) return;

  const recent = await ctx.db
    .query("projectActivity")
    .withIndex("by_project_created", (q) =>
      q.eq("projectId", args.projectId),
    )
    .order("desc")
    .take(12);

  const now = Date.now();
  const duplicate = recent.some(
    (row) =>
      row.actorUserId === args.userId &&
      row.type === "updated" &&
      row.detail === args.path &&
      now - row.createdAt < EDIT_ACTIVITY_COOLDOWN_MS,
  );
  if (duplicate) return;

  const name = args.actorName?.trim() || "Someone";
  const activityId = await recordProjectActivity(ctx, {
    projectId: args.projectId,
    actorUserId: args.userId,
    actorName: args.actorName,
    type: "updated",
    title: `${name} edited ${fileBasename(args.path)}`,
    detail: args.path,
    hasSnapshot: true,
  });

  await ctx.db.insert("projectActivitySnapshots", {
    activityId,
    projectId: args.projectId,
    path: args.path,
    beforeContent: truncateSnapshotContent(args.beforeContent),
    afterContent: truncateSnapshotContent(args.afterContent),
  });
}

export const listByProject = query({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    await verifyProjectAccess(ctx, args.projectId);
    const rows = await ctx.db
      .query("projectFiles")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    return rows.map((file) => ({
      _id: file._id,
      _creationTime: file._creationTime,
      projectId: file.projectId,
      name: file.name,
      parentId: file.parentId,
      kind: file.kind,
      path: file.path,
      updatedAt: file.updatedAt,
      staged: file.staged,
      contentHash: file.contentHash,
      syncedContentHash: file.syncedContentHash,
    }));
  },
});

/** Paginated file bodies for WebContainer mount / export. */
export const listFileContentsPage = query({
  args: {
    projectId: v.id("projects"),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    await verifyProjectAccess(ctx, args.projectId);
    return await ctx.db
      .query("projectFileContents")
      .withIndex("by_project_path", (q) => q.eq("projectId", args.projectId))
      .paginate(args.paginationOpts);
  },
});

/** Move inline file bodies off projectFiles (legacy → split table). */
export const migrateInlineContentBatch = internalMutation({
  args: {
    projectId: v.id("projects"),
    limit: v.number(),
  },
  handler: async (ctx, args) => {
    let migrated = 0;
    let hasMore = false;

    for await (const file of ctx.db
      .query("projectFiles")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))) {
      if (file.kind !== "file") continue;
      if (file.content === undefined && file.syncedContent === undefined) {
        continue;
      }

      const content = file.content ?? "";
      await upsertFileContent(ctx, {
        projectId: args.projectId,
        path: file.path,
        content,
        syncedContent: file.syncedContent,
      });

      await ctx.db.patch(file._id, {
        content: undefined,
        syncedContent: undefined,
        contentHash: hashContent(content),
        syncedContentHash:
          file.syncedContent !== undefined
            ? hashContent(file.syncedContent)
            : undefined,
      });

      migrated += 1;
      if (migrated >= args.limit) {
        hasMore = true;
        break;
      }
    }

    if (hasMore) {
      await ctx.scheduler.runAfter(0, internal.projectFiles.migrateInlineContentBatch, {
        projectId: args.projectId,
        limit: args.limit,
      });
    } else {
      await ctx.db.patch(args.projectId, {
        fileContentSplit: true,
        updatedAt: Date.now(),
      });
      await ctx.scheduler.runAfter(
        0,
        internal.projectSearch.scheduleSearchIndexBackfill,
        {
          projectId: args.projectId,
        },
      );
    }

    return { migrated, hasMore };
  },
});

export const startContentMigration = mutation({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    await verifyProjectAccess(ctx, args.projectId);
    await ctx.scheduler.runAfter(0, internal.projectFiles.migrateInlineContentBatch, {
      projectId: args.projectId,
      limit: 40,
    });
  },
});

/** Max chars of file content sent to commit-message generation. */
const STAGED_COMMIT_CONTENT_CAP = 4096;

function truncateForCommitContext(value: string | undefined): string {
  if (!value) {
    return "";
  }
  if (value.length <= STAGED_COMMIT_CONTENT_CAP) {
    return value;
  }
  return `${value.slice(0, STAGED_COMMIT_CONTENT_CAP)}\n…[truncated]`;
}

export const listChangedFiles = query({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const project = await verifyProjectAccess(ctx, args.projectId);
    if (project.fileContentSplit !== true) {
      return [];
    }
    if (!project.syncedAt) {
      return [];
    }

    const files = await ctx.db
      .query("projectFiles")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    return files
      .filter((file) => isProjectFileChanged(file, project.syncedAt))
      .map((file) => ({
        _id: file._id,
        path: file.path,
        name: file.name,
        updatedAt: file.updatedAt,
        staged: file.staged === true,
        isNew:
          file.syncedContentHash === undefined &&
          file.syncedContent === undefined &&
          file._creationTime > project.syncedAt!,
      }))
      .sort((a, b) => b.updatedAt - a.updatedAt);
  },
});

/** Truncated staged file contents for AI commit-message generation. */
export const listStagedCommitContext = query({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const project = await verifyProjectAccess(ctx, args.projectId);
    if (!project.syncedAt) {
      return [];
    }

    const files = await ctx.db
      .query("projectFiles")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    const staged = files.filter(
      (file) =>
        file.kind === "file" &&
        file.staged === true &&
        isProjectFileChanged(file, project.syncedAt),
    );

    const rows = [];
    for (const file of staged) {
      const body = await readFileContent(ctx, args.projectId, file.path, file);
      rows.push({
        path: file.path,
        isNew:
          file.syncedContentHash === undefined &&
          file.syncedContent === undefined &&
          file._creationTime > project.syncedAt!,
        content: truncateForCommitContext(body.content),
        syncedContent: truncateForCommitContext(body.syncedContent),
      });
    }

    return rows.sort((a, b) => a.path.localeCompare(b.path));
  },
});

/** All local changes (staged or not) — used as AI review fallback. */
export const listChangedCommitContext = query({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const project = await verifyProjectAccess(ctx, args.projectId);
    if (!project.syncedAt) {
      return [];
    }

    const files = await ctx.db
      .query("projectFiles")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    const changed = files.filter(
      (file) =>
        file.kind === "file" && isProjectFileChanged(file, project.syncedAt),
    );

    const rows = [];
    for (const file of changed) {
      const body = await readFileContent(ctx, args.projectId, file.path, file);
      rows.push({
        path: file.path,
        isNew:
          file.syncedContentHash === undefined &&
          file.syncedContent === undefined &&
          file._creationTime > project.syncedAt!,
        content: truncateForCommitContext(body.content),
        syncedContent: truncateForCommitContext(body.syncedContent),
      });
    }

    return rows.sort((a, b) => a.path.localeCompare(b.path));
  },
});

export const setFileStaged = mutation({
  args: {
    projectId: v.id("projects"),
    path: v.string(),
    staged: v.boolean(),
  },
  handler: async (ctx, args) => {
    const { project } = await verifyProjectWriteAccess(ctx, args.projectId);
    const file = await ctx.db
      .query("projectFiles")
      .withIndex("by_project_path", (q) =>
        q.eq("projectId", args.projectId).eq("path", args.path),
      )
      .unique();

    if (!file || file.kind !== "file") {
      throw new Error("File not found");
    }
    if (!isProjectFileChanged(file, project.syncedAt)) {
      throw new Error("File has no local changes to stage");
    }

    await ctx.db.patch(file._id, { staged: args.staged });
  },
});

export const setAllChangedStaged = mutation({
  args: {
    projectId: v.id("projects"),
    staged: v.boolean(),
  },
  handler: async (ctx, args) => {
    const { project } = await verifyProjectWriteAccess(ctx, args.projectId);
    const files = await ctx.db
      .query("projectFiles")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    for (const file of files) {
      if (isProjectFileChanged(file, project.syncedAt)) {
        await ctx.db.patch(file._id, { staged: args.staged });
      }
    }
  },
});

export const discardFileChanges = mutation({
  args: {
    projectId: v.id("projects"),
    path: v.string(),
  },
  handler: async (ctx, args) => {
    const { project } = await verifyProjectWriteAccess(ctx, args.projectId);
    const file = await ctx.db
      .query("projectFiles")
      .withIndex("by_project_path", (q) =>
        q.eq("projectId", args.projectId).eq("path", args.path),
      )
      .unique();

    if (!file || file.kind !== "file") {
      throw new Error("File not found");
    }
    if (!isProjectFileChanged(file, project.syncedAt)) {
      return;
    }

    const body = await readFileContent(ctx, args.projectId, args.path, file);
    const hasBaseline =
      body.syncedContent !== undefined || file.syncedContentHash !== undefined;

    // New unsynced file — discard by deleting.
    if (!hasBaseline) {
      if (file._creationTime > (project.syncedAt ?? 0)) {
        await deleteFileContent(ctx, args.projectId, args.path);
        await ctx.db.delete(file._id);
        await touchProject(ctx, args.projectId);
        return;
      }
      throw new Error(
        "Cannot discard this file yet. Push once (or re-import) to create a sync baseline.",
      );
    }

    const baseline = body.syncedContent ?? "";
    await upsertFileContent(ctx, {
      projectId: args.projectId,
      path: args.path,
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
    await touchProject(ctx, args.projectId);
  },
});

export const getByPath = query({
  args: {
    projectId: v.id("projects"),
    path: v.string(),
  },
  handler: async (ctx, args) => {
    await verifyProjectAccess(ctx, args.projectId);
    const file = await ctx.db
      .query("projectFiles")
      .withIndex("by_project_path", (q) =>
        q.eq("projectId", args.projectId).eq("path", args.path),
      )
      .unique();
    if (!file) return null;
    if (file.kind !== "file") return file;

    const body = await readFileContent(ctx, args.projectId, args.path, file);
    return {
      ...file,
      content: body.content,
      syncedContent: body.syncedContent,
    };
  },
});

/** Batch-read file bodies for editor definitions, AI mentions, etc. */
export const getContentsByPaths = query({
  args: {
    projectId: v.id("projects"),
    paths: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    await verifyProjectAccess(ctx, args.projectId);

    const uniquePaths = [...new Set(args.paths.filter(Boolean))].slice(0, 300);
    const rows: { path: string; content: string }[] = [];

    for (const path of uniquePaths) {
      const file = await ctx.db
        .query("projectFiles")
        .withIndex("by_project_path", (q) =>
          q.eq("projectId", args.projectId).eq("path", path),
        )
        .unique();
      if (!file || file.kind !== "file") continue;

      const body = await readFileContent(ctx, args.projectId, path, file);
      rows.push({ path, content: body.content ?? "" });
    }

    return rows;
  },
});

export const create = mutation({
  args: {
    projectId: v.id("projects"),
    name: v.string(),
    parentId: v.optional(v.id("projectFiles")),
    kind: v.union(v.literal("file"), v.literal("folder")),
    content: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await verifyProjectWriteAccess(ctx, args.projectId);

    const relative = normalizeRelativePath(args.name);
    const segments = relative.split("/");
    const leafName = segments[segments.length - 1]!;
    const folderSegments = segments.slice(0, -1);

    let parentId = args.parentId;
    let parentPath: string | undefined;
    const folderIds: Id<"projectFiles">[] = [];

    if (parentId) {
      const parent = await ctx.db.get("projectFiles", parentId);
      if (!parent || parent.projectId !== args.projectId) {
        throw new Error("Parent folder not found");
      }
      if (parent.kind !== "folder") {
        throw new Error("Parent must be a folder");
      }
      parentPath = parent.path;
      folderIds.push(parent._id);
    }

    if (folderSegments.length > 0) {
      const ensured = await ensureFolderSegments(
        ctx,
        args.projectId,
        parentId,
        parentPath,
        folderSegments,
      );
      parentId = ensured.parentId;
      parentPath = ensured.parentPath;
      folderIds.push(...ensured.folderIds);
    }

    const path = buildPath(parentPath, leafName);
    const existing = await ctx.db
      .query("projectFiles")
      .withIndex("by_project_path", (q) =>
        q.eq("projectId", args.projectId).eq("path", path),
      )
      .unique();
    if (existing) {
      throw new Error("A file or folder with this path already exists");
    }

    const now = Date.now();
    const content = args.kind === "file" ? (args.content ?? "") : undefined;
    const fileId = await ctx.db.insert("projectFiles", {
      projectId: args.projectId,
      name: leafName,
      parentId,
      kind: args.kind,
      ...(args.kind === "file"
        ? { contentHash: hashContent(content ?? "") }
        : {}),
      staged: args.kind === "file" ? false : undefined,
      path,
      updatedAt: now,
    });

    if (args.kind === "file") {
      await upsertFileContent(ctx, {
        projectId: args.projectId,
        path,
        content: content ?? "",
      });
    }

    if (args.kind === "folder") {
      folderIds.push(fileId);
    }

    await touchProject(ctx, args.projectId);
    return { id: fileId, path, folderIds };
  },
});

/**
 * Create or overwrite a file by full path (e.g. `src/components/Card.tsx`).
 * Creates missing parent folders automatically.
 */
export const writeFileAtPath = mutation({
  args: {
    projectId: v.id("projects"),
    path: v.string(),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const access = await verifyProjectWriteAccess(ctx, args.projectId);

    const normalized = args.path
      .trim()
      .replace(/^\/+/, "")
      .replace(/\/+/g, "/");
    if (!normalized || normalized.includes("..")) {
      throw new Error("Invalid file path");
    }

    const segments = normalized.split("/").filter(Boolean);
    if (segments.length === 0) {
      throw new Error("Invalid file path");
    }

    const fileName = segments[segments.length - 1]!;
    if (fileName.includes("/") || !fileName) {
      throw new Error("Invalid file name");
    }

    let parentId: Id<"projectFiles"> | undefined;
    let parentPath: string | undefined;

    for (let i = 0; i < segments.length - 1; i++) {
      const folderName = segments[i]!;
      const folderPath = buildPath(parentPath, folderName);
      const existing = await ctx.db
        .query("projectFiles")
        .withIndex("by_project_path", (q) =>
          q.eq("projectId", args.projectId).eq("path", folderPath),
        )
        .unique();

      if (existing) {
        if (existing.kind !== "folder") {
          throw new Error(`Path conflict: ${folderPath} is a file`);
        }
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
    const existingFile = await ctx.db
      .query("projectFiles")
      .withIndex("by_project_path", (q) =>
        q.eq("projectId", args.projectId).eq("path", filePath),
      )
      .unique();

    const now = Date.now();

    if (existingFile) {
      if (existingFile.kind !== "file") {
        throw new Error(`Path conflict: ${filePath} is a folder`);
      }
      const body = await readFileContent(
        ctx,
        args.projectId,
        filePath,
        existingFile,
      );
      const stillChanged =
        body.syncedContent === undefined ||
        args.content !== body.syncedContent;
      await upsertFileContent(ctx, {
        projectId: args.projectId,
        path: filePath,
        content: args.content,
        syncedContent: body.syncedContent,
      });
      await ctx.db.patch(existingFile._id, {
        content: undefined,
        syncedContent: undefined,
        contentHash: hashContent(args.content),
        updatedAt: now,
        staged: stillChanged ? existingFile.staged === true : false,
      });
      await touchProject(ctx, args.projectId);
      if (body.content !== args.content) {
        await maybeNotifyProjectDocFollowers(ctx, {
          projectId: args.projectId,
          path: filePath,
          excludeUserId: access.userId,
        });
      }
      return { path: filePath, created: false };
    }

    await upsertFileContent(ctx, {
      projectId: args.projectId,
      path: filePath,
      content: args.content,
    });
    await ctx.db.insert("projectFiles", {
      projectId: args.projectId,
      name: fileName,
      parentId,
      kind: "file",
      contentHash: hashContent(args.content),
      staged: false,
      path: filePath,
      updatedAt: now,
    });
    await touchProject(ctx, args.projectId);
    await maybeNotifyProjectDocFollowers(ctx, {
      projectId: args.projectId,
      path: filePath,
      excludeUserId: access.userId,
    });
    return { path: filePath, created: true };
  },
});

export const updateContent = mutation({
  args: {
    projectId: v.id("projects"),
    path: v.string(),
    content: v.string(),
    notifyFollowers: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const access = await verifyProjectWriteAccess(ctx, args.projectId);

    const file = await ctx.db
      .query("projectFiles")
      .withIndex("by_project_path", (q) =>
        q.eq("projectId", args.projectId).eq("path", args.path),
      )
      .unique();

    if (!file) {
      throw new Error("File not found");
    }
    if (file.kind !== "file") {
      throw new Error("Cannot update content of a folder");
    }

    const now = Date.now();
    const nextContent = args.content;
    const body = await readFileContent(ctx, args.projectId, args.path, file);
    const contentChanged = body.content !== nextContent;
    const stillChanged =
      body.syncedContent === undefined || nextContent !== body.syncedContent;

    await upsertFileContent(ctx, {
      projectId: args.projectId,
      path: args.path,
      content: nextContent,
      syncedContent: body.syncedContent,
    });
    await ctx.db.patch(file._id, {
      content: undefined,
      syncedContent: undefined,
      contentHash: hashContent(nextContent),
      updatedAt: now,
      staged: stillChanged ? file.staged === true : false,
    });
    await touchProject(ctx, args.projectId);

    if (contentChanged) {
      const identity = await ctx.auth.getUserIdentity();
      const member = await ctx.db
        .query("projectMembers")
        .withIndex("by_project_user", (q) =>
          q.eq("projectId", args.projectId).eq("userId", access.userId),
        )
        .unique();
      await maybeRecordFileEditActivity(ctx, {
        projectId: args.projectId,
        path: args.path,
        userId: access.userId,
        actorName:
          member?.name ??
          (identity ? identityDisplayName(identity) : undefined),
        beforeContent: body.content,
        afterContent: nextContent,
      });
      if (args.notifyFollowers) {
        await maybeNotifyProjectDocFollowers(ctx, {
          projectId: args.projectId,
          path: args.path,
          excludeUserId: access.userId,
        });
      }
    }
  },
});
export const rename = mutation({
  args: {
    projectId: v.id("projects"),
    path: v.string(),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    await verifyProjectWriteAccess(ctx, args.projectId);

    const name = args.name.trim();
    if (!name) {
      throw new Error("Name is required");
    }
    if (name.includes("/")) {
      throw new Error("Name cannot contain '/'");
    }

    const item = await ctx.db
      .query("projectFiles")
      .withIndex("by_project_path", (q) =>
        q.eq("projectId", args.projectId).eq("path", args.path),
      )
      .unique();

    if (!item) {
      throw new Error("File or folder not found");
    }

    const parentPath = item.path.includes("/")
      ? item.path.slice(0, item.path.lastIndexOf("/"))
      : undefined;
    const newPath = buildPath(parentPath, name);

    if (newPath !== item.path) {
      const conflict = await ctx.db
        .query("projectFiles")
        .withIndex("by_project_path", (q) =>
          q.eq("projectId", args.projectId).eq("path", newPath),
        )
        .unique();
      if (conflict) {
        throw new Error("A file or folder with this path already exists");
      }

      if (item.kind === "folder") {
        await updateDescendantPaths(ctx, args.projectId, item.path, newPath);
      }

      await ctx.db.patch(item._id, {
        name,
        path: newPath,
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.patch(item._id, {
        name,
        updatedAt: Date.now(),
      });
    }

    await touchProject(ctx, args.projectId);
    return newPath;
  },
});

export const remove = mutation({
  args: {
    projectId: v.id("projects"),
    path: v.string(),
  },
  handler: async (ctx, args) => {
    await verifyProjectWriteAccess(ctx, args.projectId);

    const item = await ctx.db
      .query("projectFiles")
      .withIndex("by_project_path", (q) =>
        q.eq("projectId", args.projectId).eq("path", args.path),
      )
      .unique();

    if (!item) {
      throw new Error("File or folder not found");
    }

    if (item.kind === "folder") {
      await deleteFolderRecursive(ctx, item._id, args.projectId);
    } else {
      await deleteFileContent(ctx, args.projectId, args.path);
    }

    await ctx.db.delete(item._id);
    await touchProject(ctx, args.projectId);
  },
});

export const move = mutation({
  args: {
    projectId: v.id("projects"),
    path: v.string(),
    newParentId: v.optional(v.id("projectFiles")),
  },
  handler: async (ctx, args) => {
    await verifyProjectWriteAccess(ctx, args.projectId);

    const item = await ctx.db
      .query("projectFiles")
      .withIndex("by_project_path", (q) =>
        q.eq("projectId", args.projectId).eq("path", args.path),
      )
      .unique();

    if (!item) {
      throw new Error("File or folder not found");
    }

    let parentPath: string | undefined;
    if (args.newParentId !== undefined) {
      const parent = await ctx.db.get("projectFiles", args.newParentId);
      if (!parent || parent.projectId !== args.projectId) {
        throw new Error("Destination folder not found");
      }
      if (parent.kind !== "folder") {
        throw new Error("Destination must be a folder");
      }
      if (parent._id === item._id) {
        throw new Error("Cannot move a folder into itself");
      }
      if (
        item.kind === "folder" &&
        (parent.path === item.path ||
          parent.path.startsWith(`${item.path}/`))
      ) {
        throw new Error("Cannot move a folder into itself or a descendant");
      }
      parentPath = parent.path;
    }

    const sameParent =
      (item.parentId ?? undefined) === (args.newParentId ?? undefined);
    if (sameParent) {
      return item.path;
    }

    const siblingNames = await listSiblingNames(
      ctx,
      args.projectId,
      args.newParentId,
      item._id,
    );
    const name = suggestUniqueName(siblingNames, item.name);
    const newPath = buildPath(parentPath, name);

    if (item.kind === "folder") {
      await updateDescendantPaths(ctx, args.projectId, item.path, newPath);
    }

    await ctx.db.patch(item._id, {
      ...(args.newParentId === undefined
        ? { parentId: undefined }
        : { parentId: args.newParentId }),
      name,
      path: newPath,
      updatedAt: Date.now(),
    });

    await touchProject(ctx, args.projectId);
    return newPath;
  },
});

export const duplicate = mutation({
  args: {
    projectId: v.id("projects"),
    path: v.string(),
    // undefined = same parent as source; null = project root; id = folder
    targetParentId: v.optional(
      v.union(v.id("projectFiles"), v.null()),
    ),
  },
  handler: async (ctx, args) => {
    await verifyProjectWriteAccess(ctx, args.projectId);

    const item = await ctx.db
      .query("projectFiles")
      .withIndex("by_project_path", (q) =>
        q.eq("projectId", args.projectId).eq("path", args.path),
      )
      .unique();

    if (!item) {
      throw new Error("File or folder not found");
    }

    const targetParentId =
      args.targetParentId === undefined
        ? item.parentId
        : args.targetParentId === null
          ? undefined
          : args.targetParentId;

    let parentPath: string | undefined;
    if (targetParentId !== undefined) {
      const parent = await ctx.db.get("projectFiles", targetParentId);
      if (!parent || parent.projectId !== args.projectId) {
        throw new Error("Destination folder not found");
      }
      if (parent.kind !== "folder") {
        throw new Error("Destination must be a folder");
      }
      if (
        item.kind === "folder" &&
        (parent.path === item.path ||
          parent.path.startsWith(`${item.path}/`))
      ) {
        throw new Error("Cannot duplicate a folder into itself or a descendant");
      }
      parentPath = parent.path;
    }

    const siblingNames = await listSiblingNames(
      ctx,
      args.projectId,
      targetParentId,
    );
    const name = suggestUniqueName(siblingNames, item.name);
    const newPath = buildPath(parentPath, name);

    const newId = await duplicateNodeRecursive(
      ctx,
      args.projectId,
      item._id,
      targetParentId,
      newPath,
      name,
    );

    await touchProject(ctx, args.projectId);
    return { id: newId, path: newPath };
  },
});

async function duplicateNodeRecursive(
  ctx: MutationCtx,
  projectId: Id<"projects">,
  sourceId: Id<"projectFiles">,
  parentId: Id<"projectFiles"> | undefined,
  path: string,
  name: string,
): Promise<Id<"projectFiles">> {
  const source = await ctx.db.get("projectFiles", sourceId);
  if (!source || source.projectId !== projectId) {
    throw new Error("File or folder not found");
  }

  const now = Date.now();
  const newId = await ctx.db.insert("projectFiles", {
    projectId,
    name,
    parentId,
    kind: source.kind,
    ...(source.kind === "file"
      ? { contentHash: source.contentHash ?? hashContent("") }
      : {}),
    staged: source.kind === "file" ? false : undefined,
    path,
    updatedAt: now,
  });

  if (source.kind === "file") {
    await copyFileContent(ctx, projectId, source.path, path, source);
  }

  if (source.kind === "folder") {
    const children = await ctx.db
      .query("projectFiles")
      .withIndex("by_project_parent", (q) =>
        q.eq("projectId", projectId).eq("parentId", sourceId),
      )
      .collect();

    for (const child of children) {
      const childPath = buildPath(path, child.name);
      await duplicateNodeRecursive(
        ctx,
        projectId,
        child._id,
        newId,
        childPath,
        child.name,
      );
    }
  }

  return newId;
}

export const seedDefaults = mutation({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    await verifyProjectWriteAccess(ctx, args.projectId);
    await seedDefaultProjectFiles(ctx, args.projectId);
  },
});
