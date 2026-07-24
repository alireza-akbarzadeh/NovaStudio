"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import type { Id } from "@/convex/_generated/dataModel";
import { useEditorTabs } from "@/features/workspace/hooks/use-editor-tabs";
import type { FileTreeNode } from "@/features/workspace/lib/file-tree";

import { buildItemMenuProps } from "./build-item-menu-props";
import { useFileTreeItemMutations } from "./use-file-tree-item-mutations";

type UseFileTreeItemParams = {
  node: FileTreeNode;
  projectId: string;
  isFolder: boolean;
  openFolderIds: Set<Id<"projectFiles">>;
  onToggleFolder: (folderId: Id<"projectFiles">) => void;
  isPendingChild: boolean;
  cutPath: string | null;
  pendingRenameId: Id<"projectFiles"> | null;
  onPendingRenameHandled: () => void;
  pendingDeleteId: Id<"projectFiles"> | null;
  onPendingDeleteHandled: () => void;
  canPaste: boolean;
  canEdit: boolean;
  parentId?: Id<"projectFiles">;
  onStartCreate: (kind: "file" | "folder", parentId?: Id<"projectFiles">) => void;
  onCut: (path: string) => void;
  onCopy: (path: string) => void;
  onPaste: (targetParentId?: Id<"projectFiles">) => Promise<void>;
  onDuplicate: (path: string) => Promise<void>;
  onCopyPath: (path: string) => void;
  onCopyRelativePath: (path: string) => void;
  onOpenInTerminal: (folderPath: string) => void;
  onFindInFolder: (folderPath?: string) => void;
  onAddToChat: (path: string, kind: "file" | "folder") => void;
  onAddToNewChat: (path: string, kind: "file" | "folder") => void;
  onFocusItem: (id: Id<"projectFiles">) => void;
};

export function useFileTreeItem({
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
}: UseFileTreeItemParams) {
  const pathname = usePathname();
  const { openTab } = useEditorTabs(projectId);
  const isCut =
    cutPath === node.path ||
    (cutPath !== null && node.path.startsWith(`${cutPath}/`));
  const isRenameRequested = pendingRenameId === node.id;
  const isDeleteRequested = pendingDeleteId === node.id;
  const [manualRenaming, setManualRenaming] = useState(false);
  const renaming = manualRenaming || isRenameRequested;
  const [renameValue, setRenameValue] = useState(node.name);
  const [renameRequestKey, setRenameRequestKey] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const renameInputRef = useRef<HTMLInputElement>(null);

  const href = `/projects/${projectId}/files/${node.path}`;
  const active = !isFolder && pathname === href;

  const {
    deleteDialogOpen,
    setDeleteDialogOpen,
    commitRename,
    handleDelete,
    openDeleteDialog,
  } = useFileTreeItemMutations({
    nodePath: node.path,
    nodeName: node.name,
    projectId,
    isFolder,
    href,
    isDeleteRequested,
    onPendingDeleteHandled,
  });

  useEffect(() => {
    if (isPendingChild && isFolder && !openFolderIds.has(node.id)) {
      onToggleFolder(node.id);
    }
  }, [isFolder, isPendingChild, node.id, onToggleFolder, openFolderIds]);

  useEffect(() => {
    if (renaming) {
      renameInputRef.current?.focus();
      renameInputRef.current?.select();
    }
  }, [renaming]);

  const currentRenameRequestKey = isRenameRequested ? node.id : null;
  if (currentRenameRequestKey !== renameRequestKey) {
    setRenameRequestKey(currentRenameRequestKey);
    if (currentRenameRequestKey) {
      setRenameValue(node.name);
    }
  }

  const startRename = () => {
    setRenameValue(node.name);
    setManualRenaming(true);
  };

  const stopRename = () => {
    setManualRenaming(false);
    if (isRenameRequested) {
      onPendingRenameHandled();
    }
  };

  const openPreview = () => {
    openTab({ kind: "file", path: node.path }, { mode: "preview" });
  };

  const openPermanent = () => {
    openTab({ kind: "file", path: node.path }, { mode: "permanent" });
  };

  const menuProps = buildItemMenuProps({
    node,
    isFolder,
    canPaste,
    canEdit,
    parentId,
    onOpenFile: openPermanent,
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
    startRename,
    openDeleteDialog,
  });

  const focusProps = {
    "data-tree-item-id": node.id,
    tabIndex: 0 as const,
    onFocus: () => onFocusItem(node.id),
  };

  return {
    active,
    href,
    isCut,
    renaming,
    renameValue,
    setRenameValue,
    renameInputRef,
    menuOpen,
    setMenuOpen,
    deleteDialogOpen,
    setDeleteDialogOpen,
    menuProps,
    focusProps,
    startRename,
    stopRename,
    openPreview,
    openPermanent,
    commitRename: () => {
      const value = renameValue;
      stopRename();
      void commitRename(value);
    },
    handleDelete: () => void handleDelete(),
  };
}
