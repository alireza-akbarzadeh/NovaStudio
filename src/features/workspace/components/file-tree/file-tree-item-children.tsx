"use client";

import type { FileTreeNode } from "@/features/workspace/lib/file-tree";

import { FileTreeItem } from "./file-tree-item";
import type { FileTreeItemProps } from "./types";

type FileTreeItemChildrenProps = Omit<
  FileTreeItemProps,
  "node" | "depth" | "parentId"
> & {
  node: FileTreeNode;
  depth: number;
};

export function FileTreeItemChildren({
  node,
  depth,
  ...sharedProps
}: FileTreeItemChildrenProps) {
  return (
    <>
      {node.children?.map((child) => (
        <FileTreeItem
          key={child.id}
          node={child}
          depth={depth + 1}
          parentId={node.id}
          {...sharedProps}
        />
      ))}
      {sharedProps.renderPendingCreate(node.id, depth + 1)}
    </>
  );
}
