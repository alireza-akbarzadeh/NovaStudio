import type { Doc, Id } from "@/convex/_generated/dataModel";
import type { FileTreeNode } from "@/features/workspace/lib/file-tree";

import type { PendingCreate, VisibleTreeItem } from "./types";

export const CHAT_ATTACH_FILE_CAP = 20;

export type FlatTreeEntry =
  | { type: "node"; item: VisibleTreeItem }
  | {
      type: "pending-create";
      parentId?: Id<"projectFiles">;
      depth: number;
    };

export const FILE_TREE_ROW_HEIGHT = 26;

export const FILE_TREE_VIRTUALIZE_THRESHOLD = 60;

export function collectFolderIds(nodes: FileTreeNode[]): Id<"projectFiles">[] {
  const ids: Id<"projectFiles">[] = [];
  for (const node of nodes) {
    if (node.kind === "folder") {
      ids.push(node.id);
      if (node.children) {
        ids.push(...collectFolderIds(node.children));
      }
    }
  }
  return ids;
}

export function flattenVisibleTree(
  nodes: FileTreeNode[],
  openFolderIds: Set<Id<"projectFiles">>,
  depth = 0,
  parentId?: Id<"projectFiles">,
): VisibleTreeItem[] {
  const items: VisibleTreeItem[] = [];

  for (const node of nodes) {
    items.push({ node, depth, parentId });
    if (
      node.kind === "folder" &&
      openFolderIds.has(node.id) &&
      node.children?.length
    ) {
      items.push(
        ...flattenVisibleTree(node.children, openFolderIds, depth + 1, node.id),
      );
    }
  }

  return items;
}

/** Flat visible rows plus inline pending-create slots for virtual scrolling. */
export function buildFlatTreeEntries(
  nodes: FileTreeNode[],
  openFolderIds: Set<Id<"projectFiles">>,
  pendingCreate: PendingCreate | null,
): FlatTreeEntry[] {
  const flat = flattenVisibleTree(nodes, openFolderIds);
  const entries: FlatTreeEntry[] = [];

  for (const item of flat) {
    entries.push({ type: "node", item });
    if (
      pendingCreate &&
      item.node.kind === "folder" &&
      openFolderIds.has(item.node.id) &&
      pendingCreate.parentId === item.node.id
    ) {
      entries.push({
        type: "pending-create",
        parentId: item.node.id,
        depth: item.depth + 1,
      });
    }
  }

  if (pendingCreate && pendingCreate.parentId === undefined) {
    entries.push({ type: "pending-create", parentId: undefined, depth: 0 });
  }

  return entries;
}

export function findNodeByPath(
  nodes: FileTreeNode[],
  path: string,
): FileTreeNode | undefined {
  for (const node of nodes) {
    if (node.path === path) {
      return node;
    }
    if (node.children) {
      const match = findNodeByPath(node.children, path);
      if (match) {
        return match;
      }
    }
  }
  return undefined;
}

export function collectAttachPaths(
  files: Doc<"projectFiles">[],
  path: string,
  kind: "file" | "folder",
): string[] {
  if (kind === "file") {
    return [path];
  }

  return files
    .filter(
      (file) =>
        file.kind === "file" &&
        (file.path === path || file.path.startsWith(`${path}/`)),
    )
    .map((file) => file.path)
    .slice(0, CHAT_ATTACH_FILE_CAP);
}

export function toTerminalCwd(folderPath: string) {
  return folderPath ? `/${folderPath}` : "/";
}

export function isModKey(event: KeyboardEvent | React.KeyboardEvent) {
  return event.ctrlKey || event.metaKey;
}

export function renamingInputFocused() {
  const active = document.activeElement;
  return (
    active instanceof HTMLInputElement &&
    active.dataset.treeRenameInput === "true"
  );
}
