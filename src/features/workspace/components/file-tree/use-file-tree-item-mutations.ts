"use client";

import { usePathname, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import type { Id } from "@/convex/_generated/dataModel";
import { useRenameProjectFile } from "@/features/workspace/hooks/use-project-files";
import { pruneNestedSelectedPaths } from "@/features/workspace/lib/file-tree-selection";

type UseFileTreeItemMutationsParams = {
  nodePath: string;
  nodeName: string;
  nodeId: Id<"projectFiles">;
  projectId: string;
  isFolder: boolean;
  href: string;
  isDeleteRequested: boolean;
  onPendingDeleteHandled: () => void;
  selectedIds: Set<Id<"projectFiles">>;
  files?: Array<{
    _id: Id<"projectFiles">;
    path: string;
    kind: "file" | "folder";
  }>;
  onDeleteItems?: (paths: string[]) => Promise<void>;
};

export function useFileTreeItemMutations({
  nodePath,
  nodeName,
  nodeId,
  projectId,
  isFolder,
  href,
  isDeleteRequested,
  onPendingDeleteHandled,
  selectedIds,
  files,
  onDeleteItems,
}: UseFileTreeItemMutationsParams) {
  const pathname = usePathname();
  const router = useRouter();
  const renameFile = useRenameProjectFile();

  const [deleteOpen, setDeleteOpen] = useState(false);
  const deleteDialogOpen = deleteOpen || isDeleteRequested;

  const deletePaths = useMemo(() => {
    if (selectedIds.has(nodeId) && selectedIds.size > 1 && files) {
      const selected = files
        .filter((file) => selectedIds.has(file._id))
        .map((file) => ({ path: file.path, kind: file.kind }));
      return pruneNestedSelectedPaths(selected);
    }
    return [nodePath];
  }, [files, nodeId, nodePath, selectedIds]);

  const commitRename = async (renameValue: string) => {
    const name = renameValue.trim();
    if (!name || name === nodeName) return;

    try {
      const newPath = await renameFile({
        projectId: projectId as Id<"projects">,
        path: nodePath,
        name,
      });
      if (!isFolder && pathname === href) {
        router.push(`/projects/${projectId}/files/${newPath}`);
      }
      toast.success("Renamed");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to rename",
      );
    }
  };

  const handleDelete = async () => {
    try {
      if (onDeleteItems) {
        await onDeleteItems(deletePaths);
      }
    } finally {
      setDeleteOpen(false);
      if (isDeleteRequested) {
        onPendingDeleteHandled();
      }
    }
  };

  const setDeleteDialogOpen = (open: boolean) => {
    setDeleteOpen(open);
    if (!open && isDeleteRequested) {
      onPendingDeleteHandled();
    }
  };

  return {
    deleteDialogOpen,
    setDeleteDialogOpen,
    commitRename,
    handleDelete,
    openDeleteDialog: () => setDeleteOpen(true),
    deleteCount: deletePaths.length,
  };
}
