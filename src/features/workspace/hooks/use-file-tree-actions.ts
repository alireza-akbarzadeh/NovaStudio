"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback } from "react";
import { toast } from "sonner";

import type { Doc, Id } from "@/convex/_generated/dataModel";
import {
  useCreateProjectFile,
  useDeleteProjectFile,
  useDuplicateProjectFile,
  useMoveProjectFile,
  useWriteFileAtPath,
} from "@/features/workspace/hooks/use-project-files";
import {
  prepareFileUploads,
  summarizeUploadResult,
} from "@/features/workspace/lib/file-tree-upload";
import { pruneNestedSelectedPaths } from "@/features/workspace/lib/file-tree-selection";
import { useWorkspaceStore } from "@/features/workspace/store/workspace-store";

import {
  toTerminalCwd,
} from "../components/file-tree/tree-utils";
import type { PendingCreate } from "../components/file-tree/types";

import { attachPathsToChat } from "./file-tree-attach";
import { duplicateTreeItem, pasteIntoFolder } from "./file-tree-paste";

type UseFileTreeActionsParams = {
  projectId: string;
  files: Doc<"projectFiles">[] | undefined;
  pendingCreate: PendingCreate | null;
  cancelCreate: () => void;
  setOpenFolderIds: React.Dispatch<
    React.SetStateAction<Set<Id<"projectFiles">>>
  >;
};

export function useFileTreeActions({
  projectId,
  files,
  pendingCreate,
  cancelCreate,
  setOpenFolderIds,
}: UseFileTreeActionsParams) {
  const router = useRouter();
  const pathname = usePathname();
  const createFile = useCreateProjectFile();
  const moveFile = useMoveProjectFile();
  const duplicateFile = useDuplicateProjectFile();
  const writeFileAtPath = useWriteFileAtPath();
  const deleteFile = useDeleteProjectFile();

  const treeClipboard = useWorkspaceStore((s) => s.treeClipboard);
  const setTreeClipboard = useWorkspaceStore((s) => s.setTreeClipboard);
  const clearTreeClipboard = useWorkspaceStore((s) => s.clearTreeClipboard);
  const openFindInFiles = useWorkspaceStore((s) => s.openFindInFiles);
  const requestTerminalCwd = useWorkspaceStore((s) => s.requestTerminalCwd);

  const commitCreate = useCallback(
    async (name: string) => {
      if (!pendingCreate) return;

      const trimmed = name.trim();
      if (!trimmed) {
        cancelCreate();
        return;
      }

      const { kind, parentId } = pendingCreate;

      try {
        const fileId = await createFile({
          projectId: projectId as Id<"projects">,
          name: trimmed,
          parentId,
          kind,
          content: kind === "file" ? "" : undefined,
        });
        cancelCreate();

        if (kind === "file") {
          const created = files?.find((f) => f._id === fileId);
          if (created) {
            router.push(`/projects/${projectId}/files/${created.path}`);
          }
        } else {
          toast.success("Folder created");
        }
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to create item",
        );
      }
    },
    [cancelCreate, createFile, files, pendingCreate, projectId, router],
  );

  const copyPathToClipboard = useCallback(async (path: string, label: string) => {
    try {
      await navigator.clipboard.writeText(path);
      toast.success(`${label} copied`);
    } catch {
      toast.error(`Failed to copy ${label.toLowerCase()}`);
    }
  }, []);

  const cutItem = useCallback(
    (path: string) => {
      setTreeClipboard({ mode: "cut", projectId, path });
      toast.message("Ready to move");
    },
    [projectId, setTreeClipboard],
  );

  const copyItem = useCallback(
    (path: string) => {
      setTreeClipboard({ mode: "copy", projectId, path });
      toast.message("Ready to paste");
    },
    [projectId, setTreeClipboard],
  );

  const pasteInto = useCallback(
    async (targetParentId?: Id<"projectFiles">) => {
      if (!treeClipboard || treeClipboard.projectId !== projectId) {
        return;
      }

      await pasteIntoFolder(targetParentId, {
        projectId,
        pathname,
        router,
        files,
        treeClipboard,
        moveFile,
        duplicateFile,
        clearTreeClipboard,
        setOpenFolderIds,
      });
    },
    [
      clearTreeClipboard,
      duplicateFile,
      files,
      moveFile,
      pathname,
      projectId,
      router,
      setOpenFolderIds,
      treeClipboard,
    ],
  );

  const duplicateItem = useCallback(
    async (path: string) => {
      await duplicateTreeItem(path, projectId, files, duplicateFile, router);
    },
    [duplicateFile, files, projectId, router],
  );

  const openInTerminal = useCallback(
    (folderPath: string) => {
      requestTerminalCwd(toTerminalCwd(folderPath));
    },
    [requestTerminalCwd],
  );

  const findInFolder = useCallback(
    (folderPath = "") => {
      openFindInFiles({ folderScope: folderPath || null, mode: "text" });
    },
    [openFindInFiles],
  );

  const attachToChat = useCallback(
    (path: string, kind: "file" | "folder", asNewChat: boolean) => {
      if (!files) return;
      attachPathsToChat(files, path, kind, asNewChat);
    },
    [files],
  );

  const uploadFiles = useCallback(
    async (
      incoming: File[],
      targetParentId?: Id<"projectFiles">,
    ) => {
      if (incoming.length === 0) return;

      const targetParent = targetParentId
        ? files?.find((file) => file._id === targetParentId)
        : undefined;
      const targetParentPath =
        targetParent?.kind === "folder" ? targetParent.path : undefined;

      try {
        const { writes, skipped } = await prepareFileUploads(incoming, {
          targetParentPath,
          existingPaths: (files ?? []).map((file) => file.path),
        });

        if (writes.length === 0) {
          toast.message(summarizeUploadResult(0, skipped));
          return;
        }

        for (const write of writes) {
          await writeFileAtPath({
            projectId: projectId as Id<"projects">,
            path: write.path,
            content: write.content,
          });
        }

        if (targetParentId) {
          setOpenFolderIds((current) => {
            if (current.has(targetParentId)) return current;
            const next = new Set(current);
            next.add(targetParentId);
            return next;
          });
        }

        toast.success(summarizeUploadResult(writes.length, skipped));

        if (writes.length === 1) {
          router.push(`/projects/${projectId}/files/${writes[0]!.path}`);
        }
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to upload files",
        );
      }
    },
    [files, projectId, router, setOpenFolderIds, writeFileAtPath],
  );

  const moveItemsToFolder = useCallback(
    async (paths: string[], targetParentId?: Id<"projectFiles">) => {
      if (!files || paths.length === 0) return;

      const selected = paths
        .map((path) => files.find((file) => file.path === path))
        .filter((file): file is Doc<"projectFiles"> => Boolean(file))
        .map((file) => ({ path: file.path, kind: file.kind }));

      const roots = pruneNestedSelectedPaths(selected);
      if (roots.length === 0) return;

      let moved = 0;
      let activeRedirect: string | null = null;
      const activePath = pathname.match(/\/files\/(.+)$/)?.[1];
      const decodedActive = activePath
        ? decodeURIComponent(activePath)
        : null;

      try {
        for (const path of roots) {
          const item = files.find((file) => file.path === path);
          if (!item) continue;

          const sameParent =
            (item.parentId ?? undefined) === (targetParentId ?? undefined);
          if (sameParent) continue;

          const newPath = await moveFile({
            projectId: projectId as Id<"projects">,
            path,
            newParentId: targetParentId,
          });
          moved += 1;

          if (
            decodedActive &&
            (decodedActive === path ||
              decodedActive.startsWith(`${path}/`))
          ) {
            const suffix = decodedActive.slice(path.length);
            activeRedirect = `${newPath}${suffix}`;
          }
        }

        if (moved === 0) return;

        if (targetParentId) {
          setOpenFolderIds((current) => {
            if (current.has(targetParentId)) return current;
            const next = new Set(current);
            next.add(targetParentId);
            return next;
          });
        }

        if (activeRedirect) {
          router.push(`/projects/${projectId}/files/${activeRedirect}`);
        }

        toast.success(moved === 1 ? "Moved" : `Moved ${moved} items`);
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to move",
        );
      }
    },
    [files, moveFile, pathname, projectId, router, setOpenFolderIds],
  );

  const deleteItems = useCallback(
    async (paths: string[]) => {
      if (!files || paths.length === 0) return;

      const selected = paths
        .map((path) => files.find((file) => file.path === path))
        .filter((file): file is Doc<"projectFiles"> => Boolean(file))
        .map((file) => ({ path: file.path, kind: file.kind }));

      const roots = pruneNestedSelectedPaths(selected);
      if (roots.length === 0) return;

      const activePath = pathname.match(/\/files\/(.+)$/)?.[1];
      const decodedActive = activePath
        ? decodeURIComponent(activePath)
        : null;
      let shouldLeaveEditor = false;

      try {
        for (const path of roots) {
          if (
            decodedActive &&
            (decodedActive === path ||
              decodedActive.startsWith(`${path}/`))
          ) {
            shouldLeaveEditor = true;
          }
          await deleteFile({
            projectId: projectId as Id<"projects">,
            path,
          });
        }

        if (shouldLeaveEditor) {
          router.push(`/projects/${projectId}`);
        }

        toast.success(
          roots.length === 1 ? "Deleted" : `Deleted ${roots.length} items`,
        );
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to delete",
        );
      }
    },
    [deleteFile, files, pathname, projectId, router],
  );

  return {
    treeClipboard,
    commitCreate,
    copyPathToClipboard,
    cutItem,
    copyItem,
    pasteInto,
    duplicateItem,
    openInTerminal,
    findInFolder,
    attachToChat,
    uploadFiles,
    moveItemsToFolder,
    deleteItems,
  };
}
