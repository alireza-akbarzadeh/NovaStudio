"use client";

import { useCallback, useMemo, useRef, useState } from "react";

import type { Id } from "@/convex/_generated/dataModel";
import {
  canDropTreeNode,
  isExternalFileDataTransfer,
  isTreeNodeDataTransfer,
  readTreeNodeDragData,
  type TreeDragPayload,
} from "@/features/workspace/lib/file-tree-dnd";

import { createPendingCreateRenderer } from "../components/file-tree/render-pending-create";
import type { FileTreeMenuContentProps } from "../components/file-tree/types";

import { useFileTreeActions } from "./use-file-tree-actions";
import { useFileTreeKeyboard } from "./use-file-tree-keyboard";
import { useFileTreeState } from "./use-file-tree-state";

export type FileTreeDropTargetId = "root" | Id<"projectFiles">;

export function useWorkspaceFileTree(projectId: string) {
  const state = useFileTreeState(projectId);
  const [dropTargetId, setDropTargetId] = useState<FileTreeDropTargetId | null>(
    null,
  );
  const [dragSourcePath, setDragSourcePath] = useState<string | null>(null);
  const [dragSourcePaths, setDragSourcePaths] = useState<Set<string>>(
    new Set(),
  );
  const dragPayloadRef = useRef<TreeDragPayload | null>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const uploadParentIdRef = useRef<Id<"projectFiles"> | undefined>(undefined);

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
    selectOnly: state.selectOnly,
    selectedIds: state.selectedIds,
    selectionAnchorId: state.selectionAnchorId,
    setSelectedIds: state.setSelectedIds,
    setSelectionAnchorId: state.setSelectionAnchorId,
    clearMultiSelection: state.clearMultiSelection,
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

  const { commitCreate, uploadFiles, moveItemsToFolder, deleteItems } = actions;
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

  const openUploadPicker = useCallback(
    (targetParentId?: Id<"projectFiles">) => {
      if (!state.canEdit) return;
      uploadParentIdRef.current = targetParentId;
      uploadInputRef.current?.click();
    },
    [state.canEdit],
  );

  const handleUploadInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const selected = event.target.files;
      if (!selected || selected.length === 0) return;
      const list = Array.from(selected);
      event.target.value = "";
      void uploadFiles(list, uploadParentIdRef.current);
      uploadParentIdRef.current = undefined;
    },
    [uploadFiles],
  );

  const clearDragState = useCallback(() => {
    setDropTargetId(null);
    setDragSourcePath(null);
    setDragSourcePaths(new Set());
    dragPayloadRef.current = null;
  }, []);

  const beginTreeDrag = useCallback((payload: TreeDragPayload) => {
    dragPayloadRef.current = payload;
    setDragSourcePath(payload.path);
    setDragSourcePaths(new Set(payload.paths));
  }, []);

  const endTreeDrag = useCallback(() => {
    clearDragState();
  }, [clearDragState]);

  const resolveTreePayload = useCallback(
    (dataTransfer: DataTransfer | null): TreeDragPayload | null => {
      return readTreeNodeDragData(dataTransfer) ?? dragPayloadRef.current;
    },
    [],
  );

  const handleRootDragOver = useCallback(
    (event: React.DragEvent) => {
      if (!state.canEdit) return;

      if (isTreeNodeDataTransfer(event.dataTransfer) || dragPayloadRef.current) {
        const payload = resolveTreePayload(event.dataTransfer);
        if (!payload || !canDropTreeNode(payload, undefined, state.files)) {
          return;
        }
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
        setDropTargetId("root");
        return;
      }

      if (isExternalFileDataTransfer(event.dataTransfer)) {
        event.preventDefault();
        event.dataTransfer.dropEffect = "copy";
        setDropTargetId("root");
      }
    },
    [resolveTreePayload, state.canEdit, state.files],
  );

  const handleRootDragLeave = useCallback((event: React.DragEvent) => {
    const related = event.relatedTarget as Node | null;
    if (related && event.currentTarget.contains(related)) return;
    setDropTargetId((current) => (current === "root" ? null : current));
  }, []);

  const handleRootDrop = useCallback(
    (event: React.DragEvent) => {
      if (!state.canEdit) return;

      if (isTreeNodeDataTransfer(event.dataTransfer) || dragPayloadRef.current) {
        event.preventDefault();
        const payload = resolveTreePayload(event.dataTransfer);
        clearDragState();
        if (!payload || !canDropTreeNode(payload, undefined, state.files)) {
          return;
        }
        void moveItemsToFolder(payload.paths, undefined);
        return;
      }

      if (!isExternalFileDataTransfer(event.dataTransfer)) return;
      event.preventDefault();
      setDropTargetId(null);
      const list = Array.from(event.dataTransfer.files);
      if (list.length === 0) return;
      void uploadFiles(list, undefined);
    },
    [
      clearDragState,
      moveItemsToFolder,
      resolveTreePayload,
      state.canEdit,
      state.files,
      uploadFiles,
    ],
  );

  const handleItemDragOver = useCallback(
    (event: React.DragEvent, targetId: FileTreeDropTargetId) => {
      if (!state.canEdit) return;

      const targetParentId = targetId === "root" ? undefined : targetId;

      if (isTreeNodeDataTransfer(event.dataTransfer) || dragPayloadRef.current) {
        const payload = resolveTreePayload(event.dataTransfer);
        if (!payload || !canDropTreeNode(payload, targetParentId, state.files)) {
          return;
        }
        event.preventDefault();
        event.stopPropagation();
        event.dataTransfer.dropEffect = "move";
        setDropTargetId(targetId);
        return;
      }

      if (!isExternalFileDataTransfer(event.dataTransfer)) return;
      event.preventDefault();
      event.stopPropagation();
      event.dataTransfer.dropEffect = "copy";
      setDropTargetId(targetId);
    },
    [resolveTreePayload, state.canEdit, state.files],
  );

  const handleItemDragLeave = useCallback(
    (event: React.DragEvent, targetId: FileTreeDropTargetId) => {
      const related = event.relatedTarget as Node | null;
      if (related && event.currentTarget.contains(related)) return;
      setDropTargetId((current) => (current === targetId ? null : current));
    },
    [],
  );

  const handleItemDrop = useCallback(
    (
      event: React.DragEvent,
      targetParentId: Id<"projectFiles"> | undefined,
    ) => {
      if (!state.canEdit) return;

      if (isTreeNodeDataTransfer(event.dataTransfer) || dragPayloadRef.current) {
        event.preventDefault();
        event.stopPropagation();
        const payload = resolveTreePayload(event.dataTransfer);
        clearDragState();
        if (!payload || !canDropTreeNode(payload, targetParentId, state.files)) {
          return;
        }
        void moveItemsToFolder(payload.paths, targetParentId);
        return;
      }

      if (!isExternalFileDataTransfer(event.dataTransfer)) return;
      event.preventDefault();
      event.stopPropagation();
      setDropTargetId(null);
      const list = Array.from(event.dataTransfer.files);
      if (list.length === 0) return;
      void uploadFiles(list, targetParentId);
    },
    [
      clearDragState,
      moveItemsToFolder,
      resolveTreePayload,
      state.canEdit,
      state.files,
      uploadFiles,
    ],
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
    onUpload: () => openUploadPicker(undefined),
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
    selectOnly: state.selectOnly,
    selectedIds: state.selectedIds,
    selectItem: state.selectItem,
    clearMultiSelection: state.clearMultiSelection,
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
    uploadFiles,
    openUploadPicker,
    uploadInputRef,
    handleUploadInputChange,
    dropTargetId,
    dragSourcePath,
    dragSourcePaths,
    beginTreeDrag,
    endTreeDrag,
    deleteItems,
    handleRootDragOver,
    handleRootDragLeave,
    handleRootDrop,
    handleItemDragOver,
    handleItemDragLeave,
    handleItemDrop,
  };
}
