"use client";

import { useMemo } from "react";

import { createPendingCreateRenderer } from "../components/file-tree/render-pending-create";
import type { FileTreeMenuContentProps } from "../components/file-tree/types";

import { useFileTreeActions } from "./use-file-tree-actions";
import { useFileTreeKeyboard } from "./use-file-tree-keyboard";
import { useFileTreeState } from "./use-file-tree-state";

export function useWorkspaceFileTree(projectId: string) {
  const state = useFileTreeState(projectId);

  const actions = useFileTreeActions({
    projectId,
    files: state.files,
    pendingCreate: state.pendingCreate,
    cancelCreate: state.cancelCreate,
    setOpenFolderIds: state.setOpenFolderIds,
  });

  const { handleTreeKeyDown } = useFileTreeKeyboard({
    tree: state.tree,
    filteredTree: state.filteredTree,
    openFolderIds: state.openFolderIds,
    focusedId: state.focusedId,
    setFocusedId: state.setFocusedId,
    setPendingRenameId: state.setPendingRenameId,
    setPendingDeleteId: state.setPendingDeleteId,
    toggleFolder: state.toggleFolder,
    cutItem: actions.cutItem,
    copyItem: actions.copyItem,
    pasteInto: actions.pasteInto,
  });

  const canPaste = Boolean(
    actions.treeClipboard && actions.treeClipboard.projectId === projectId,
  );

  const { commitCreate } = actions;
  const renderPendingCreate = useMemo(
    () =>
      createPendingCreateRenderer(
        state.pendingCreate,
        state.files,
        (name) => void commitCreate(name),
        state.cancelCreate,
      ),
    [commitCreate, state.cancelCreate, state.files, state.pendingCreate],
  );

  const backgroundMenuProps: FileTreeMenuContentProps = {
    isFolder: true,
    showItemActions: false,
    canPaste: canPaste && state.canEdit,
    onNewFile: () => {
      if (state.canEdit) state.startCreate("file");
    },
    onNewFolder: () => {
      if (state.canEdit) state.startCreate("folder");
    },
    onPaste: () => {
      if (state.canEdit) void actions.pasteInto(undefined);
    },
    onOpen: () => {},
    onOpenInTerminal: () => actions.openInTerminal(""),
    onAddToChat: () => {},
    onAddToNewChat: () => {},
    onFindInFolder: actions.findInFolder,
    onCut: () => {},
    onCopy: () => {},
    onDuplicate: () => {},
    onCopyPath: () => {},
    onCopyRelativePath: () => {},
    onRename: () => {},
    onDelete: () => {},
    canEdit: state.canEdit,
  };

  const cutPath =
    actions.treeClipboard?.mode === "cut" &&
    actions.treeClipboard.projectId === projectId
      ? actions.treeClipboard.path
      : null;

  const visibleTree = state.filteredTree ?? state.tree ?? [];

  return {
    files: state.files,
    canEdit: state.canEdit,
    collapseKey: state.collapseKey,
    treeFilter: state.treeFilter,
    setTreeFilter: state.setTreeFilter,
    isFiltering: state.isFiltering,
    tree: state.tree,
    visibleTree,
    openFolderIds: state.openFolderIds,
    focusedId: state.focusedId,
    setFocusedId: state.setFocusedId,
    pendingCreate: state.pendingCreate,
    pendingRenameId: state.pendingRenameId,
    setPendingRenameId: state.setPendingRenameId,
    pendingDeleteId: state.pendingDeleteId,
    setPendingDeleteId: state.setPendingDeleteId,
    startCreate: state.startCreate,
    collapseAll: state.collapseAll,
    toggleFolder: state.toggleFolder,
    renderPendingCreate,
    handleTreeKeyDown,
    backgroundMenuProps,
    canPaste: canPaste && state.canEdit,
    cutPath,
    cutItem: actions.cutItem,
    copyItem: actions.copyItem,
    pasteInto: actions.pasteInto,
    duplicateItem: actions.duplicateItem,
    copyPathToClipboard: actions.copyPathToClipboard,
    openInTerminal: actions.openInTerminal,
    findInFolder: actions.findInFolder,
    attachToChat: actions.attachToChat,
  };
}
