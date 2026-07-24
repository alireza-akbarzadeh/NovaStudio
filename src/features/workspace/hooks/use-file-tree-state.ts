/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import type { Id } from "@/convex/_generated/dataModel";
import { useProjectAccess } from "@/features/projects/hooks/use-project-access";
import { useProject } from "@/features/projects/hooks/use-projects";
import {
  useProjectFiles,
  useSeedProjectFiles,
} from "@/features/workspace/hooks/use-project-files";
import { buildFileTree } from "@/features/workspace/lib/file-tree";
import {
  collectFolderIdsFromTree,
  filterFileTree,
} from "@/features/workspace/lib/search";

import { collectFolderIds, findNodeByPath } from "../components/file-tree/tree-utils";
import type { PendingCreate } from "../components/file-tree/types";

export function useFileTreeState(projectId: string) {
  const files = useProjectFiles(projectId);
  const project = useProject({ projectId });
  const access = useProjectAccess(projectId);
  const canEdit = access?.canEdit ?? false;
  const seedDefaults = useSeedProjectFiles();
  const pathname = usePathname();

  const [collapseKey, setCollapseKey] = useState(0);
  const [openFolderIds, setOpenFolderIds] = useState<Set<Id<"projectFiles">>>(
    new Set(),
  );
  const [focusedId, setFocusedId] = useState<Id<"projectFiles"> | null>(null);
  const [pendingCreate, setPendingCreate] = useState<PendingCreate | null>(null);
  const [pendingRenameId, setPendingRenameId] =
    useState<Id<"projectFiles"> | null>(null);
  const [pendingDeleteId, setPendingDeleteId] =
    useState<Id<"projectFiles"> | null>(null);
  const [treeFilter, setTreeFilter] = useState("");

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

    if (collapseKey === 0) {
      setOpenFolderIds(new Set(collectFolderIds(tree)));
    }
  }, [tree, filteredTree, collapseKey, isFiltering]);

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
    }
  }, [tree, pathname, focusedId]);

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

  return {
    files,
    canEdit,
    collapseKey,
    openFolderIds,
    setOpenFolderIds,
    focusedId,
    setFocusedId,
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
