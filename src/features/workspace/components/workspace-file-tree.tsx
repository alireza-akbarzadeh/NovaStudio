"use client";

import { useMemo } from "react";

import { ContextMenu, ContextMenuTrigger } from "@/components/ui/context-menu";
import { cn } from "@/lib/utils";

import { FileTreeItem } from "./file-tree/file-tree-item";
import { FileTreeMenuContent } from "./file-tree/file-tree-menu";
import { TreeToolbar } from "./file-tree/tree-toolbar";
import {
  buildFlatTreeEntries,
} from "./file-tree/tree-utils";
import type { WorkspaceFileTreeProps } from "./file-tree/types";
import {
  shouldVirtualizeFileTree,
  VirtualizedFileTreeList,
} from "./file-tree/virtualized-file-tree-list";
import { useWorkspaceFileTree } from "../hooks/use-workspace-file-tree";

export function WorkspaceFileTree({ projectId }: WorkspaceFileTreeProps) {
  const tree = useWorkspaceFileTree(projectId);

  const flatEntryCount = useMemo(() => {
    if (!tree.tree) return 0;
    return buildFlatTreeEntries(
      tree.visibleTree,
      tree.openFolderIds,
      tree.isFiltering ? null : tree.pendingCreate,
    ).length;
  }, [
    tree.isFiltering,
    tree.openFolderIds,
    tree.pendingCreate,
    tree.tree,
    tree.visibleTree,
  ]);

  const useVirtualList = shouldVirtualizeFileTree(flatEntryCount);

  const navClassName = cn(
    "flex-1 overflow-auto rounded-sm p-1.5 outline-none focus-visible:outline-none",
    tree.dropTargetId === "root" && "bg-ws-hover/40 ring-1 ring-ws-accent",
  );

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
  } as const;

  const uploadInput = tree.canEdit ? (
    <input
      ref={tree.uploadInputRef}
      type="file"
      multiple
      className="hidden"
      aria-hidden
      tabIndex={-1}
      onChange={tree.handleUploadInputChange}
    />
  ) : null;

  if (tree.files === undefined) {
    return (
      <p className="px-3 py-2 text-[11px] text-ws-text-muted">Loading files…</p>
    );
  }

  if (tree.tree?.length === 0) {
    return (
      <div className="flex h-full flex-col">
        {uploadInput}
        <TreeToolbar
          canEdit={tree.canEdit}
          onNewFile={() => tree.startCreate("file")}
          onNewFolder={() => tree.startCreate("folder")}
          onUpload={
            tree.canEdit ? () => tree.openUploadPicker(undefined) : undefined
          }
          onCollapseAll={tree.collapseAll}
          filter={tree.treeFilter}
          onFilterChange={tree.setTreeFilter}
        />
        <ContextMenu>
          <ContextMenuTrigger asChild>
            <div
              tabIndex={-1}
              className={cn(
                "flex min-h-24 flex-1 flex-col rounded-sm p-1.5 outline-none focus-visible:outline-none",
                tree.dropTargetId === "root" &&
                  "bg-ws-hover ring-1 ring-ws-accent",
              )}
              onKeyDown={tree.handleTreeKeyDown}
              onDragOver={tree.handleRootDragOver}
              onDragLeave={tree.handleRootDragLeave}
              onDrop={tree.handleRootDrop}
            >
              {tree.canEdit ? tree.renderPendingCreate(undefined, 0) : null}
              {!tree.pendingCreate ? (
                <p className="px-2 py-2 text-[11px] text-ws-text-muted">
                  {tree.canEdit
                    ? "No files yet — drop files here or use Upload"
                    : "No files yet"}
                </p>
              ) : null}
            </div>
          </ContextMenuTrigger>
          <FileTreeMenuContent {...tree.backgroundMenuProps} />
        </ContextMenu>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {uploadInput}
      <TreeToolbar
        canEdit={tree.canEdit}
        onNewFile={() => tree.startCreate("file")}
        onNewFolder={() => tree.startCreate("folder")}
        onUpload={
          tree.canEdit ? () => tree.openUploadPicker(undefined) : undefined
        }
        onCollapseAll={tree.collapseAll}
        filter={tree.treeFilter}
        onFilterChange={tree.setTreeFilter}
      />

      <ContextMenu>
        <ContextMenuTrigger asChild>
          {useVirtualList ? (
            <VirtualizedFileTreeList
              tree={tree}
              projectId={projectId}
              navClassName={navClassName}
              navKey={tree.collapseKey}
              onKeyDown={tree.handleTreeKeyDown}
              onDragOver={tree.handleRootDragOver}
              onDragLeave={tree.handleRootDragLeave}
              onDrop={tree.handleRootDrop}
            />
          ) : (
            <nav
              aria-label="Project files"
              tabIndex={-1}
              className={navClassName}
              key={tree.collapseKey}
              onKeyDown={tree.handleTreeKeyDown}
              onDragOver={tree.handleRootDragOver}
              onDragLeave={tree.handleRootDragLeave}
              onDrop={tree.handleRootDrop}
            >
              {tree.isFiltering && tree.visibleTree.length === 0 ? (
                <p className="px-2 py-2 text-[11px] text-ws-text-muted">
                  No matching files
                </p>
              ) : null}
              {tree.visibleTree.map((node) => (
                <FileTreeItem
                  key={node.id}
                  node={node}
                  {...sharedItemProps}
                  depth={0}
                />
              ))}
              {!tree.isFiltering && tree.canEdit
                ? tree.renderPendingCreate(undefined, 0)
                : null}
            </nav>
          )}
        </ContextMenuTrigger>
        <FileTreeMenuContent {...tree.backgroundMenuProps} />
      </ContextMenu>
    </div>
  );
}
