"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback } from "react";
import { toast } from "sonner";

import type { Doc, Id } from "@/convex/_generated/dataModel";
import {
  useCreateProjectFile,
  useDuplicateProjectFile,
  useMoveProjectFile,
} from "@/features/workspace/hooks/use-project-files";
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
  };
}
