"use client";

import { MoreHorizontalIcon } from "lucide-react";

import type { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import {
  ContextMenu,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  DropdownMenu,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { setTreeNodeDragData } from "@/features/workspace/lib/file-tree-dnd";
import { pruneNestedSelectedPaths } from "@/features/workspace/lib/file-tree-selection";
import { cn } from "@/lib/utils";

import { FileTreeDeleteDialog } from "./file-tree-delete-dialog";
import { FileTreeItemChildren } from "./file-tree-item-children";
import { FileTreeItemRow } from "./file-tree-item-row";
import { FileTreeMenuContent } from "./file-tree-menu";
import type { FileTreeItemProps } from "./types";
import { useFileTreeItem } from "./use-file-tree-item";

export function FileTreeItem({
  node,
  projectId,
  depth,
  openFolderIds,
  onToggleFolder,
  focusedId,
  onFocusItem,
  selectedIds,
  onSelectItem,
  pendingCreate,
  onStartCreate,
  renderPendingCreate,
  canPaste,
  canEdit,
  cutPath,
  pendingRenameId,
  onPendingRenameHandled,
  pendingDeleteId,
  onPendingDeleteHandled,
  onCut,
  onCopy,
  onPaste,
  onDuplicate,
  onCopyPath,
  onCopyRelativePath,
  onOpenInTerminal,
  onFindInFolder,
  onAddToChat,
  onAddToNewChat,
  onUpload,
  dropTargetId,
  dragSourcePath,
  dragSourcePaths,
  onTreeDragStart,
  onTreeDragEnd,
  onDeleteItems,
  files,
  onItemDragOver,
  onItemDragLeave,
  onItemDrop,
  parentId,
  highlightQuery = "",
}: FileTreeItemProps) {
  const isPendingChild = pendingCreate?.parentId === node.id;
  const isFolder = node.kind === "folder";
  const open = isFolder && (openFolderIds.has(node.id) || isPendingChild);
  const isFocused = focusedId === node.id;
  const isSelected = selectedIds.has(node.id);
  const dropTargetKey: "root" | Id<"projectFiles"> = isFolder
    ? node.id
    : (parentId ?? "root");
  const isDropTarget = isFolder && dropTargetId === node.id;
  const isDragging =
    (dragSourcePaths?.has(node.path) ?? false) ||
    dragSourcePath === node.path ||
    (dragSourcePath !== null &&
      dragSourcePath !== undefined &&
      node.path.startsWith(`${dragSourcePath}/`)) ||
    [...(dragSourcePaths ?? [])].some((path) =>
      node.path.startsWith(`${path}/`),
    );

  const item = useFileTreeItem({
    node,
    projectId,
    isFolder,
    openFolderIds,
    onToggleFolder,
    isPendingChild,
    cutPath,
    pendingRenameId,
    onPendingRenameHandled,
    pendingDeleteId,
    onPendingDeleteHandled,
    canPaste,
    canEdit,
    parentId,
    onStartCreate,
    onCut,
    onCopy,
    onPaste,
    onDuplicate,
    onCopyPath,
    onCopyRelativePath,
    onOpenInTerminal,
    onFindInFolder,
    onAddToChat,
    onAddToNewChat,
    onUpload,
    onFocusItem,
    selectedIds,
    files,
    onDeleteItems,
  });

  const rowFocusProps = {
    ...item.focusProps,
    tabIndex: isFocused ? 0 : -1,
  };

  const sharedChildProps = {
    projectId,
    openFolderIds,
    onToggleFolder,
    focusedId,
    onFocusItem,
    selectedIds,
    onSelectItem,
    pendingCreate,
    onStartCreate,
    renderPendingCreate,
    canPaste,
    canEdit,
    cutPath,
    pendingRenameId,
    onPendingRenameHandled,
    pendingDeleteId,
    onPendingDeleteHandled,
    onCut,
    onCopy,
    onPaste,
    onDuplicate,
    onCopyPath,
    onCopyRelativePath,
    onOpenInTerminal,
    onFindInFolder,
    onAddToChat,
    onAddToNewChat,
    onUpload,
    dropTargetId,
    dragSourcePath,
    dragSourcePaths,
    onTreeDragStart,
    onTreeDragEnd,
    onDeleteItems,
    files,
    onItemDragOver,
    onItemDragLeave,
    onItemDrop,
    highlightQuery,
  };

  const canDrag = canEdit && !item.renaming;

  const handleRowDragStart = (event: React.DragEvent) => {
    const multi =
      selectedIds.has(node.id) && selectedIds.size > 1 && files
        ? pruneNestedSelectedPaths(
            files
              .filter((file) => selectedIds.has(file._id))
              .map((file) => ({ path: file.path, kind: file.kind })),
          )
        : [node.path];

    const payload = {
      path: node.path,
      kind: node.kind,
      parentId,
      paths: multi,
    };
    setTreeNodeDragData(event.dataTransfer, payload);
    onTreeDragStart?.(payload);
  };

  const handleSelect = (event: React.MouseEvent) => {
    onSelectItem(node.id, {
      shiftKey: event.shiftKey,
      modKey: event.metaKey || event.ctrlKey,
    });
  };

  return (
    <div>
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div
            className={cn(
              "group flex items-center rounded-sm",
              (item.menuOpen || item.active || isSelected) && "bg-ws-hover/60",
              isDropTarget && "bg-ws-hover ring-1 ring-ws-accent",
              isDragging && "opacity-50",
            )}
            onDragOver={
              canEdit && onItemDragOver
                ? (event) => onItemDragOver(event, dropTargetKey)
                : undefined
            }
            onDragLeave={
              canEdit && onItemDragLeave
                ? (event) => onItemDragLeave(event, dropTargetKey)
                : undefined
            }
            onDrop={
              canEdit && onItemDrop
                ? (event) =>
                    onItemDrop(event, isFolder ? node.id : parentId)
                : undefined
            }
          >
            <FileTreeItemRow
              isFolder={isFolder}
              open={open}
              depth={depth}
              nodeName={node.name}
              active={item.active}
              isFocused={isFocused}
              isSelected={isSelected}
              isCut={item.isCut}
              renaming={item.renaming}
              renameValue={item.renameValue}
              onRenameValueChange={item.setRenameValue}
              onCommitRename={item.commitRename}
              onCancelRename={item.stopRename}
              onStartRename={item.startRename}
              onSelect={handleSelect}
              onToggleFolder={() => onToggleFolder(node.id)}
              onOpenPreview={item.openPreview}
              onOpenPermanent={item.openPermanent}
              renameInputRef={item.renameInputRef}
              focusProps={rowFocusProps}
              highlightQuery={highlightQuery}
              draggable={canDrag}
              onRowDragStart={canDrag ? handleRowDragStart : undefined}
              onRowDragEnd={canDrag ? () => onTreeDragEnd?.() : undefined}
            />
            {!item.renaming ? (
              <DropdownMenu open={item.menuOpen} onOpenChange={item.setMenuOpen}>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Actions for ${node.name}`}
                    onClick={(e) => e.stopPropagation()}
                    className={cn(
                      "mr-0.5 size-5 shrink-0 rounded-sm text-ws-text-muted opacity-0 hover:bg-ws-border hover:text-ws-text group-hover:opacity-100",
                      item.menuOpen && "opacity-100",
                    )}
                  >
                    <MoreHorizontalIcon className="size-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <FileTreeMenuContent {...item.menuProps} menuType="dropdown" />
              </DropdownMenu>
            ) : null}
          </div>
        </ContextMenuTrigger>
        <FileTreeMenuContent {...item.menuProps} menuType="context" />
      </ContextMenu>

      {isFolder && open ? (
        <FileTreeItemChildren
          node={node}
          depth={depth}
          {...sharedChildProps}
        />
      ) : null}

      <FileTreeDeleteDialog
        open={item.deleteDialogOpen}
        onOpenChange={item.setDeleteDialogOpen}
        nodeName={node.name}
        isFolder={isFolder}
        count={item.deleteCount}
        onConfirm={item.handleDelete}
      />
    </div>
  );
}
