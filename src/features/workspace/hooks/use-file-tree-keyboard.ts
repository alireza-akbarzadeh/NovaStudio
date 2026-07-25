"use client";

import { useCallback } from "react";

import type { Id } from "@/convex/_generated/dataModel";
import type { FileTreeNode } from "@/features/workspace/lib/file-tree";
import { extendTreeSelection } from "@/features/workspace/lib/file-tree-selection";

import {
  flattenVisibleTree,
  isModKey,
  renamingInputFocused,
} from "../components/file-tree/tree-utils";

type UseFileTreeKeyboardParams = {
  tree: FileTreeNode[] | undefined;
  filteredTree: FileTreeNode[] | undefined;
  openFolderIds: Set<Id<"projectFiles">>;
  focusedId: Id<"projectFiles"> | null;
  setFocusedId: (id: Id<"projectFiles">) => void;
  selectOnly: (id: Id<"projectFiles">) => void;
  selectedIds: Set<Id<"projectFiles">>;
  selectionAnchorId: Id<"projectFiles"> | null;
  setSelectedIds: React.Dispatch<
    React.SetStateAction<Set<Id<"projectFiles">>>
  >;
  setSelectionAnchorId: React.Dispatch<
    React.SetStateAction<Id<"projectFiles"> | null>
  >;
  clearMultiSelection: () => void;
  setPendingRenameId: (id: Id<"projectFiles">) => void;
  setPendingDeleteId: (id: Id<"projectFiles">) => void;
  toggleFolder: (folderId: Id<"projectFiles">) => void;
  cutItem: (path: string) => void;
  copyItem: (path: string) => void;
  pasteInto: (targetParentId?: Id<"projectFiles">) => Promise<void>;
};

export function useFileTreeKeyboard({
  tree,
  filteredTree,
  openFolderIds,
  focusedId,
  setFocusedId,
  selectOnly,
  selectedIds,
  selectionAnchorId,
  setSelectedIds,
  setSelectionAnchorId,
  clearMultiSelection,
  setPendingRenameId,
  setPendingDeleteId,
  toggleFolder,
  cutItem,
  copyItem,
  pasteInto,
}: UseFileTreeKeyboardParams) {
  const handleTreeKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLElement>) => {
      if (!tree || renamingInputFocused()) {
        return;
      }

      const visibleItems = flattenVisibleTree(
        filteredTree ?? tree,
        openFolderIds,
      );
      if (visibleItems.length === 0) {
        return;
      }

      const currentIndex = focusedId
        ? visibleItems.findIndex((item) => item.node.id === focusedId)
        : -1;
      const current =
        currentIndex >= 0 ? visibleItems[currentIndex] : undefined;

      if (event.key === "Escape") {
        event.preventDefault();
        clearMultiSelection();
        return;
      }

      // Bare letter shortcuts when the tree is focused (VS Code–style).
      // R rename · C copy · X cut · V paste (move after cut via ↑↓ then V).
      if (!isModKey(event) && !event.altKey && !event.shiftKey && current) {
        const key = event.key.toLowerCase();
        if (key === "r") {
          event.preventDefault();
          setPendingRenameId(current.node.id);
          return;
        }
        if (key === "c") {
          event.preventDefault();
          copyItem(current.node.path);
          return;
        }
        if (key === "x") {
          event.preventDefault();
          cutItem(current.node.path);
          return;
        }
        if (key === "v") {
          event.preventDefault();
          const targetParentId =
            current.node.kind === "folder"
              ? current.node.id
              : current.parentId;
          void pasteInto(targetParentId);
          return;
        }
      }

      if (isModKey(event) && !event.altKey) {
        const key = event.key.toLowerCase();
        if (key === "x" && current) {
          event.preventDefault();
          cutItem(current.node.path);
          return;
        }
        if (key === "c" && current) {
          event.preventDefault();
          copyItem(current.node.path);
          return;
        }
        if (key === "v") {
          event.preventDefault();
          const targetParentId =
            current?.node.kind === "folder"
              ? current.node.id
              : current?.parentId;
          void pasteInto(targetParentId);
          return;
        }
      }

      if (event.key === "F2" && current) {
        event.preventDefault();
        setPendingRenameId(current.node.id);
        return;
      }

      if (
        (event.key === "Delete" || event.key === "Backspace") &&
        current &&
        !isModKey(event)
      ) {
        event.preventDefault();
        setPendingDeleteId(current.node.id);
        return;
      }

      if (
        event.shiftKey &&
        (event.key === "ArrowDown" || event.key === "ArrowUp")
      ) {
        event.preventDefault();
        const extended = extendTreeSelection(
          event.key === "ArrowDown" ? "down" : "up",
          visibleItems,
          focusedId,
          selectedIds,
          selectionAnchorId,
        );
        if (!extended) return;
        setSelectedIds(extended.selectedIds);
        setSelectionAnchorId(extended.anchorId);
        setFocusedId(extended.focusedId);
        return;
      }

      switch (event.key) {
        case "ArrowDown": {
          event.preventDefault();
          const nextIndex =
            currentIndex < visibleItems.length - 1 ? currentIndex + 1 : 0;
          selectOnly(visibleItems[nextIndex]!.node.id);
          break;
        }
        case "ArrowUp": {
          event.preventDefault();
          const nextIndex =
            currentIndex > 0
              ? currentIndex - 1
              : visibleItems.length - 1;
          selectOnly(visibleItems[nextIndex]!.node.id);
          break;
        }
        case "ArrowRight": {
          if (currentIndex < 0) {
            return;
          }

          const item = visibleItems[currentIndex]!;
          if (item.node.kind !== "folder") {
            return;
          }

          event.preventDefault();
          if (!openFolderIds.has(item.node.id)) {
            toggleFolder(item.node.id);
            return;
          }

          const next = visibleItems[currentIndex + 1];
          if (next?.parentId === item.node.id) {
            selectOnly(next.node.id);
          }
          break;
        }
        case "ArrowLeft": {
          if (currentIndex < 0) {
            return;
          }

          const item = visibleItems[currentIndex]!;
          event.preventDefault();

          if (
            item.node.kind === "folder" &&
            openFolderIds.has(item.node.id)
          ) {
            toggleFolder(item.node.id);
            return;
          }

          if (item.parentId) {
            selectOnly(item.parentId);
          }
          break;
        }
      }
    },
    [
      clearMultiSelection,
      copyItem,
      cutItem,
      filteredTree,
      focusedId,
      openFolderIds,
      pasteInto,
      selectOnly,
      selectedIds,
      selectionAnchorId,
      setFocusedId,
      setPendingDeleteId,
      setPendingRenameId,
      setSelectedIds,
      setSelectionAnchorId,
      toggleFolder,
      tree,
    ],
  );

  return { handleTreeKeyDown };
}
