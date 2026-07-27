import type { Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";

export function hashContent(content: string): string {
  let h = 5381;
  for (let i = 0; i < content.length; i++) {
    h = ((h << 5) + h) ^ content.charCodeAt(i);
  }
  return `${content.length}:${(h >>> 0).toString(36)}`;
}

export function isFileDirtyByHash(
  contentHash: string | undefined,
  syncedContentHash: string | undefined,
): boolean {
  if (syncedContentHash === undefined) {
    return contentHash !== undefined;
  }
  return contentHash !== syncedContentHash;
}

export async function getFileContentRecord(
  ctx: QueryCtx | MutationCtx,
  projectId: Id<"projects">,
  path: string,
) {
  return await ctx.db
    .query("projectFileContents")
    .withIndex("by_project_path", (q) =>
      q.eq("projectId", projectId).eq("path", path),
    )
    .unique();
}

export async function readFileContent(
  ctx: QueryCtx | MutationCtx,
  projectId: Id<"projects">,
  path: string,
  legacy?: { content?: string; syncedContent?: string },
): Promise<{ content: string; syncedContent?: string }> {
  const row = await getFileContentRecord(ctx, projectId, path);
  if (row) {
    return {
      content: row.content,
      syncedContent: row.syncedContent,
    };
  }
  return {
    content: legacy?.content ?? "",
    syncedContent: legacy?.syncedContent,
  };
}

export async function upsertFileContent(
  ctx: MutationCtx,
  args: {
    projectId: Id<"projects">;
    path: string;
    content: string;
    syncedContent?: string;
  },
) {
  const existing = await getFileContentRecord(ctx, args.projectId, args.path);
  const now = Date.now();
  if (existing) {
    await ctx.db.patch(existing._id, {
      content: args.content,
      ...(args.syncedContent !== undefined
        ? { syncedContent: args.syncedContent }
        : {}),
      updatedAt: now,
    });
    return;
  }
  await ctx.db.insert("projectFileContents", {
    projectId: args.projectId,
    path: args.path,
    content: args.content,
    syncedContent: args.syncedContent,
    updatedAt: now,
  });
}

export async function deleteFileContent(
  ctx: MutationCtx,
  projectId: Id<"projects">,
  path: string,
) {
  const row = await getFileContentRecord(ctx, projectId, path);
  if (row) {
    await ctx.db.delete(row._id);
  }
}

export async function renameContentPath(
  ctx: MutationCtx,
  projectId: Id<"projects">,
  oldPath: string,
  newPath: string,
) {
  const row = await getFileContentRecord(ctx, projectId, oldPath);
  if (!row) return;
  const existingAtNew = await getFileContentRecord(ctx, projectId, newPath);
  if (existingAtNew) {
    await ctx.db.delete(existingAtNew._id);
  }
  await ctx.db.insert("projectFileContents", {
    projectId,
    path: newPath,
    content: row.content,
    syncedContent: row.syncedContent,
    updatedAt: Date.now(),
  });
  await ctx.db.delete(row._id);
}

export async function copyFileContent(
  ctx: MutationCtx,
  projectId: Id<"projects">,
  sourcePath: string,
  destPath: string,
  legacy?: { content?: string },
) {
  const body = await readFileContent(ctx, projectId, sourcePath, legacy);
  await upsertFileContent(ctx, {
    projectId,
    path: destPath,
    content: body.content,
    syncedContent: undefined,
  });
}

export async function deleteProjectContents(
  ctx: MutationCtx,
  projectId: Id<"projects">,
  limit: number,
): Promise<number> {
  const rows = await ctx.db
    .query("projectFileContents")
    .withIndex("by_project_path", (q) => q.eq("projectId", projectId))
    .take(limit);
  for (const row of rows) {
    await ctx.db.delete(row._id);
  }
  return rows.length > 0 ? 1 : 0;
}
