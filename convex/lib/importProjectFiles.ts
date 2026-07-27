import type { Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";
import { buildFileTree, type GitHubImportFile } from "./github";
import { buildPath, ensureFolderSegments } from "./projectFiles";
import {
  deleteProjectContents,
  hashContent,
  upsertFileContent,
} from "./projectFileContents";

type TreeNode = {
  name: string;
  path: string;
  kind: "file" | "folder";
  content?: string;
  children: Map<string, TreeNode>;
};

async function insertTreeNode(
  ctx: MutationCtx,
  projectId: Id<"projects">,
  node: TreeNode,
  parentId?: Id<"projectFiles">,
) {
  const now = Date.now();
  const content = node.kind === "file" ? (node.content ?? "") : undefined;
  const fileId = await ctx.db.insert("projectFiles", {
    projectId,
    name: node.name,
    parentId,
    kind: node.kind,
    ...(node.kind === "file"
      ? {
          contentHash: hashContent(content ?? ""),
          syncedContentHash: hashContent(content ?? ""),
        }
      : {}),
    staged: false,
    path: node.path,
    updatedAt: now,
  });

  if (node.kind === "file" && content !== undefined) {
    await upsertFileContent(ctx, {
      projectId,
      path: node.path,
      content,
      syncedContent: content,
    });
  }

  if (node.kind === "folder") {
    for (const child of node.children.values()) {
      await insertTreeNode(ctx, projectId, child, fileId);
    }
  }
}

export async function insertImportedFiles(
  ctx: MutationCtx,
  projectId: Id<"projects">,
  files: GitHubImportFile[],
) {
  const tree = buildFileTree(files);
  for (const child of tree.children.values()) {
    await insertTreeNode(ctx, projectId, child);
  }
}

/** Insert a flat batch of files, creating parent folders as needed. */
export async function insertImportedFileBatch(
  ctx: MutationCtx,
  projectId: Id<"projects">,
  files: GitHubImportFile[],
) {
  const now = Date.now();

  for (const file of files) {
    const normalized = file.path
      .trim()
      .replace(/^\/+/, "")
      .replace(/\/+/g, "/");
    if (!normalized || normalized.includes("..")) {
      continue;
    }

    const segments = normalized.split("/").filter(Boolean);
    if (segments.length === 0) continue;

    const fileName = segments[segments.length - 1]!;
    const folderSegments = segments.slice(0, -1);
    const ensured = await ensureFolderSegments(
      ctx,
      projectId,
      undefined,
      undefined,
      folderSegments,
    );
    const path = buildPath(ensured.parentPath, fileName);
    const contentHash = hashContent(file.content);

    const existing = await ctx.db
      .query("projectFiles")
      .withIndex("by_project_path", (q) =>
        q.eq("projectId", projectId).eq("path", path),
      )
      .unique();

    if (existing) {
      if (existing.kind !== "file") continue;
      await upsertFileContent(ctx, {
        projectId,
        path,
        content: file.content,
        syncedContent: file.content,
      });
      await ctx.db.patch(existing._id, {
        content: undefined,
        syncedContent: undefined,
        contentHash,
        syncedContentHash: contentHash,
        staged: false,
        updatedAt: now,
      });
      continue;
    }

    await upsertFileContent(ctx, {
      projectId,
      path,
      content: file.content,
      syncedContent: file.content,
    });
    await ctx.db.insert("projectFiles", {
      projectId,
      name: fileName,
      parentId: ensured.parentId,
      kind: "file",
      contentHash,
      syncedContentHash: contentHash,
      staged: false,
      path,
      updatedAt: now,
    });
  }
}

export async function deleteAllProjectFiles(
  ctx: MutationCtx,
  projectId: Id<"projects">,
) {
  for (;;) {
    const remaining = await deleteProjectContents(ctx, projectId, 200);
    if (remaining === 0) break;
  }

  const files = await ctx.db
    .query("projectFiles")
    .withIndex("by_project", (q) => q.eq("projectId", projectId))
    .collect();

  const folders = files.filter((file) => file.kind === "folder");
  const leafFiles = files.filter((file) => file.kind === "file");

  for (const file of leafFiles) {
    await ctx.db.delete(file._id);
  }

  folders.sort((a, b) => b.path.length - a.path.length);
  for (const folder of folders) {
    await ctx.db.delete(folder._id);
  }
}

/** Delete up to `limit` project files; returns 1 if more remain, else 0. */
export async function deleteProjectFilesBatch(
  ctx: MutationCtx,
  projectId: Id<"projects">,
  limit: number,
): Promise<number> {
  await deleteProjectContents(ctx, projectId, limit);

  const files = await ctx.db
    .query("projectFiles")
    .withIndex("by_project", (q) => q.eq("projectId", projectId))
    .take(limit);

  for (const file of files) {
    await ctx.db.delete(file._id);
  }

  const remaining = await ctx.db
    .query("projectFiles")
    .withIndex("by_project", (q) => q.eq("projectId", projectId))
    .take(1);
  return remaining.length > 0 ? 1 : 0;
}

export async function replaceProjectFilesFromImport(
  ctx: MutationCtx,
  args: {
    projectId: Id<"projects">;
    files: GitHubImportFile[];
    commitSha: string;
    githubBranch?: string;
  },
) {
  await deleteAllProjectFiles(ctx, args.projectId);
  await insertImportedFiles(ctx, args.projectId, args.files);

  const now = Date.now();
  await ctx.db.patch(args.projectId, {
    lastCommitSha: args.commitSha,
    syncedAt: now,
    updatedAt: now,
    importStatus: "completed",
    importStartedAt: undefined,
    importJobToken: undefined,
    importTotalFiles: undefined,
    importDoneFiles: undefined,
    fileContentSplit: true,
    ...(args.githubBranch ? { githubBranch: args.githubBranch } : {}),
  });
}
