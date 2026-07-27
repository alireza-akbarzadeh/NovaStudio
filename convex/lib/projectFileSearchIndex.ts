import type { Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";

const MAX_INDEX_LINES = 400;
const MAX_LINE_TEXT = 1000;

export async function deleteSearchLinesForPath(
  ctx: MutationCtx,
  projectId: Id<"projects">,
  path: string,
) {
  const rows = await ctx.db
    .query("projectFileSearchLines")
    .withIndex("by_project_path", (q) =>
      q.eq("projectId", projectId).eq("path", path),
    )
    .collect();

  for (const row of rows) {
    await ctx.db.delete(row._id);
  }
}

export async function syncSearchLinesForFile(
  ctx: MutationCtx,
  projectId: Id<"projects">,
  path: string,
  content: string,
) {
  await deleteSearchLinesForPath(ctx, projectId, path);

  const lines = content.split("\n").slice(0, MAX_INDEX_LINES);
  const now = Date.now();

  for (let i = 0; i < lines.length; i++) {
    const lineText = lines[i]?.slice(0, MAX_LINE_TEXT) ?? "";
    if (!lineText.trim()) continue;

    await ctx.db.insert("projectFileSearchLines", {
      projectId,
      path,
      line: i + 1,
      lineText,
      updatedAt: now,
    });
  }
}

export async function renameSearchLinesPath(
  ctx: MutationCtx,
  projectId: Id<"projects">,
  oldPath: string,
  newPath: string,
) {
  const rows = await ctx.db
    .query("projectFileSearchLines")
    .withIndex("by_project_path", (q) =>
      q.eq("projectId", projectId).eq("path", oldPath),
    )
    .collect();

  for (const row of rows) {
    await ctx.db.patch(row._id, { path: newPath, updatedAt: Date.now() });
  }
}

/** Delete up to `limit` search index rows for a project. Returns 1 if more remain. */
export async function deleteProjectSearchLinesBatch(
  ctx: MutationCtx,
  projectId: Id<"projects">,
  limit: number,
): Promise<number> {
  const rows = await ctx.db
    .query("projectFileSearchLines")
    .withIndex("by_project_path", (q) => q.eq("projectId", projectId))
    .take(limit);

  for (const row of rows) {
    await ctx.db.delete(row._id);
  }

  return rows.length > 0 ? 1 : 0;
}
