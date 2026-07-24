"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import type { Id } from "@/convex/_generated/dataModel";
import {
  useDeleteProjectFile,
  useRenameProjectFile,
} from "@/features/workspace/hooks/use-project-files";

type UseFileTreeItemMutationsParams = {
  nodePath: string;
  nodeName: string;
  projectId: string;
  isFolder: boolean;
  href: string;
  isDeleteRequested: boolean;
  onPendingDeleteHandled: () => void;
};

export function useFileTreeItemMutations({
  nodePath,
  nodeName,
  projectId,
  isFolder,
  href,
  isDeleteRequested,
  onPendingDeleteHandled,
}: UseFileTreeItemMutationsParams) {
  const pathname = usePathname();
  const router = useRouter();
  const renameFile = useRenameProjectFile();
  const deleteFile = useDeleteProjectFile();

  const [deleteOpen, setDeleteOpen] = useState(false);
  const deleteDialogOpen = deleteOpen || isDeleteRequested;

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
      const wasActive = !isFolder && pathname === href;
      await deleteFile({
        projectId: projectId as Id<"projects">,
        path: nodePath,
      });
      if (wasActive) {
        router.push(`/projects/${projectId}`);
      }
      toast.success("Deleted");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete",
      );
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
  };
}
