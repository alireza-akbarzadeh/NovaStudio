import type { Doc, Id } from "@/convex/_generated/dataModel";

/** Custom MIME for in-tree move drags (not OS file drops). */
export const TREE_NODE_MIME = "application/x-polaris-tree-node";

export type TreeDragPayload = {
  /** Primary path under the cursor (for display / fallback). */
  path: string;
  kind: "file" | "folder";
  parentId?: Id<"projectFiles">;
  /** All paths being moved (pruned so folders cover their children). */
  paths: string[];
};

export function isTreeNodeDataTransfer(
  dataTransfer: DataTransfer | null,
): boolean {
  if (!dataTransfer) return false;
  return Array.from(dataTransfer.types).includes(TREE_NODE_MIME);
}

export function isExternalFileDataTransfer(
  dataTransfer: DataTransfer | null,
): boolean {
  if (!dataTransfer) return false;
  const types = Array.from(dataTransfer.types);
  return types.includes("Files") && !types.includes(TREE_NODE_MIME);
}

export function setTreeNodeDragData(
  dataTransfer: DataTransfer,
  payload: TreeDragPayload,
) {
  const normalized: TreeDragPayload = {
    ...payload,
    paths: payload.paths.length > 0 ? payload.paths : [payload.path],
  };
  dataTransfer.setData(TREE_NODE_MIME, JSON.stringify(normalized));
  dataTransfer.setData("text/plain", normalized.paths.join("\n"));
  dataTransfer.effectAllowed = "move";
}

export function readTreeNodeDragData(
  dataTransfer: DataTransfer | null,
): TreeDragPayload | null {
  if (!dataTransfer) return null;
  const raw = dataTransfer.getData(TREE_NODE_MIME);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as TreeDragPayload;
    if (
      typeof parsed.path !== "string" ||
      (parsed.kind !== "file" && parsed.kind !== "folder")
    ) {
      return null;
    }
    const paths =
      Array.isArray(parsed.paths) && parsed.paths.length > 0
        ? parsed.paths.filter((path): path is string => typeof path === "string")
        : [parsed.path];
    return { ...parsed, paths };
  } catch {
    return null;
  }
}

function canDropSinglePath(
  path: string,
  kind: "file" | "folder",
  parentId: Id<"projectFiles"> | undefined,
  targetParentId: Id<"projectFiles"> | undefined,
  files: Doc<"projectFiles">[] | undefined,
): boolean {
  if ((parentId ?? undefined) === (targetParentId ?? undefined)) {
    return false;
  }

  if (targetParentId === undefined) {
    return true;
  }

  const target = files?.find((file) => file._id === targetParentId);
  if (!target || target.kind !== "folder") {
    return false;
  }

  if (target.path === path) {
    return false;
  }

  if (
    kind === "folder" &&
    (target.path === path || target.path.startsWith(`${path}/`))
  ) {
    return false;
  }

  return true;
}

export function canDropTreeNode(
  payload: TreeDragPayload,
  targetParentId: Id<"projectFiles"> | undefined,
  files: Doc<"projectFiles">[] | undefined,
): boolean {
  const paths = payload.paths.length > 0 ? payload.paths : [payload.path];

  if (targetParentId !== undefined) {
    const target = files?.find((file) => file._id === targetParentId);
    if (!target || target.kind !== "folder") {
      return false;
    }
    // Cannot drop into a folder that is itself being moved
    if (
      paths.some(
        (path) =>
          target.path === path || target.path.startsWith(`${path}/`),
      )
    ) {
      return false;
    }
  }

  let anyMovable = false;
  for (const path of paths) {
    const item = files?.find((file) => file.path === path);
    if (!item) return false;
    if (
      canDropSinglePath(
        path,
        item.kind,
        item.parentId,
        targetParentId,
        files,
      )
    ) {
      anyMovable = true;
    }
  }

  return anyMovable;
}
