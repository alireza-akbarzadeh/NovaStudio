"use client";

import { MoreHorizontalIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  ContextMenu,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  DropdownMenu,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  parentId,
  highlightQuery = "",
}: FileTreeItemProps) {
  const isPendingChild = pendingCreate?.parentId === node.id;
  const isFolder = node.kind === "folder";
  const open = isFolder && (openFolderIds.has(node.id) || isPendingChild);
  const isFocused = focusedId === node.id;

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
    onFocusItem,
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
    highlightQuery,
  };

  return (
    <div>
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div
            className={cn(
              "group flex items-center rounded-sm",
              (item.menuOpen || item.active) && "bg-ws-hover/60",
            )}
          >
            <FileTreeItemRow
              isFolder={isFolder}
              open={open}
              depth={depth}
              nodeName={node.name}
              href={item.href}
              active={item.active}
              isFocused={isFocused}
              isCut={item.isCut}
              renaming={item.renaming}
              renameValue={item.renameValue}
              onRenameValueChange={item.setRenameValue}
              onCommitRename={item.commitRename}
              onCancelRename={item.stopRename}
              onStartRename={item.startRename}
              onFocusItem={() => onFocusItem(node.id)}
              onToggleFolder={() => onToggleFolder(node.id)}
              renameInputRef={item.renameInputRef}
              focusProps={rowFocusProps}
              highlightQuery={highlightQuery}
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
        onConfirm={item.handleDelete}
      />
    </div>
  );
}
