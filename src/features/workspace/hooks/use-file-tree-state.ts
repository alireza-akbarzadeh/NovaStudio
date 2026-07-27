/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { Id } from "@/convex/_generated/dataModel";
import { useProjectAccess } from "@/features/projects/hooks/use-project-access";
import { useProject } from "@/features/projects/hooks/use-projects";
import {
  useProjectFileMetadata,
  useSeedProjectFiles,
} from "@/features/workspace/hooks/use-project-files";
import { buildFileTree } from "@/features/workspace/lib/file-tree";
import {
  collectFolderIdsFromTree,
  filterFileTree,
} from "@/features/workspace/lib/search";
import { useWorkspaceStore } from "@/features/workspace/store/workspace-store";

import {
  collectFolderIds,
  findNodeByPath,
  flattenVisibleTree,
} from "../components/file-tree/tree-utils";
import type { PendingCreate } from "../components/file-tree/types";
import {
  computeTreeSelection,
  type TreeSelectModifiers,
} from "../lib/file-tree-selection";

export function useFileTreeState(projectId: string) {
  const files = useProjectFileMetadata(projectId);
  const project = useProject({ projectId });
  const access = useProjectAccess(projectId);
  const canEdit = access?.canEdit ?? false;
  const seedDefaults = useSeedProjectFiles();
  const pathname = usePathname();
  const setFileTreeState = useWorkspaceStore((s) => s.setFileTreeState);
  const getFileTreeState = useWorkspaceStore((s) => s.getFileTreeState);
  const skipPersistRef = useRef(true);

  const [collapseKey, setCollapseKey] = useState(0);
  const [openFolderIds, setOpenFolderIds] = useState<Set<Id<"projectFiles">>>(
    new Set(),
  );
  const [focusedId, setFocusedId] = useState<Id<"projectFiles"> | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<Id<"projectFiles">>>(
    new Set(),
  );
  const [selectionAnchorId, setSelectionAnchorId] =
    useState<Id<"projectFiles"> | null>(null);
  const [pendingCreate, setPendingCreate] = useState<PendingCreate | null>(null);
  const [pendingRenameId, setPendingRenameId] =
    useState<Id<"projectFiles"> | null>(null);
  const [pendingDeleteId, setPendingDeleteId] =
    useState<Id<"projectFiles"> | null>(null);
  const [treeFilter, setTreeFilter] = useState("");

  useEffect(() => {
    const stored = getFileTreeState(projectId);
    skipPersistRef.current = true;
    setOpenFolderIds(new Set(stored.openFolderIds as Id<"projectFiles">[]));
    setTreeFilter(stored.treeFilter);
    setFocusedId(stored.focusedId as Id<"projectFiles"> | null);
    setSelectedIds(new Set(stored.selectedIds as Id<"projectFiles">[]));
    setSelectionAnchorId(
      stored.selectionAnchorId as Id<"projectFiles"> | null,
    );
    setCollapseKey(0);
    queueMicrotask(() => {
      skipPersistRef.current = false;
    });
  }, [getFileTreeState, projectId]);

  useEffect(() => {
    if (skipPersistRef.current) {
      return;
    }

    setFileTreeState(projectId, {
      openFolderIds: [...openFolderIds],
      treeFilter,
      focusedId,
      selectedIds: [...selectedIds],
      selectionAnchorId,
    });
  }, [
    focusedId,
    openFolderIds,
    projectId,
    selectedIds,
    selectionAnchorId,
    setFileTreeState,
    treeFilter,
  ]);

  const tree = useMemo(
    () => (files ? buildFileTree(files) : undefined),
    [files],
  );

  const filteredTree = useMemo(() => {
    if (!tree) return undefined;
    return filterFileTree(tree, treeFilter);
  }, [tree, treeFilter]);

  const isFiltering = treeFilter.trim().length > 0;

  useEffect(() => {
    if (!tree) {
      return;
    }

    if (isFiltering && filteredTree) {
      setOpenFolderIds(new Set(collectFolderIdsFromTree(filteredTree)));
      return;
    }

    const stored = getFileTreeState(projectId);
    const hasStoredFolders = stored.openFolderIds.length > 0;

    if (collapseKey === 0 && !hasStoredFolders) {
      setOpenFolderIds(new Set(collectFolderIds(tree)));
    }
  }, [collapseKey, filteredTree, getFileTreeState, isFiltering, projectId, tree]);

  useEffect(() => {
    if (!tree || focusedId !== null) {
      return;
    }

    const activePath = pathname.match(/\/files\/(.+)$/)?.[1];
    if (!activePath) {
      return;
    }

    const activeNode = findNodeByPath(tree, decodeURIComponent(activePath));
    if (activeNode) {
      setFocusedId(activeNode.id);
      setSelectedIds(new Set([activeNode.id]));
      setSelectionAnchorId(activeNode.id);
    }
  }, [tree, pathname, focusedId]);

  useEffect(() => {
    if (!files) return;
    const valid = new Set(files.map((file) => file._id));
    setSelectedIds((current) => {
      let changed = false;
      const next = new Set<Id<"projectFiles">>();
      for (const id of current) {
        if (valid.has(id)) {
          next.add(id);
        } else {
          changed = true;
        }
      }
      return changed ? next : current;
    });
    setSelectionAnchorId((current) =>
      current && valid.has(current) ? current : null,
    );
  }, [files]);

  useEffect(() => {
    if (!focusedId) {
      return;
    }

    const element = document.querySelector(
      `[data-tree-item-id="${focusedId}"]`,
    );
    if (element instanceof HTMLElement) {
      element.focus();
      element.scrollIntoView({ block: "nearest" });
    }
  }, [focusedId]);

  useEffect(() => {
    if (
      files !== undefined &&
      files.length === 0 &&
      project &&
      !project.syncedAt &&
      project.importStatus !== "importing" &&
      project.source !== "github" &&
      project.templateId !== "empty"
    ) {
      void seedDefaults({ projectId: projectId as Id<"projects"> });
    }
  }, [files, project, projectId, seedDefaults]);

  const toggleFolder = useCallback((folderId: Id<"projectFiles">) => {
    setOpenFolderIds((current) => {
      const next = new Set(current);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  }, []);

  const collapseAll = useCallback(() => {
    setCollapseKey((key) => key + 1);
    setOpenFolderIds(new Set());
  }, []);

  const startCreate = useCallback(
    (kind: "file" | "folder", parentId?: Id<"projectFiles">) => {
      setPendingCreate({ kind, parentId });
      if (parentId) {
        setOpenFolderIds((current) => {
          if (current.has(parentId)) return current;
          const next = new Set(current);
          next.add(parentId);
          return next;
        });
      }
    },
    [],
  );

  const cancelCreate = useCallback(() => {
    setPendingCreate(null);
  }, []);

  const selectItem = useCallback(
    (id: Id<"projectFiles">, modifiers: TreeSelectModifiers = {}) => {
      const visibleItems = flattenVisibleTree(
        filteredTree ?? tree ?? [],
        openFolderIds,
      );
      const next = computeTreeSelection(
        id,
        visibleItems,
        selectedIds,
        selectionAnchorId,
        modifiers,
      );
      setSelectedIds(next.selectedIds);
      setSelectionAnchorId(next.anchorId);
      setFocusedId(next.focusedId);
    },
    [
      filteredTree,
      openFolderIds,
      selectedIds,
      selectionAnchorId,
      tree,
    ],
  );

  const selectOnly = useCallback((id: Id<"projectFiles">) => {
    setFocusedId(id);
    setSelectedIds(new Set([id]));
    setSelectionAnchorId(id);
  }, []);

  const clearMultiSelection = useCallback(() => {
    if (focusedId) {
      setSelectedIds(new Set([focusedId]));
      setSelectionAnchorId(focusedId);
      return;
    }
    setSelectedIds(new Set());
    setSelectionAnchorId(null);
  }, [focusedId]);

  return {
    files,
    canEdit,
    collapseKey,
    openFolderIds,
    setOpenFolderIds,
    focusedId,
    setFocusedId,
    selectOnly,
    selectedIds,
    selectionAnchorId,
    setSelectedIds,
    setSelectionAnchorId,
    selectItem,
    clearMultiSelection,
    pendingCreate,
    pendingRenameId,
    setPendingRenameId,
    pendingDeleteId,
    setPendingDeleteId,
    treeFilter,
    setTreeFilter,
    tree,
    filteredTree,
    isFiltering,
    toggleFolder,
    collapseAll,
    startCreate,
    cancelCreate,
  };
}
