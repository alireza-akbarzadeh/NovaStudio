"use client";

import { useVirtualizer } from "@tanstack/react-virtual";
import { forwardRef, useMemo, useRef } from "react";

import { FileTreeItem } from "@/features/workspace/components/file-tree/file-tree-item";
import {
  buildFlatTreeEntries,
  FILE_TREE_ROW_HEIGHT,
  FILE_TREE_VIRTUALIZE_THRESHOLD,
  type FlatTreeEntry,
} from "@/features/workspace/components/file-tree/tree-utils";
import type { FileTreeItemProps } from "@/features/workspace/components/file-tree/types";
import type { useWorkspaceFileTree } from "@/features/workspace/hooks/use-workspace-file-tree";

type WorkspaceFileTreeState = ReturnType<typeof useWorkspaceFileTree>;

type VirtualizedFileTreeListProps = {
  tree: WorkspaceFileTreeState;
  projectId: string;
  navClassName?: string;
  navKey?: number;
  onKeyDown?: React.KeyboardEventHandler<HTMLElement>;
  onDragOver?: React.DragEventHandler<HTMLElement>;
  onDragLeave?: React.DragEventHandler<HTMLElement>;
  onDrop?: React.DragEventHandler<HTMLElement>;
};

function entryKey(entry: FlatTreeEntry, index: number) {
  if (entry.type === "node") {
    return entry.item.node.id;
  }
  return `pending-${entry.parentId ?? "root"}-${index}`;
}

export function shouldVirtualizeFileTree(entryCount: number) {
  return entryCount >= FILE_TREE_VIRTUALIZE_THRESHOLD;
}

export const VirtualizedFileTreeList = forwardRef<
  HTMLElement,
  VirtualizedFileTreeListProps
>(function VirtualizedFileTreeList(
  {
    tree,
    projectId,
    navClassName,
    navKey,
    onKeyDown,
    onDragOver,
    onDragLeave,
    onDrop,
  },
  forwardedRef,
) {
  const scrollRef = useRef<HTMLElement>(null);

  const setScrollRef = (node: HTMLElement | null) => {
    scrollRef.current = node;
    if (typeof forwardedRef === "function") {
      forwardedRef(node);
    } else if (forwardedRef) {
      forwardedRef.current = node;
    }
  };

  const entries = useMemo(
    () =>
      buildFlatTreeEntries(
        tree.visibleTree,
        tree.openFolderIds,
        tree.isFiltering ? null : tree.pendingCreate,
      ),
    [
      tree.isFiltering,
      tree.openFolderIds,
      tree.pendingCreate,
      tree.visibleTree,
    ],
  );

  const virtualizer = useVirtualizer({
    count: entries.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => FILE_TREE_ROW_HEIGHT,
    overscan: 16,
  });

  const sharedItemProps = {
    projectId,
    openFolderIds: tree.openFolderIds,
    onToggleFolder: tree.toggleFolder,
    focusedId: tree.focusedId,
    onFocusItem: tree.setFocusedId,
    selectedIds: tree.selectedIds,
    onSelectItem: tree.selectItem,
    pendingCreate: tree.isFiltering ? null : tree.pendingCreate,
    onStartCreate: tree.startCreate,
    renderPendingCreate: tree.renderPendingCreate,
    canPaste: tree.canPaste,
    canEdit: tree.canEdit,
    cutPath: tree.cutPath,
    pendingRenameId: tree.pendingRenameId,
    onPendingRenameHandled: () => tree.setPendingRenameId(null),
    pendingDeleteId: tree.pendingDeleteId,
    onPendingDeleteHandled: () => tree.setPendingDeleteId(null),
    onCut: tree.cutItem,
    onCopy: tree.copyItem,
    onPaste: tree.pasteInto,
    onDuplicate: tree.duplicateItem,
    onCopyPath: (path: string) => void tree.copyPathToClipboard(path, "Path"),
    onCopyRelativePath: (path: string) =>
      void tree.copyPathToClipboard(path, "Relative path"),
    onOpenInTerminal: tree.openInTerminal,
    onFindInFolder: tree.findInFolder,
    onAddToChat: (path: string, kind: "file" | "folder") =>
      tree.attachToChat(path, kind, false),
    onAddToNewChat: (path: string, kind: "file" | "folder") =>
      tree.attachToChat(path, kind, true),
    onUpload: tree.openUploadPicker,
    dropTargetId: tree.dropTargetId,
    dragSourcePath: tree.dragSourcePath,
    dragSourcePaths: tree.dragSourcePaths,
    onTreeDragStart: tree.beginTreeDrag,
    onTreeDragEnd: tree.endTreeDrag,
    onDeleteItems: tree.deleteItems,
    files: tree.files,
    onItemDragOver: tree.handleItemDragOver,
    onItemDragLeave: tree.handleItemDragLeave,
    onItemDrop: tree.handleItemDrop,
    highlightQuery: tree.treeFilter,
    flat: true,
  } satisfies Omit<FileTreeItemProps, "node" | "depth" | "parentId">;

  return (
    <nav
      ref={setScrollRef}
      aria-label="Project files"
      tabIndex={-1}
      className={navClassName}
      key={navKey}
      onKeyDown={onKeyDown}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      {tree.isFiltering && tree.visibleTree.length === 0 ? (
        <p className="px-2 py-2 text-[11px] text-ws-text-muted">
          No matching files
        </p>
      ) : null}
      <div
        className="relative w-full"
        style={{ height: `${virtualizer.getTotalSize()}px` }}
      >
        {virtualizer.getVirtualItems().map((virtualRow) => {
          const entry = entries[virtualRow.index];
          return (
            <div
              key={entryKey(entry, virtualRow.index)}
              data-index={virtualRow.index}
              className="absolute top-0 left-0 w-full"
              style={{
                height: `${FILE_TREE_ROW_HEIGHT}px`,
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              {entry.type === "pending-create" ? (
                tree.renderPendingCreate(entry.parentId, entry.depth)
              ) : (
                <FileTreeItem
                  node={entry.item.node}
                  depth={entry.item.depth}
                  parentId={entry.item.parentId}
                  {...sharedItemProps}
                />
              )}
            </div>
          );
        })}
      </div>
    </nav>
  );
});
